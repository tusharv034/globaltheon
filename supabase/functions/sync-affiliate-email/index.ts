import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: rolesData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const roles = (rolesData || []).map((r: { role: string }) => r.role)
    const isAdmin = roles.includes('admin') || roles.includes('super_admin')
    if (!isAdmin) {
      throw new Error('User must be an admin')
    }

    const { affiliateAuthUserId } = await req.json()

    if (!affiliateAuthUserId) {
      throw new Error('affiliateAuthUserId is required')
    }

    // Get the affiliate's email from affiliates table
    const { data: affiliate, error: affiliateError } = await supabaseClient
      .from('affiliates')
      .select('email')
      .eq('auth_user_id', affiliateAuthUserId)
      .single()

    if (affiliateError || !affiliate) {
      throw new Error('Affiliate not found')
    }

    // Update the auth email to match
    const { data: updatedUser, error: updateError } = await supabaseClient.auth.admin.updateUserById(
      affiliateAuthUserId,
      { email: affiliate.email }
    )

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email updated to ${affiliate.email}`,
        user: updatedUser.user 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error syncing affiliate email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
