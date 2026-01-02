import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin or super_admin (support multiple roles)
    const { data: rolesData, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    console.log('admin-user-management: user', user.id, 'rolesError', rolesError, 'rolesData', rolesData)

    const roles = (rolesData || []).map((r: { role: string }) => r.role)
    const isElevated = roles.includes('admin') || roles.includes('super_admin')
    if (rolesError || !isElevated) {
      throw new Error('User must be an admin to perform this action')
    }

    const { action, userId, email, password, firstName, lastName, role } = await req.json()

    let response

    switch (action) {
      case 'createUser':
        if (!email || !password) {
          throw new Error('email and password are required')
        }

        const { data: newUserData, error: createError } = await supabaseClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            first_name: firstName || '',
            last_name: lastName || ''
          }
        })

        if (createError) throw createError

        // Assign role if provided
        if (role && newUserData.user) {
          const { error: roleError } = await supabaseClient
            .from('user_roles')
            .insert({
              user_id: newUserData.user.id,
              role: role
            })

          if (roleError) {
            console.error('Error assigning role:', roleError)
          }
        }

        response = { user: newUserData.user, message: 'User created successfully' }
        break

      case 'listUsers':
        // List all users with their emails
        const { data: usersData, error: listError } = await supabaseClient.auth.admin.listUsers()
        
        if (listError) throw listError

        response = { users: usersData.users }
        break

      case 'updateEmail':
        if (!userId || !email) {
          throw new Error('userId and email are required')
        }

        const { data: emailData, error: emailError } = await supabaseClient.auth.admin.updateUserById(
          userId,
          { email }
        )

        if (emailError) throw emailError

        response = { user: emailData.user, message: 'Email updated successfully' }
        break

      case 'updatePassword':
        if (!userId || !password) {
          throw new Error('userId and password are required')
        }

        const { data: passwordData, error: passwordError } = await supabaseClient.auth.admin.updateUserById(
          userId,
          { password }
        )

        if (passwordError) throw passwordError

        response = { user: passwordData.user, message: 'Password updated successfully' }
        break

      case 'updateProfile':
        if (!userId) {
          throw new Error('userId is required')
        }
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .update({
            first_name: firstName ?? '',
            last_name: lastName ?? ''
          })
          .eq('id', userId)

        if (profileError) throw profileError

        response = { message: 'Profile updated successfully' }
        break

      case 'deleteUser':
        if (!userId) {
          throw new Error('userId is required')
        }

        // Delete the auth user (this will cascade delete profiles due to foreign key)
        const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId)

        if (deleteError) throw deleteError

        // Also clean up user_roles and module_permissions
        await supabaseClient.from('user_roles').delete().eq('user_id', userId)
        await supabaseClient.from('module_permissions').delete().eq('user_id', userId)

        response = { message: 'User deleted successfully' }
        break

      default:
        throw new Error('Invalid action')
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})