import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/errorHandler'

export interface Role {
  id: string
  name: string
  description?: string
  isSystemRole: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface RolePermission {
  id: string
  roleId: string
  module: 'finance' | 'hr' | 'projects' | 'qurban' | 'reports' | 'approvals' | 'calendar' | 'settings'
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canApprove: boolean
  canExport: boolean
  canReject: boolean
  projectAccessType?: 'all' | 'assigned' | 'department' | 'facility'
}

export interface UserFacilityRole {
  id: string
  userId: string
  facilityId: string
  roleId: string
  departmentId?: string
  projectIds?: string[]
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface CreateRoleData {
  name: string
  description?: string
  permissions: {
    module: string
    canView: boolean
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    canApprove: boolean
    canExport?: boolean
    canReject?: boolean
    projectAccessType?: 'all' | 'assigned' | 'department' | 'facility'
  }[]
}

export interface UpdateRoleData {
  name?: string
  description?: string
  permissions?: CreateRoleData['permissions']
}

export const roleManagementService = {
  /**
   * Tüm rolleri getir
   */
  async getRoles(): Promise<Role[]> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('is_system_role', { ascending: false })
        .order('name', { ascending: true })

      if (error) throw error

      return (data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        isSystemRole: r.is_system_role,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        createdBy: r.created_by
      }))
    } catch (error) {
      handleError(error, { showToast: false })
      return []
    }
  },

  /**
   * Rolü ID'ye göre getir
   */
  async getRoleById(id: string): Promise<Role | null> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (!data) return null

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        isSystemRole: data.is_system_role,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by
      }
    } catch (error) {
      handleError(error, { showToast: false })
      return null
    }
  },

  /**
   * Rolün izinlerini getir
   */
  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role_id', roleId)
        .order('module')

      if (error) throw error

      return (data || []).map((rp: any) => ({
        id: rp.id,
        roleId: rp.role_id,
        module: rp.module,
        canView: rp.can_view,
        canCreate: rp.can_create,
        canEdit: rp.can_edit,
        canDelete: rp.can_delete,
        canApprove: rp.can_approve,
        canExport: rp.can_export,
        canReject: rp.can_reject,
        projectAccessType: rp.project_access_type
      }))
    } catch (error) {
      handleError(error, { showToast: false })
      return []
    }
  },

  /**
   * Yeni rol oluştur
   */
  async createRole(roleData: CreateRoleData): Promise<Role> {
    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) {
        throw new Error('Oturum bulunamadı')
      }

      // 1. Rolü oluştur
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .insert({
          name: roleData.name,
          description: roleData.description,
          is_system_role: false,
          created_by: session.session.user.id
        })
        .select()
        .single()

      if (roleError) throw roleError

      // 2. İzinleri ekle
      if (roleData.permissions && roleData.permissions.length > 0) {
        const permissions = roleData.permissions.map(p => ({
          role_id: role.id,
          module: p.module,
          can_view: p.canView,
          can_create: p.canCreate,
          can_edit: p.canEdit,
          can_delete: p.canDelete,
          can_approve: p.canApprove,
          can_export: p.canExport || false,
          can_reject: p.canReject || false,
          project_access_type: p.projectAccessType || 'all'
        }))

        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(permissions)

        if (permError) throw permError
      }

      return {
        id: role.id,
        name: role.name,
        description: role.description,
        isSystemRole: role.is_system_role,
        createdAt: role.created_at,
        updatedAt: role.updated_at,
        createdBy: role.created_by
      }
    } catch (error) {
      handleError(error)
      throw error
    }
  },

  /**
   * Rolü güncelle
   */
  async updateRole(id: string, roleData: UpdateRoleData): Promise<Role> {
    try {
      // 1. Rolü güncelle
      const updateData: any = {
        updated_at: new Date().toISOString()
      }
      if (roleData.name !== undefined) updateData.name = roleData.name
      if (roleData.description !== undefined) updateData.description = roleData.description

      if (Object.keys(updateData).length > 1) {
        const { error: roleError } = await supabase
          .from('roles')
          .update(updateData)
          .eq('id', id)

        if (roleError) throw roleError
      }

      // 2. İzinleri güncelle
      if (roleData.permissions && roleData.permissions.length > 0) {
        // Mevcut izinleri sil
        const { error: deleteError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', id)

        if (deleteError) throw deleteError

        // Yeni izinleri ekle
        const permissions = roleData.permissions.map(p => ({
          role_id: id,
          module: p.module,
          can_view: p.canView,
          can_create: p.canCreate,
          can_edit: p.canEdit,
          can_delete: p.canDelete,
          can_approve: p.canApprove,
          can_export: p.canExport || false,
          can_reject: p.canReject || false,
          project_access_type: p.projectAccessType || 'all'
        }))

        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(permissions)

        if (permError) throw permError
      }

      // Güncellenmiş rolü getir
      const updatedRole = await this.getRoleById(id)
      if (!updatedRole) {
        throw new Error('Rol güncellendikten sonra bulunamadı')
      }

      return updatedRole
    } catch (error) {
      handleError(error)
      throw error
    }
  },

  /**
   * Rolü sil
   */
  async deleteRole(id: string): Promise<void> {
    try {
      // Sistem rolü kontrolü
      const role = await this.getRoleById(id)
      if (role?.isSystemRole) {
        throw new Error('Sistem rolleri silinemez')
      }

      // Kullanıcılar bu rolü kullanıyor mu kontrol et
      const { data: userRoles } = await supabase
        .from('user_facility_roles')
        .select('id')
        .eq('role_id', id)
        .limit(1)

      if (userRoles && userRoles.length > 0) {
        throw new Error('Bu rol kullanıcılara atanmış. Önce kullanıcılardan kaldırın.')
      }

      // Rolü sil (CASCADE ile izinler de silinir)
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      handleError(error)
      throw error
    }
  },

  /**
   * Kullanıcıya tesis bazlı rol ata
   */
  async assignRoleToUser(userId: string, facilityId: string, roleId: string, options?: {
    departmentId?: string
    projectIds?: string[]
  }): Promise<UserFacilityRole> {
    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) {
        throw new Error('Oturum bulunamadı')
      }

      const { data, error } = await supabase
        .from('user_facility_roles')
        .insert({
          user_id: userId,
          facility_id: facilityId,
          role_id: roleId,
          department_id: options?.departmentId,
          project_ids: options?.projectIds,
          created_by: session.session.user.id
        })
        .select()
        .single()

      if (error) {
        // Zaten varsa güncelle
        if (error.message.includes('unique constraint')) {
          const { data: updated, error: updateError } = await supabase
            .from('user_facility_roles')
            .update({
              role_id: roleId,
              department_id: options?.departmentId,
              project_ids: options?.projectIds,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('facility_id', facilityId)
            .select()
            .single()

          if (updateError) throw updateError
          return this.mapToUserFacilityRole(updated)
        }
        throw error
      }

      return this.mapToUserFacilityRole(data)
    } catch (error) {
      handleError(error)
      throw error
    }
  },

  /**
   * Kullanıcıdan tesis bazlı rolü kaldır
   */
  async removeRoleFromUser(userId: string, facilityId: string, roleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_facility_roles')
        .delete()
        .eq('user_id', userId)
        .eq('facility_id', facilityId)
        .eq('role_id', roleId)

      if (error) throw error
    } catch (error) {
      handleError(error)
      throw error
    }
  },

  /**
   * Kullanıcının tesis bazlı rollerini getir
   */
  async getUserFacilityRoles(userId: string, facilityId?: string): Promise<UserFacilityRole[]> {
    try {
      let query = supabase
        .from('user_facility_roles')
        .select('*, roles(name), facilities(name, code)')
        .eq('user_id', userId)

      if (facilityId) {
        query = query.eq('facility_id', facilityId)
      }

      const { data, error } = await query

      if (error) throw error

      return (data || []).map(this.mapToUserFacilityRole)
    } catch (error) {
      handleError(error, { showToast: false })
      return []
    }
  },

  /**
   * Kullanıcının belirli bir tesiste hangi role sahip olduğunu getir
   */
  async getUserRoleInFacility(userId: string, facilityId: string): Promise<Role | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_role_in_facility', {
          p_user_id: userId,
          p_facility_id: facilityId
        })

      if (error) throw error

      if (!data || data.length === 0) return null

      const roleData = data[0]
      return {
        id: roleData.role_id,
        name: roleData.role_name,
        description: undefined,
        isSystemRole: false,
        createdAt: '',
        updatedAt: ''
      }
    } catch (error) {
      handleError(error, { showToast: false })
      return null
    }
  },

  /**
   * Kullanıcının modül erişimini kontrol et
   */
  async hasModuleAccess(
    userId: string,
    facilityId: string,
    module: string,
    permission: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' | 'reject' = 'view'
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('has_module_access', {
          p_user_id: userId,
          p_facility_id: facilityId,
          p_module: module,
          p_permission: permission
        })

      if (error) throw error

      return data || false
    } catch (error) {
      handleError(error, { showToast: false })
      return false
    }
  },

  /**
   * Kullanıcının proje erişimini kontrol et
   */
  async hasProjectAccess(userId: string, facilityId: string, projectId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('has_project_access', {
          p_user_id: userId,
          p_facility_id: facilityId,
          p_project_id: projectId
        })

      if (error) throw error

      return data || false
    } catch (error) {
      handleError(error, { showToast: false })
      return false
    }
  },

  /**
   * Helper: Map database result to UserFacilityRole
   */
  mapToUserFacilityRole(data: any): UserFacilityRole {
    return {
      id: data.id,
      userId: data.user_id,
      facilityId: data.facility_id,
      roleId: data.role_id,
      departmentId: data.department_id,
      projectIds: data.project_ids || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by
    }
  }
}

