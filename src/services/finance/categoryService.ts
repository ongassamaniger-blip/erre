import { supabase } from '@/lib/supabase'
import type { Category } from '@/types/finance'
import { DEFAULT_CATEGORIES, type LocalCategory } from '@/constants/defaults'

export interface CategoryFilters {
    type?: 'income' | 'expense'
    facilityId?: string
}

// Lokal kategoriyi DB formatına dönüştür
function localToDbCategory(local: LocalCategory, facilityId?: string): Category {
    return {
        id: local.id,
        name: local.name,
        type: local.type,
        color: local.color,
        facility_id: facilityId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
}

export const categoryService = {
    /**
     * Kategorileri getir - önce DB'den, yoksa lokal varsayılanları kullan
     */
    async getCategories(filters?: CategoryFilters): Promise<Category[]> {
        try {
            let query = supabase.from('categories').select('*')

            if (filters?.facilityId) {
                query = query.or(`facility_id.eq.${filters.facilityId},facility_id.is.null`)
            }

            if (filters?.type) {
                query = query.eq('type', filters.type)
            }

            const { data, error } = await query.order('name', { ascending: true })

            if (error) {
                console.warn('DB categories error, using local defaults:', error)
                return this.getLocalCategories(filters)
            }

            // DB'de kategori yoksa lokal varsayılanları kullan
            if (!data || data.length === 0) {
                console.log('No categories in DB, using local defaults')
                return this.getLocalCategories(filters)
            }

            return data
        } catch (error) {
            console.error('Get categories error, using local defaults:', error)
            return this.getLocalCategories(filters)
        }
    },

    /**
     * Lokal varsayılan kategorileri getir
     */
    getLocalCategories(filters?: CategoryFilters): Category[] {
        let categories = DEFAULT_CATEGORIES.map(c => localToDbCategory(c, filters?.facilityId))

        if (filters?.type) {
            categories = categories.filter(c => c.type === filters.type)
        }

        return categories.sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    },

    /**
     * Yeni kategori oluştur
     */
    async createCategory(category: Partial<Category>): Promise<Category> {
        try {
            const { data, error } = await supabase
                .from('categories')
                .insert(category)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Create category error:', error)
            throw error
        }
    },

    /**
     * Varsayılan kategorileri DB'ye seed et
     */
    async seedDefaultCategories(facilityId?: string): Promise<void> {
        const categories = DEFAULT_CATEGORIES.map(c => ({
            name: c.name,
            type: c.type,
            color: c.color,
            facility_id: facilityId || null
        }))

        try {
            // Önce mevcut kategorileri kontrol et
            const { data: existing } = await supabase
                .from('categories')
                .select('name')
                .eq('facility_id', facilityId || null)

            const existingNames = new Set(existing?.map(e => e.name) || [])
            const newCategories = categories.filter(c => !existingNames.has(c.name))

            if (newCategories.length > 0) {
                const { error } = await supabase.from('categories').insert(newCategories)
                if (error) throw error
                console.log(`Seeded ${newCategories.length} default categories`)
            }
        } catch (error) {
            console.error('Seed categories error:', error)
            throw error
        }
    },

    /**
     * Sistem kategorilerini kontrol et ve yoksa oluştur
     * Race condition'ı önlemek için upsert kullan
     */
    async ensureSystemCategories(): Promise<void> {
        const systemCategories = [
            { name: 'Personel Giderleri', type: 'expense', color: '#FF6B6B', icon: 'Users', is_system: true },
            { name: 'Kurban Bağışları', type: 'income', color: '#10B981', icon: 'Heart', is_system: true },
            { name: 'Bütçe Aktarımları', type: 'income', color: '#3B82F6', icon: 'ArrowsLeftRight', is_system: true }
        ]

        try {
            for (const category of systemCategories) {
                // Upsert: insert if not exists, do nothing if exists
                const { error } = await supabase
                    .from('categories')
                    .upsert(category, {
                        onConflict: 'name',
                        ignoreDuplicates: true
                    })

                if (error && !error.message.includes('duplicate')) {
                    console.error(`Failed to ensure category ${category.name}:`, error)
                }
            }
        } catch (error) {
            console.error('Ensure system categories error:', error)
        }
    },

    /**
     * Sistem kategorisi ID'sini getir, yoksa oluştur
     */
    async getOrCreateSystemCategory(name: string, type: 'income' | 'expense'): Promise<string | null> {
        try {
            // First try to find existing
            let { data: category } = await supabase
                .from('categories')
                .select('id')
                .eq('name', name)
                .single()

            if (category) return category.id

            // Create if not exists
            const { data: newCategory, error } = await supabase
                .from('categories')
                .insert({
                    name,
                    type,
                    is_system: true,
                    color: type === 'expense' ? '#FF6B6B' : '#10B981'
                })
                .select('id')
                .single()

            if (error) {
                // If duplicate key error, try to fetch again
                if (error.message.includes('duplicate')) {
                    const { data: existingCategory } = await supabase
                        .from('categories')
                        .select('id')
                        .eq('name', name)
                        .single()
                    return existingCategory?.id || null
                }
                throw error
            }
            return newCategory?.id || null
        } catch (error) {
            console.error(`Get or create system category ${name} error:`, error)
            return null
        }
    },

    /**
     * Tüm lokal varsayılan kategorileri döndür (UI için)
     */
    getAllLocalCategories(): LocalCategory[] {
        return DEFAULT_CATEGORIES
    }
}

