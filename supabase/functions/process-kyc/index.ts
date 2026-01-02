import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { Resend } from 'npm:resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface KYCData {
  email: string;
  phone: string;
  taxId: string;
  address: string;
  city: string;
  stateProvince: string;
  postalCode: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    const { kycData } = await req.json() as { kycData: KYCData };

    console.log('Processing KYC for user:', user.id);

    // Get current affiliate record
    const { data: currentAffiliate, error: affiliateError } = await supabaseClient
      .from('affiliates')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (affiliateError || !currentAffiliate) {
      throw new Error('Affiliate record not found');
    }

    // Check for duplicates
    const duplicateReasons: string[] = [];
    let matchType: 'affiliate' | 'customer' | null = null;

    // Check duplicate email in affiliates (excluding current affiliate)
    const { data: emailAffDupes } = await supabaseClient
      .from('affiliates')
      .select('id, email')
      .eq('email', kycData.email)
      .neq('id', currentAffiliate.id)
      .is('deleted_at', null);

    if (emailAffDupes && emailAffDupes.length > 0) {
      duplicateReasons.push('Duplicate Email');
      matchType = 'affiliate';
    }

    // Check duplicate email in customers
    if (!matchType) {
      const { data: emailCustDupes } = await supabaseClient
        .from('customers')
        .select('id, email')
        .eq('email', kycData.email)
        .is('deleted_at', null);

      if (emailCustDupes && emailCustDupes.length > 0) {
        duplicateReasons.push('Duplicate Email');
        matchType = 'customer';
      }
    }

    // Check duplicate phone in affiliates (excluding current affiliate)
    const { data: phoneAffDupes } = await supabaseClient
      .from('affiliates')
      .select('id, phone')
      .eq('phone', kycData.phone)
      .neq('id', currentAffiliate.id)
      .is('deleted_at', null);

    if (phoneAffDupes && phoneAffDupes.length > 0) {
      duplicateReasons.push('Duplicate Phone');
      if (!matchType) matchType = 'affiliate';
    }

    // Check duplicate phone in customers
    if (!matchType || matchType === 'customer') {
      const { data: phoneCustDupes } = await supabaseClient
        .from('customers')
        .select('id, phone')
        .eq('phone', kycData.phone)
        .is('deleted_at', null);

      if (phoneCustDupes && phoneCustDupes.length > 0) {
        if (!duplicateReasons.includes('Duplicate Phone')) {
          duplicateReasons.push('Duplicate Phone');
        }
        matchType = 'customer';
      }
    }

    // Check duplicate address in affiliates (excluding current affiliate)
    const { data: addressAffDupes } = await supabaseClient
      .from('affiliates')
      .select('id, address, city, state_province, postal_code')
      .eq('address', kycData.address)
      .eq('city', kycData.city)
      .eq('state_province', kycData.stateProvince)
      .eq('postal_code', kycData.postalCode)
      .neq('id', currentAffiliate.id)
      .is('deleted_at', null);

    if (addressAffDupes && addressAffDupes.length > 0) {
      duplicateReasons.push('Duplicate Address');
      if (!matchType) matchType = 'affiliate';
    }

    // Check duplicate address in customers
    if (!matchType || matchType === 'customer') {
      const { data: addressCustDupes } = await supabaseClient
        .from('customers')
        .select('id, address, city, state_province, postal_code')
        .eq('address', kycData.address)
        .eq('city', kycData.city)
        .eq('state_province', kycData.stateProvince)
        .eq('postal_code', kycData.postalCode)
        .is('deleted_at', null);

      if (addressCustDupes && addressCustDupes.length > 0) {
        if (!duplicateReasons.includes('Duplicate Address')) {
          duplicateReasons.push('Duplicate Address');
        }
        matchType = 'customer';
      }
    }

    // Check duplicate tax ID in affiliates only (excluding current affiliate)
    const { data: taxIdDupes } = await supabaseClient
      .from('affiliates')
      .select('id, tax_id')
      .eq('tax_id', kycData.taxId)
      .neq('id', currentAffiliate.id)
      .is('deleted_at', null);

    if (taxIdDupes && taxIdDupes.length > 0) {
      duplicateReasons.push('Duplicate SSN/EIN');
      if (!matchType) matchType = 'affiliate';
    }

    if (duplicateReasons.length > 0) {
      // Duplicates found - need to convert to customer and mark as rejected
      const rejectionReason = `Did not pass KYC - ${duplicateReasons.join(', ')}`;

      console.log('Duplicates found:', duplicateReasons);

      // Create customer record from affiliate data
      const { error: customerError } = await supabaseClient
        .from('customers')
        .insert({
          customer_id: currentAffiliate.affiliate_id,
          first_name: currentAffiliate.first_name,
          last_name: currentAffiliate.last_name,
          email: kycData.email,
          phone: kycData.phone,
          address: kycData.address,
          city: kycData.city,
          state_province: kycData.stateProvince,
          postal_code: kycData.postalCode,
          status: 'inactive',
          enrolled_by: currentAffiliate.enrolled_by,
        });

      if (customerError) {
        console.error('Error creating customer:', customerError);
        throw new Error('Failed to create customer record');
      }

      // Add note to customer about KYC failure
      const { data: customer } = await supabaseClient
        .from('customers')
        .select('id')
        .eq('email', kycData.email)
        .single();

      if (customer) {
        await supabaseClient
          .from('customer_notes')
          .insert({
            customer_id: customer.id,
            note_text: rejectionReason,
            note_type: 'note',
            created_by: user.id,
          });
      }

      // Update affiliate record with rejection
      const { error: updateError } = await supabaseClient
        .from('affiliates')
        .update({
          kyc_data: kycData,
          kyc_submitted_at: new Date().toISOString(),
          kyc_rejection_reason: rejectionReason,
          kyc_pass: false,
          status: 'inactive',
        })
        .eq('id', currentAffiliate.id);

      if (updateError) {
        console.error('Error updating affiliate status to inactive:', updateError);
        throw new Error('Failed to update affiliate status');
      }

      console.log('Affiliate status updated to inactive after KYC failure');

      // Send email notification to enrolling affiliate
      if (currentAffiliate.enrolled_by) {
        const { data: enrollingAffiliate } = await supabaseClient
          .from('affiliates')
          .select('first_name, last_name, email')
          .eq('id', currentAffiliate.enrolled_by)
          .single();

        if (enrollingAffiliate && enrollingAffiliate.email) {
          try {
            const affiliateName = `${currentAffiliate.first_name} ${currentAffiliate.last_name}`;
            
            await resend.emails.send({
              from: 'Theon Global <onboarding@resend.dev>',
              to: [enrollingAffiliate.email],
              subject: 'KYC Verification Failed - Action Required',
              html: `
                <h2>KYC Verification Failed</h2>
                <p>Dear ${enrollingAffiliate.first_name} ${enrollingAffiliate.last_name},</p>
                <p>The affiliate you enrolled, <strong>${affiliateName}</strong> (${kycData.email}), did not pass KYC verification.</p>
                <p><strong>Reason:</strong> ${rejectionReason}</p>
                <p>The affiliate has been marked as inactive and converted to a customer record.</p>
                <p>If you believe this is an error or need assistance, please contact support.</p>
                <br>
                <p>Best regards,<br>Theon Global Team</p>
              `,
            });

            console.log('KYC failure notification sent to enrolling affiliate:', enrollingAffiliate.email);
          } catch (emailError) {
            console.error('Error sending KYC failure notification:', emailError);
            // Don't throw - we still want to return the KYC rejection even if email fails
          }
        }
      }

      return new Response(
        JSON.stringify({
          approved: false,
          reason: rejectionReason,
          duplicates: duplicateReasons,
          matchType: matchType,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No duplicates - approve KYC and set status to active
    const { error: updateError } = await supabaseClient
      .from('affiliates')
      .update({
        email: kycData.email,
        phone: kycData.phone,
        tax_id: kycData.taxId,
        address: kycData.address,
        city: kycData.city,
        state_province: kycData.stateProvince,
        postal_code: kycData.postalCode,
        kyc_data: kycData,
        kyc_submitted_at: new Date().toISOString(),
        kyc_approved_at: new Date().toISOString(),
        kyc_pass: true,
        status: 'active',
        kyc_rejection_reason: null,
      })
      .eq('id', currentAffiliate.id);

    if (updateError) {
      console.error('Error updating affiliate:', updateError);
      throw updateError;
    }

    console.log('KYC approved for affiliate:', currentAffiliate.id);

    return new Response(
      JSON.stringify({ approved: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in process-kyc function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
