import { supabase } from '@/lib/supabase'

export interface Entity {
    id: string
    name: string
    type: 'vendor' | 'customer'
    tax_number?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    country?: string
    contact_person?: string
    facility_id?: string
}

export const entityService = {
    async getEntities(facilityId: string, type?: 'vendor' | 'customer'): Promise<Entity[]> {
        let query = supabase.from('vendors_customers').select('*').eq('facility_id', facilityId)

        if (type) {
            query = query.eq('type', type)
        }

        const { data, error } = await query.order('name')
        if (error) throw error
        return data || []
    },

    async createEntity(entity: Partial<Entity>): Promise<Entity> {
        const { data, error } = await supabase
            .from('vendors_customers')
            .insert(entity)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async updateEntity(id: string, entity: Partial<Entity>): Promise<Entity> {
        const { data, error } = await supabase
            .from('vendors_customers')
            .update(entity)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async deleteEntity(id: string): Promise<void> {
        const { error } = await supabase
            .from('vendors_customers')
            .delete()
            .eq('id', id)

        if (error) throw error
    }
}
