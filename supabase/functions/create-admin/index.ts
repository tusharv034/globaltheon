import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

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

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Unauthorized: Invalid token')
    }

    // Check if the user has admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (roleError || !roleData) {
      throw new Error('Unauthorized: Admin access required')
    }

    const { email, password, firstName, lastName } = await req.json()

    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    console.log('Creating admin user:', email)

    // Create the user
    const { data: newUserData, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName || '',
        last_name: lastName || ''
      }
    })

    if (createError) {
      console.error('Error creating user:', createError)
      throw createError
    }

    if (!newUserData.user) {
      throw new Error('User creation failed - no user returned')
    }

    console.log('User created successfully, assigning admin role...')

    // Assign admin role
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: newUserData.user.id,
        role: 'admin'
      })

    if (roleError) {
      console.error('Error assigning admin role:', roleError)
      throw new Error(`Failed to assign admin role: ${roleError.message}`)
    }

    console.log('Admin role assigned successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: newUserData.user.id,
          email: newUserData.user.email
        },
        message: 'Admin user created successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in create-admin function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
