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
    // Get authorization header (optional for now, can be used for additional security)
    const authHeader = req.headers.get('Authorization')
    
    // Validate required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.')
    }

    // Create Supabase client with service role key (Admin API)
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse request body
    const body = await req.json()
    const { email, password, name, role, facilityIds } = body

    // Validate required fields
    if (!email || !password || !name) {
      throw new Error('E-posta, şifre ve isim alanları zorunludur')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Geçerli bir e-posta adresi girin')
    }

    // Validate password length
    if (password.length < 8) {
      throw new Error('Şifre en az 8 karakter olmalıdır')
    }

    // 1. Create auth user
    // NOT: user_metadata'ya role ekliyoruz, trigger bunu okuyacak
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        role: role || 'User' // Trigger'ın okuyacağı rol
      }
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      throw new Error(`Kullanıcı oluşturulamadı: ${authError.message}`)
    }
    
    if (!authUser.user) {
      throw new Error('Kullanıcı oluşturuldu ancak user objesi döndürülmedi')
    }

    // 2. Update profile with role (trigger zaten rolü set etmiş olabilir, ama emin olmak için güncelliyoruz)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        name,
        role: role || 'User', // Edge Function'dan gelen rolü kullan
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', authUser.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Trigger zaten rolü set etmiş olabilir, devam et
    }

    // 3. Add facility access
    // Önce mevcut facility erişimlerini kontrol et (trigger tarafından eklenmiş olabilir)
    // Sonra sadece istenen facility'leri ekle
    if (facilityIds && facilityIds.length > 0) {
      // Önce mevcut erişimleri kontrol et
      const { data: existingAccess } = await supabaseAdmin
        .from('facility_users')
        .select('facility_id')
        .eq('user_id', authUser.user.id)

      const existingFacilityIds = (existingAccess || []).map((item: any) => item.facility_id)
      
      // Sadece yeni facility'leri ekle (zaten varsa ekleme)
      const newFacilityIds = facilityIds.filter((id: string) => !existingFacilityIds.includes(id))
      
      if (newFacilityIds.length > 0) {
        const facilityUserInserts = newFacilityIds.map((facilityId: string) => ({
          user_id: authUser.user.id,
          facility_id: facilityId
        }))

        const { error: facilityError } = await supabaseAdmin
          .from('facility_users')
          .insert(facilityUserInserts)

        if (facilityError) {
          console.error('Facility access error:', facilityError)
          throw new Error(`Tesis erişimi eklenirken hata oluştu: ${facilityError.message}`)
        }
      }
    } else {
      // Eğer facilityIds boşsa, kullanıcıya hiçbir tesis erişimi verme
      // (Trigger sadece ilk kullanıcı için GM01 ekler)
      console.log('No facility IDs provided, skipping facility access')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        userId: authUser.user.id,
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
  } catch (error: any) {
    console.error('Edge Function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error?.message || error?.toString() || 'Bilinmeyen hata oluştu',
        details: error?.details || null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

