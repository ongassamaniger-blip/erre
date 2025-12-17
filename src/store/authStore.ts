import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Facility, Notification } from '@/types'
import { supabase } from '@/lib/supabase'

interface AuthStore {
  user: User | null
  selectedFacility: Facility | null
  notifications: Notification[]
  isAuthenticated: boolean
  isHydrated: boolean
  isInitialized: boolean
  session: any | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; code?: string }>
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>
  updateUserPassword: (password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  selectFacility: (facility: Facility) => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  markNotificationAsRead: (id: string) => void
  clearNotifications: () => void
  setHydrated: () => void
  initializeAuth: (session?: any) => Promise<void>
  loadUserFacilities: () => Promise<void>
  loadUserNotifications: () => Promise<void>
  subscribeToNotifications: () => void
  unsubscribeFromNotifications: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      selectedFacility: null,
      session: null,
      notifications: [],
      isAuthenticated: false,
      isHydrated: false,
      isInitialized: false,

      setHydrated: () => {
        set({ isHydrated: true })
      },

      initializeAuth: async (existingSession?: any) => {
        try {
          // Always verify session with Supabase - don't trust localStorage alone
          const { data } = await supabase.auth.getSession()
          const session = data.session

          if (session?.user) {
            console.log('Valid Supabase session found for user:', session.user.id)

            // Load user profile and facilities from database
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (profileError || !profile) {
              console.error('Profile not found, creating default profile:', profileError)
              
              // Profile yoksa, varsayılan bir profile oluştur
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Kullanıcı',
                  role: 'User',
                  status: 'active'
                })
                .select()
                .single()

              if (createError || !newProfile) {
                console.error('Failed to create profile:', createError)
                // Fallback: Minimal user object
                const user: User = {
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Kullanıcı',
                  role: 'User',
                  facilityAccess: []
                }
                set({
                  user,
                  session,
                  isAuthenticated: true,
                  isInitialized: true
                })
                return
              }
              
              // Yeni oluşturulan profile'ı kullan
              const user: User = {
                id: session.user.id,
                email: session.user.email || newProfile.email || '',
                name: newProfile.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Kullanıcı',
                role: (newProfile.role as any) || 'User',
                facilityAccess: []
              }
              set({
                user,
                session,
                isAuthenticated: true,
                isInitialized: true
              })
              return
            }

            // Load user facilities
            const { data: facilityUsers } = await supabase
              .from('facility_users')
              .select('facility_id, facilities(code)')
              .eq('user_id', session.user.id)

            const facilityAccess = (facilityUsers || [])
              .map((fu: any) => fu.facilities?.code)
              .filter(Boolean) as string[]

            const user: User = {
              id: session.user.id,
              email: session.user.email || profile.email || '',
              name: profile.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Kullanıcı',
              role: (profile.role as any) || 'User',
              facilityAccess: facilityAccess.length > 0 ? facilityAccess : []
            }

            set({
              user,
              session,
              isAuthenticated: true,
              isInitialized: true
            })
          } else {
            console.log('No valid Supabase session - clearing auth state')
            // Clear any stale localStorage data
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isInitialized: true,
              selectedFacility: null
            })
          }
        } catch (error) {
          console.error('Initialize auth error:', error)
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isInitialized: true,
            selectedFacility: null
          })
        }
      },

      login: async (email, password) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          })

          if (error) {
            console.error('Login error:', error.message)
            return { success: false, error: error.message, code: 'AUTH_ERROR' }
          }

          if (data.session) {
            // Load user profile and facilities from database
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .single()

            if (profileError || !profile) {
              console.error('Profile not found during login:', profileError)
              
              // Profile yoksa, varsayılan bir profile oluştur
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: data.session.user.id,
                  email: data.session.user.email || email,
                  name: data.session.user.user_metadata?.name || email.split('@')[0] || 'Kullanıcı',
                  role: 'User',
                  status: 'active'
                })
                .select()
                .single()

              if (createError || !newProfile) {
                console.error('Failed to create profile during login:', createError)
                return { 
                  success: false, 
                  error: 'Kullanıcı profili oluşturulamadı. Lütfen yöneticiye başvurun.', 
                  code: 'PROFILE_CREATE_FAILED' 
                }
              }
              
              // Yeni oluşturulan profile'ı kullan
              const { data: facilityUsers } = await supabase
                .from('facility_users')
                .select('facility_id, facilities(code)')
                .eq('user_id', data.session.user.id)

              const facilityAccess = (facilityUsers || [])
                .map((fu: any) => fu.facilities?.code)
                .filter(Boolean) as string[]

              const user: User = {
                id: data.session.user.id,
                email: data.session.user.email || newProfile.email || email,
                name: newProfile.name || data.session.user.user_metadata?.name || email.split('@')[0],
                role: (newProfile.role as any) || 'User',
                facilityAccess: facilityAccess.length > 0 ? facilityAccess : []
              }

              set({
                user,
                session: data.session,
                isAuthenticated: true,
                isInitialized: true
              })

              await get().loadUserNotifications()
              get().subscribeToNotifications()

              return { success: true }
            }

            // Load user facilities
            const { data: facilityUsers } = await supabase
              .from('facility_users')
              .select('facility_id, facilities(code)')
              .eq('user_id', data.session.user.id)

            const facilityAccess = (facilityUsers || [])
              .map((fu: any) => fu.facilities?.code)
              .filter(Boolean) as string[]

            const user: User = {
              id: data.session.user.id,
              email: data.session.user.email || profile.email || email,
              name: profile.name || data.session.user.user_metadata?.name || email.split('@')[0],
              role: (profile.role as any) || 'User',
              facilityAccess: facilityAccess.length > 0 ? facilityAccess : []
            }

            set({
              user,
              session: data.session,
              isAuthenticated: true,
              isInitialized: true
            })

            // Load notifications
            await get().loadUserNotifications()
            get().subscribeToNotifications()

            return { success: true }
          }

          return { success: false, error: 'Oturum açılamadı.', code: 'NO_SESSION' }
        } catch (error: any) {
          console.error('Login error:', error)
          return { success: false, error: error.message || 'Bir hata oluştu', code: 'UNKNOWN_ERROR' }
        }
      },

      register: async (email, password, name) => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name
              }
            }
          })

          if (error) {
            return { success: false, error: error.message }
          }

          return { success: true }
        } catch (error: any) {
          return { success: false, error: error.message }
        }
      },

      resetPasswordForEmail: async (email) => {
        try {
          // Check if user exists in profiles
          const { count, error: profileError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('email', email)

          if (profileError) {
            return { success: false, error: profileError.message }
          }

          if (count === 0) {
            return { success: false, error: 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.' }
          }

          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          })

          if (error) {
            return { success: false, error: error.message }
          }

          return { success: true }
        } catch (error: any) {
          return { success: false, error: error.message }
        }
      },

      updateUserPassword: async (password) => {
        try {
          const { data: { session } } = await supabase.auth.getSession()

          if (!session) {
            return { success: false, error: 'Oturum bulunamadı. Lütfen linke tekrar tıklayın.' }
          }

          const { error } = await supabase.auth.updateUser({
            password
          })

          if (error) {
            console.error('Update password error:', error)
            return { success: false, error: error.message }
          }

          return { success: true }
        } catch (error: any) {
          console.error('Update password exception:', error)
          return { success: false, error: error.message }
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut()
          set({
            user: null,
            session: null,
            selectedFacility: null,
            isAuthenticated: false,
            notifications: []
          })
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          get().unsubscribeFromNotifications()
        }
      },

      selectFacility: (facility: Facility) => {
        try {
          if (facility && facility.id && facility.code && facility.name && facility.location) {
            set({ selectedFacility: facility })
          } else {
            console.error('Invalid facility data:', facility)
          }
        } catch (error) {
          console.error('Select facility error:', error)
        }
      },

      loadUserFacilities: async () => {
        const { user } = get()
        if (!user) return

        try {
          const { data: facilityUsers } = await supabase
            .from('facility_users')
            .select('facility_id, facilities(*)')
            .eq('user_id', user.id)

          if (facilityUsers) {
            const facilities = facilityUsers.map((fu: any) => fu.facilities)

            // Update user with facility access codes
            const facilityAccess = facilities.map((f: Facility) => f.code)
            set({
              user: { ...user, facilityAccess }
            })
          }
        } catch (error) {
          console.error('Load facilities error:', error)
        }
      },

      loadUserNotifications: async () => {
        const { user } = get()
        if (!user) return

        try {
          const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

          if (data) {
            set({ notifications: data })
          }
        } catch (error) {
          console.error('Load notifications error:', error)
        }
      },

      addNotification: async (notification) => {
        const { user } = get()
        if (!user) return

        try {
          const { data, error } = await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              read: false,
              link: notification.link
            })
            .select()
            .single()

          if (data && !error) {
            set(state => ({
              notifications: [data, ...state.notifications]
            }))
          }
        } catch (error) {
          console.error('Add notification error:', error)
        }
      },

      markNotificationAsRead: async (id) => {
        try {
          const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id)

          if (!error) {
            set(state => ({
              notifications: state.notifications.map(n =>
                n.id === id ? { ...n, read: true } : n
              )
            }))
          }
        } catch (error) {
          console.error('Mark notification read error:', error)
        }
      },

      clearNotifications: async () => {
        const { user } = get()
        if (!user) return

        try {
          const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)

          if (!error) {
            set({ notifications: [] })
          } else {
            console.error('Clear notifications error:', error)
          }
        } catch (error) {
          console.error('Clear notifications error:', error)
        }
      },

      subscribeToNotifications: () => {
        const { user, session } = get()
        if (!user) return

        // Prevent duplicate subscriptions
        if (session?.notificationChannel) {
          return
        }

        const channel = supabase
          .channel('public:notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              const newNotification = payload.new as Notification
              set(state => ({
                notifications: [newNotification, ...state.notifications]
              }))
            }
          )
          .subscribe()

        set({ session: { ...session, notificationChannel: channel } })
      },

      unsubscribeFromNotifications: () => {
        const { session } = get()
        if (session?.notificationChannel) {
          supabase.removeChannel(session.notificationChannel)
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        selectedFacility: state.selectedFacility,
        session: state.session,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
        state?.initializeAuth()
      }
    }
  )
)
