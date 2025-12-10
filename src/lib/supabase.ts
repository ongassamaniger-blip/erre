import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
})

// Helper functions for file uploads
export const uploadFile = async (
    bucket: string,
    path: string,
    file: File
): Promise<{ data: { path: string } | null; error: Error | null }> => {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        return { data: null, error: error as Error }
    }
}

export const deleteFile = async (
    bucket: string,
    path: string
): Promise<{ error: Error | null }> => {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path])

        if (error) throw error
        return { error: null }
    } catch (error) {
        return { error: error as Error }
    }
}

export const getFileUrl = (bucket: string, path: string): string => {
    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

    return data.publicUrl
}

export const getSignedUrl = async (
    bucket: string,
    path: string,
    expiresIn: number = 3600
): Promise<{ data: { signedUrl: string } | null; error: Error | null }> => {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn)

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        return { data: null, error: error as Error }
    }
}
