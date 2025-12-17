// Supabase Edge Function: Create User
// Bu fonksiyon Supabase Admin API kullanarak yeni kullanıcı oluşturur

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client with service role key (Admin API)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { email, password, name, role, facilityIds } = await req.json()

    // 1. Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name
      }
    })

    if (authError) throw authError
    if (!authUser.user) throw new Error('User creation failed')

    // 2. Update profile with role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        name,
        role: role || 'User',
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', authUser.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Continue anyway, trigger should handle it
    }

    // 3. Add facility access
    if (facilityIds && facilityIds.length > 0) {
      const facilityUserInserts = facilityIds.map((facilityId: string) => ({
        user_id: authUser.user.id,
        facility_id: facilityId
      }))

      const { error: facilityError } = await supabaseAdmin
        .from('facility_users')
        .insert(facilityUserInserts)

      if (facilityError) {
        console.error('Facility access error:', facilityError)
        // Continue anyway
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authUser.user.id,
          email: authUser.user.email
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
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

