import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowCounterClockwise, Trash, Warning } from '@phosphor-icons/react'
import { projectService } from '@/services/projects/projectService'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface QuarantinedProjectsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function QuarantinedProjectsDialog({ open, onOpenChange }: QuarantinedProjectsDialogProps) {
    const queryClient = useQueryClient()
    const selectedFacility = useAuthStore(state => state.selectedFacility)

    const { data: quarantinedProjects = [], isLoading } = useQuery({
        queryKey: ['projects', 'quarantined', selectedFacility?.id],
        queryFn: () => projectService.getProjects(selectedFacility?.id, true),
        enabled: open && !!selectedFacility?.id,
    })

    const restoreMutation = useMutation({
        mutationFn: (id: string) => projectService.restoreProject(id),
        onSuccess: () => {
            toast.success('Proje başarıyla geri yüklendi')
            queryClient.invalidateQueries({ queryKey: ['projects'] })
        },
        onError: (error) => {
            toast.error('Geri yükleme başarısız: ' + error.message)
        }
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trash size={24} className="text-destructive" />
                        Karantinadaki Projeler
                    </DialogTitle>
                    <DialogDescription>
                        Silinmiş projeleri buradan görüntüleyebilir ve geri yükleyebilirsiniz.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 mt-4 pr-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-1/3" />
                                        <Skeleton className="h-3 w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : quarantinedProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <Warning size={48} className="mb-4 opacity-20" />
                            <p>Karantinada proje bulunmuyor</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {quarantinedProjects.map((project) => (
                                <div
                                    key={project.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium">{project.name}</h4>
                                            <Badge variant="outline" className="text-xs">
                                                {project.code}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>Yönetici: {project.managerName}</span>
                                            <span>
                                                Bitiş: {format(new Date(project.endDate), 'dd MMM yyyy', { locale: tr })}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                                        onClick={() => restoreMutation.mutate(project.id)}
                                        disabled={restoreMutation.isPending}
                                    >
                                        <ArrowCounterClockwise size={16} />
                                        {restoreMutation.isPending ? 'Yükleniyor...' : 'Geri Yükle'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
