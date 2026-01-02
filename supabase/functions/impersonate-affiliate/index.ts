import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roles) {
      throw new Error('Only admins can impersonate affiliates');
    }

    const { affiliateId, action } = await req.json();

    // Handle return from impersonation
    if (action === 'return') {
      console.log('Admin', user.id, 'returning from impersonation');
      return new Response(
        JSON.stringify({ success: true, message: 'Returned to admin' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Handle impersonation
    if (!affiliateId) {
      throw new Error('Affiliate ID is required');
    }

    // Get the affiliate and their auth_user_id
    const { data: affiliate, error: affiliateError } = await supabaseAdmin
      .from('affiliates')
      .select('id, auth_user_id, email, first_name, last_name, kyc_pass, kyc_submitted_at')
      .eq('id', affiliateId)
      .single();

    if (affiliateError || !affiliate) {
      throw new Error('Affiliate not found');
    }

    let authUserId = affiliate.auth_user_id;
    let userEmail = affiliate.email;

    // If no auth_user_id exists, create a user account automatically
    if (!authUserId) {
      console.log('Creating user account for affiliate', affiliateId);
      
      // Generate a secure random password
      const tempPassword = crypto.randomUUID() + crypto.randomUUID();
      
      // Create the user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: affiliate.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: affiliate.first_name,
          last_name: affiliate.last_name
        }
      });

      if (createError || !newUser.user) {
        console.error('Failed to create user:', createError);
        throw new Error('Failed to create user account for this affiliate');
      }

      authUserId = newUser.user.id;

      // Link the auth_user_id to the affiliate record
      const { error: linkError } = await supabaseAdmin
        .from('affiliates')
        .update({ auth_user_id: authUserId })
        .eq('id', affiliateId);

      if (linkError) {
        console.error('Failed to link auth_user_id:', linkError);
        // Continue anyway - the user is created, we just couldn't link it
      }

      // Assign affiliate role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authUserId,
          role: 'affiliate'
        });

      if (roleError) {
        console.error('Failed to assign affiliate role:', roleError);
        // Continue anyway
      }

      console.log('User account created successfully for affiliate', affiliateId);
    }

    // Get user email from auth (or use the one we just created)
    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(
      authUserId
    );

    if (authUserError || !authUser.user) {
      throw new Error('Failed to get affiliate user account');
    }

    userEmail = authUser.user.email!;

    // Generate a one-time sign-in link for the affiliate
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: authUser.user.email!,
      options: {
        redirectTo: `${req.headers.get('origin')}/`
      }
    });

    if (linkError || !linkData) {
      throw new Error('Failed to generate sign-in link');
    }

    console.log('Admin', user.id, 'impersonating affiliate', affiliateId);

    // Determine redirect path based on KYC status
    let redirectPath = '/';
    if (!affiliate.kyc_pass && !affiliate.kyc_submitted_at) {
      redirectPath = '/kyc-completion';
    } else if (affiliate.kyc_pass) {
      redirectPath = '/affiliate-dashboard';
    } else {
      // KYC submitted but not passed - send to affiliate dashboard
      redirectPath = '/affiliate-dashboard';
    }

    return new Response(
      JSON.stringify({
        success: true,
        affiliate: {
          id: affiliate.id,
          name: `${affiliate.first_name} ${affiliate.last_name}`,
          kyc_pass: affiliate.kyc_pass,
          email: authUser.user.email
        },
        magicLink: linkData.properties.action_link,
        redirectPath
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred during impersonation'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});