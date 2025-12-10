import { supabase } from '@/lib/supabase'

export interface ProjectDocument {
    id: string
    project_id: string
    name: string
    file_path: string
    file_type: string
    size: number
    uploaded_by: string
    created_at: string
    uploader_name?: string
}

export const projectDocumentService = {
    async getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
        const { data, error } = await supabase
            .from('project_documents')
            .select(`
        *,
        uploader:uploaded_by (
          name
        )
      `)
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return data.map((doc: any) => ({
            ...doc,
            uploader_name: doc.uploader ? doc.uploader.name : 'Bilinmeyen Kullanıcı'
        }))
    },

    async uploadDocument(projectId: string, file: File) {
        // 1. Upload file to storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${projectId}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
            .from('project-documents')
            .upload(fileName, file)

        if (uploadError) throw uploadError

        // 2. Create database record
        const { data, error: dbError } = await supabase
            .from('project_documents')
            .insert({
                project_id: projectId,
                name: file.name,
                file_path: fileName,
                file_type: file.type,
                size: file.size,
                uploaded_by: (await supabase.auth.getUser()).data.user?.id
            })
            .select()
            .single()

        if (dbError) throw dbError
        return data
    },

    async deleteDocument(id: string, filePath: string) {
        // 1. Delete from storage
        const { error: storageError } = await supabase.storage
            .from('project-documents')
            .remove([filePath])

        if (storageError) throw storageError

        // 2. Delete from database
        const { error: dbError } = await supabase
            .from('project_documents')
            .delete()
            .eq('id', id)

        if (dbError) throw dbError
    },

    async getDownloadUrl(filePath: string) {
        const { data, error } = await supabase.storage
            .from('project-documents')
            .createSignedUrl(filePath, 3600) // 1 hour

        if (error) throw error
        return data.signedUrl
    }
}
