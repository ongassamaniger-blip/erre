import { supabase } from '@/lib/supabase'

export interface ProjectCategory {
    id: string
    name: string
    description?: string
    facility_id?: string
}

export interface ProjectType {
    id: string
    name: string
    description?: string
    facility_id?: string
}

export interface JobTitle {
    id: string
    title: string
    department_id?: string
    facility_id?: string
}

export const definitionService = {
    // Project Categories
    async getProjectCategories(facilityId?: string): Promise<ProjectCategory[]> {
        let query = supabase.from('project_categories').select('*')
        if (facilityId) {
            query = query.or(`facility_id.eq.${facilityId},facility_id.is.null`)
        } else {
            query = query.is('facility_id', null)
        }
        const { data, error } = await query.order('name')
        if (error) throw error
        return data || []
    },

    async createProjectCategory(category: Partial<ProjectCategory>): Promise<ProjectCategory> {
        const { data, error } = await supabase
            .from('project_categories')
            .insert(category)
            .select()
            .single()
        if (error) throw error
        return data
    },

    async deleteProjectCategory(id: string): Promise<void> {
        const { error } = await supabase
            .from('project_categories')
            .delete()
            .eq('id', id)
        if (error) throw error
    },

    // Project Types
    async getProjectTypes(facilityId?: string): Promise<ProjectType[]> {
        let query = supabase.from('project_types').select('*')
        if (facilityId) {
            query = query.or(`facility_id.eq.${facilityId},facility_id.is.null`)
        } else {
            query = query.is('facility_id', null)
        }
        const { data, error } = await query.order('name')
        if (error) throw error
        return data || []
    },

    async createProjectType(type: Partial<ProjectType>): Promise<ProjectType> {
        const { data, error } = await supabase
            .from('project_types')
            .insert(type)
            .select()
            .single()
        if (error) throw error
        return data
    },

    async deleteProjectType(id: string): Promise<void> {
        const { error } = await supabase
            .from('project_types')
            .delete()
            .eq('id', id)
        if (error) throw error
    },

    // Job Titles
    async getJobTitles(facilityId?: string): Promise<JobTitle[]> {
        let query = supabase.from('job_titles').select('*')
        if (facilityId) {
            query = query.or(`facility_id.eq.${facilityId},facility_id.is.null`)
        } else {
            query = query.is('facility_id', null)
        }
        const { data, error } = await query.order('title')
        if (error) throw error
        return data || []
    },

    async createJobTitle(jobTitle: Partial<JobTitle>): Promise<JobTitle> {
        const { data, error } = await supabase
            .from('job_titles')
            .insert(jobTitle)
            .select()
            .single()
        if (error) throw error
        return data
    },

    async deleteJobTitle(id: string): Promise<void> {
        const { error } = await supabase
            .from('job_titles')
            .delete()
            .eq('id', id)
        if (error) throw error
    }
}
