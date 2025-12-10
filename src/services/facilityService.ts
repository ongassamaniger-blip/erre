import { supabase } from '@/lib/supabase'
import type { Facility, ModuleType } from '@/types'

export const facilityService = {
  async getFacilities(): Promise<Facility[]> {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .order('name')

    if (error) throw error
    return data.map(f => ({
      ...f,
      enabledModules: f.enabled_modules,
      parentFacilityId: f.parent_facility_id
    }))
  },

  async getFacilityById(id: string): Promise<Facility | null> {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return {
      ...data,
      enabledModules: data.enabled_modules,
      parentFacilityId: data.parent_facility_id
    }
  },

  async getBranches(): Promise<Facility[]> {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('type', 'branch')
      .order('name')

    if (error) throw error
    return data.map(f => ({
      ...f,
      enabledModules: f.enabled_modules,
      parentFacilityId: f.parent_facility_id
    }))
  },

  async createFacility(facility: Omit<Facility, 'id' | 'created_at' | 'updated_at'>): Promise<Facility> {
    // Default HR module if none specified
    const modules = facility.enabledModules && facility.enabledModules.length > 0
      ? facility.enabledModules
      : ['hr'] as ModuleType[]

    const dbFacility = {
      code: facility.code,
      name: facility.name,
      type: facility.type,
      location: facility.location,
      enabled_modules: modules,
      parent_facility_id: facility.parentFacilityId || null
    }

    const { data, error } = await supabase
      .from('facilities')
      .insert(dbFacility)
      .select()
      .single()

    if (error) throw error
    return {
      ...data,
      enabledModules: data.enabled_modules,
      parentFacilityId: data.parent_facility_id
    }
  },

  async updateFacility(id: string, updates: Partial<Facility>): Promise<Facility> {
    // Convert camelCase to snake_case for database
    const dbUpdates: Record<string, any> = {}

    if (updates.code !== undefined) dbUpdates.code = updates.code
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.type !== undefined) dbUpdates.type = updates.type
    if (updates.location !== undefined) dbUpdates.location = updates.location
    if (updates.enabledModules !== undefined) dbUpdates.enabled_modules = updates.enabledModules
    if (updates.parentFacilityId !== undefined) dbUpdates.parent_facility_id = updates.parentFacilityId
    // Also handle if updates come with snake_case directly
    if ((updates as any).enabled_modules !== undefined) dbUpdates.enabled_modules = (updates as any).enabled_modules
    if ((updates as any).parent_facility_id !== undefined) dbUpdates.parent_facility_id = (updates as any).parent_facility_id

    const { data, error } = await supabase
      .from('facilities')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return {
      ...data,
      enabledModules: data.enabled_modules,
      parentFacilityId: data.parent_facility_id
    }
  },

  async updateFacilityModules(id: string, enabledModules: ModuleType[]): Promise<Facility> {
    const { data, error } = await supabase
      .from('facilities')
      .update({ enabled_modules: enabledModules })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return {
      ...data,
      enabledModules: data.enabled_modules,
      parentFacilityId: data.parent_facility_id
    }
  },

  async deleteFacility(id: string): Promise<void> {
    // Use the custom SQL function for cascading delete
    const { error } = await supabase.rpc('delete_facility_cascade', {
      target_facility_id: id
    })

    if (error) throw error
  },
}

