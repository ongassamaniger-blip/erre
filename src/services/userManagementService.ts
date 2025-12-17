import { supabase } from '@/lib/supabase'
import { facilityService } from './facilityService'
import { handleError } from '@/lib/errorHandler'

export type SystemRole = 'Super Admin' | 'Admin' | 'Manager' | 'User'

export interface SystemUser {
  id: string
  email: string
  name: string
  avatar?: string
  role: SystemRole
  status: 'active' | 'inactive' | 'suspended'
  facilities: {
    id: string
    name: string
    code: string
    role?: string
  }[]
  lastLogin?: string
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface CreateUserData {
  email: string
  password: string
  name: string
  role: SystemRole
  facilityIds: string[]
  sendInviteEmail?: boolean
}

export interface UpdateUserData {
  name?: string
  role?: SystemRole
  status?: 'active' | 'inactive' | 'suspended'
  facilityIds?: string[]
  avatar?: string
}

export const userManagementService = {
  /**
   * Tüm kullanıcıları getir (sistem genelinde)
   */
  async getUsers(): Promise<SystemUser[]> {
    try {
      // Tüm profilleri çek
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      if (!profiles || profiles.length === 0) return []

      // Tüm facility_users ilişkilerini çek
      const { data: facilityUsers, error: facilityUsersError } = await supabase
        .from('facility_users')
        .select('user_id, facility_id, facilities(id, name, code)')

      if (facilityUsersError) {
        console.warn('Facility users error:', facilityUsersError)
      }

      // Facility map'i oluştur
      const facilityMap = new Map<string, { id: string; name: string; code: string }[]>()
      facilityUsers?.forEach((fu: any) => {
        if (!facilityMap.has(fu.user_id)) {
          facilityMap.set(fu.user_id, [])
        }
        if (fu.facilities) {
          facilityMap.get(fu.user_id)!.push({
            id: fu.facility_id,
            name: fu.facilities.name,
            code: fu.facilities.code
          })
        }
      })

      // Son giriş bilgilerini çek (auth.users'dan)
      const userIds = profiles.map(p => p.id)
      const lastLoginMap = new Map<string, string>()

      // Not: auth.users tablosuna direkt erişim yok, bu yüzden last_login bilgisini
      // profiles tablosuna eklemek gerekebilir veya ayrı bir tablo oluşturulabilir
      // Şimdilik boş bırakıyoruz

      return profiles.map((profile: any) => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        role: (profile.role as SystemRole) || 'User',
        status: profile.status === 'active' ? 'active' : profile.status === 'suspended' ? 'suspended' : 'inactive',
        facilities: facilityMap.get(profile.id) || [],
        lastLogin: lastLoginMap.get(profile.id),
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        createdBy: profile.created_by
      }))
    } catch (error) {
      handleError(error, { showToast: false })
      return []
    }
  },

  /**
   * Kullanıcıyı ID'ye göre getir
   */
  async getUserById(id: string): Promise<SystemUser | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!profile) return null

      // Facility erişimlerini çek
      const { data: facilityUsers } = await supabase
        .from('facility_users')
        .select('facility_id, facilities(id, name, code)')
        .eq('user_id', id)

      const facilities = (facilityUsers || []).map((fu: any) => ({
        id: fu.facility_id,
        name: fu.facilities?.name || '',
        code: fu.facilities?.code || ''
      }))

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        role: (profile.role as SystemRole) || 'User',
        status: profile.status === 'active' ? 'active' : profile.status === 'suspended' ? 'suspended' : 'inactive',
        facilities,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        createdBy: profile.created_by
      }
    } catch (error) {
      handleError(error, { showToast: false })
      return null
    }
  },

  /**
   * Yeni kullanıcı oluştur
   * Edge Function kullanarak Supabase Admin API ile kullanıcı oluşturur
   */
  async createUser(userData: CreateUserData): Promise<SystemUser> {
    try {
      // Email ile mevcut kullanıcıyı kontrol et
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', userData.email)
        .single()

      if (existingUser) {
        throw new Error('Bu e-posta adresi zaten kullanılıyor')
      }

      // Edge Function çağrısı yap
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) {
        throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.')
      }

      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-user', {
        body: {
          email: userData.email,
          password: userData.password,
          name: userData.name,
          role: userData.role,
          facilityIds: userData.facilityIds,
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      })

      if (functionError) {
        console.error('Edge Function error:', functionError)
        throw new Error(functionError.message || 'Kullanıcı oluşturulamadı. Edge Function kontrol edin.')
      }

      // Edge Function başarısız response döndürdüyse
      if (functionData && !functionData.success) {
        console.error('Edge Function returned error:', functionData)
        throw new Error(functionData.error || 'Kullanıcı oluşturulamadı')
      }

      // Response yoksa veya success false ise
      if (!functionData || !functionData.success) {
        console.error('Unexpected response:', functionData)
        throw new Error('Kullanıcı oluşturulamadı. Lütfen Edge Function\'ı kontrol edin.')
      }

      // Oluşturulan kullanıcıyı getir
      const newUser = await this.getUserById(functionData.user.id)
      if (!newUser) {
        throw new Error('Kullanıcı oluşturuldu ancak getirilemedi')
      }

      return newUser
    } catch (error) {
      handleError(error)
      throw error
    }
  },

  /**
   * Kullanıcıyı güncelle
   */
  async updateUser(id: string, updates: UpdateUserData): Promise<SystemUser> {
    try {
      // Profil bilgilerini güncelle
      const profileUpdates: any = {}
      if (updates.name !== undefined) profileUpdates.name = updates.name
      if (updates.role !== undefined) profileUpdates.role = updates.role
      if (updates.status !== undefined) profileUpdates.status = updates.status
      if (updates.avatar !== undefined) profileUpdates.avatar = updates.avatar
      profileUpdates.updated_at = new Date().toISOString()

      if (Object.keys(profileUpdates).length > 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', id)

        if (updateError) throw updateError
      }

      // Facility erişimlerini güncelle
      if (updates.facilityIds !== undefined) {
        // Mevcut erişimleri sil
        const { error: deleteError } = await supabase
          .from('facility_users')
          .delete()
          .eq('user_id', id)

        if (deleteError) throw deleteError

        // Yeni erişimleri ekle
        if (updates.facilityIds.length > 0) {
          const facilityUserInserts = updates.facilityIds.map(facilityId => ({
            user_id: id,
            facility_id: facilityId
          }))

          const { error: insertError } = await supabase
            .from('facility_users')
            .insert(facilityUserInserts)

          if (insertError) throw insertError
        }
      }

      // Güncellenmiş kullanıcıyı getir
      const updatedUser = await this.getUserById(id)
      if (!updatedUser) {
        throw new Error('Kullanıcı güncellendikten sonra bulunamadı')
      }

      return updatedUser
    } catch (error) {
      handleError(error)
      throw error
    }
  },

  /**
   * Kullanıcıyı sil (soft delete - status'u inactive yap)
   */
  async deleteUser(id: string): Promise<void> {
    try {
      // Soft delete: status'u inactive yap
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      // NOT: Gerçek silme için auth.users'dan da silmek gerekir (Admin API ile)
    } catch (error) {
      handleError(error)
      throw error
    }
  },

  /**
   * Kullanıcıyı askıya al (suspend)
   */
  async suspendUser(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      handleError(error)
      throw error
    }
  },

  /**
   * Kullanıcıyı aktif et
   */
  async activateUser(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      handleError(error)
      throw error
    }
  },

  /**
   * Kullanıcıya facility erişimi ekle
   */
  async addFacilityAccess(userId: string, facilityId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('facility_users')
        .insert({
          user_id: userId,
          facility_id: facilityId
        })

      if (error) {
        // Zaten varsa hata verme
        if (!error.message.includes('unique constraint')) {
          throw error
        }
      }
    } catch (error) {
      handleError(error)
      throw error
    }
  },

  /**
   * Kullanıcıdan facility erişimini kaldır
   */
  async removeFacilityAccess(userId: string, facilityId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('facility_users')
        .delete()
        .eq('user_id', userId)
        .eq('facility_id', facilityId)

      if (error) throw error
    } catch (error) {
      handleError(error)
      throw error
    }
  },

  /**
   * Kullanıcı şifresini sıfırla (email gönder)
   */
  async resetUserPassword(email: string): Promise<void> {
    try {
      // Supabase Auth password reset email gönderir
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error
    } catch (error) {
      handleError(error)
      throw error
    }
  }
}

