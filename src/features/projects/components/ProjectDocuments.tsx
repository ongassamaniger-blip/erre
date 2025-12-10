import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { FileText, Download, Trash, Plus, FilePdf, FileImage, File } from '@phosphor-icons/react'
import { projectDocumentService, type ProjectDocument } from '@/services/projects/projectDocumentService'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'
import { formatBytes } from '@/lib/utils'

interface ProjectDocumentsProps {
    projectId: string
}

export function ProjectDocuments({ projectId }: ProjectDocumentsProps) {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const queryClient = useQueryClient()

    const { data: documents, isLoading, error } = useQuery({
        queryKey: ['project-documents', projectId],
        queryFn: () => projectDocumentService.getProjectDocuments(projectId),
    })

    const uploadMutation = useMutation({
        mutationFn: (file: File) => projectDocumentService.uploadDocument(projectId, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] })
            toast.success('Belge yüklendi')
            setUploadDialogOpen(false)
            setSelectedFile(null)
        },
        onError: (error) => {
            toast.error('Yükleme hatası: ' + error.message)
        }
    })

    const deleteMutation = useMutation({
        mutationFn: ({ id, filePath }: { id: string, filePath: string }) =>
            projectDocumentService.deleteDocument(id, filePath),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] })
            toast.success('Belge silindi')
        },
        onError: (error) => {
            toast.error('Silme hatası: ' + error.message)
        }
    })

    const handleUpload = () => {
        if (!selectedFile) return
        uploadMutation.mutate(selectedFile)
    }

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return <FilePdf size={24} className="text-red-500" />
        if (type.includes('image')) return <FileImage size={24} className="text-blue-500" />
        return <FileText size={24} className="text-gray-500" />
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-red-500">
                    Belgeler yüklenirken bir hata oluştu: {(error as Error).message}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Proje Belgeleri</CardTitle>
                        <CardDescription>Projeye ait belgeler ve dökümanlar</CardDescription>
                    </div>
                    <Button onClick={() => setUploadDialogOpen(true)}>
                        <Plus size={18} className="mr-2" />
                        Belge Ekle
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-center py-8">Yükleniyor...</div>
                ) : !documents || documents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        <File size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Henüz belge eklenmemiş</p>
                        <Button variant="link" onClick={() => setUploadDialogOpen(true)}>
                            İlk belgeyi ekle
                        </Button>
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>Dosya Adı</TableHead>
                                    <TableHead>Boyut</TableHead>
                                    <TableHead>Yükleyen</TableHead>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead className="text-right">İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents?.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell>{getFileIcon(doc.file_type)}</TableCell>
                                        <TableCell className="font-medium">{doc.name}</TableCell>
                                        <TableCell>{formatBytes(doc.size)}</TableCell>
                                        <TableCell>{doc.uploader_name}</TableCell>
                                        <TableCell>
                                            {format(new Date(doc.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={async () => {
                                                        try {
                                                            const url = await projectDocumentService.getDownloadUrl(doc.file_path)
                                                            window.open(url, '_blank')
                                                        } catch (e) {
                                                            toast.error('Dosya açılamadı')
                                                        }
                                                    }}
                                                >
                                                    <Download size={18} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => {
                                                        if (confirm('Bu belgeyi silmek istediğinize emin misiniz?')) {
                                                            deleteMutation.mutate({ id: doc.id, filePath: doc.file_path })
                                                        }
                                                    }}
                                                >
                                                    <Trash size={18} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>

            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Belge Yükle</DialogTitle>
                        <DialogDescription>
                            Projeye yeni bir belge veya dosya ekleyin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="file">Dosya Seç</Label>
                            <Input
                                id="file"
                                type="file"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                            İptal
                        </Button>
                        <Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending}>
                            {uploadMutation.isPending ? 'Yükleniyor...' : 'Yükle'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
