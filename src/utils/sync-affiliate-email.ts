import { supabase } from "@/integrations/supabase/client";

/**
 * Syncs an affiliate's auth email to match their affiliates table email
 * This is needed when the auth.users email doesn't match the affiliates table email
 */
export async function syncAffiliateEmail(affiliateAuthUserId: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Get the affiliate's email from affiliates table
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('email')
      .eq('auth_user_id', affiliateAuthUserId)
      .single();

    if (affiliateError || !affiliate) {
      throw new Error('Affiliate not found');
    }

    // Use the admin-user-management edge function to update the email
    const { data, error } = await supabase.functions.invoke('admin-user-management', {
      body: {
        action: 'updateEmail',
        userId: affiliateAuthUserId,
        email: affiliate.email
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) throw error;

    return { success: true, email: affiliate.email, data };
  } catch (error: any) {
    console.error('Error syncing affiliate email:', error);
    throw error;
  }
}
