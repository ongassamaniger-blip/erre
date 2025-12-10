import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { campaignService } from '@/services/qurban/qurbanService'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { CheckCircle, Warning } from '@phosphor-icons/react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface CompleteCampaignDialogProps {
    open: boolean
    onClose: () => void
}

export function CompleteCampaignDialog({ open, onClose }: CompleteCampaignDialogProps) {
    const selectedFacility = useAuthStore(state => state.selectedFacility)
    const queryClient = useQueryClient()
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('')

    // Fetch campaigns that are ready to be completed (status = 'completed')
    // 'completed' in this context means "Slaughter finished, ready for distribution"
    // We are moving them to 'archived' which means "Distribution finished, fully done"
    const { data: campaigns = [] } = useQuery({
        queryKey: ['qurban-campaigns-to-complete', selectedFacility?.id],
        queryFn: async () => {
            const all = await campaignService.getCampaigns({ facilityId: selectedFacility?.id })
            return all.filter(c => c.status === 'completed')
        },
        enabled: open && !!selectedFacility?.id,
    })

    const completeMutation = useMutation({
        mutationFn: async (id: string) => {
            await campaignService.updateCampaign(id, { status: 'archived' })
        },
        onSuccess: () => {
            toast.success('Kampanya başarıyla tamamlandı ve arşivlendi.')
            queryClient.invalidateQueries({ queryKey: ['qurban-campaigns'] })
            queryClient.invalidateQueries({ queryKey: ['qurban-distributions'] })
            handleClose()
        },
        onError: (error) => {
            console.error('Campaign completion error:', error)
            toast.error('Kampanya tamamlanırken bir hata oluştu.')
        }
    })

    const handleClose = () => {
        setSelectedCampaignId('')
        onClose()
    }

    const handleSubmit = () => {
        if (!selectedCampaignId) return
        completeMutation.mutate(selectedCampaignId)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle size={24} className="text-green-600" />
                        Et Dağıtımını Tamamla
                    </DialogTitle>
                    <DialogDescription>
                        Et dağıtımı tamamen biten kampanyayı seçerek arşivleyin.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <Alert variant="destructive">
                        <Warning className="h-4 w-4" />
                        <AlertTitle>Dikkat</AlertTitle>
                        <AlertDescription>
                            Bu işlem kampanyayı <strong>arşivlenmiş</strong> duruma getirecektir.
                            Arşivlenen kampanyalar için yeni bağış alınamaz, kesim programı oluşturulamaz ve yeni dağıtım kaydı girilemez.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <Label>Tamamlanacak Kampanya</Label>
                        <Select
                            value={selectedCampaignId}
                            onValueChange={setSelectedCampaignId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Kampanya seçin..." />
                            </SelectTrigger>
                            <SelectContent>
                                {campaigns.length > 0 ? (
                                    campaigns.map((campaign) => (
                                        <SelectItem key={campaign.id} value={campaign.id}>
                                            {campaign.name} ({campaign.year})
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                        Tamamlanacak kampanya bulunamadı
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        İptal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!selectedCampaignId || completeMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {completeMutation.isPending ? 'İşleniyor...' : 'Kampanyayı Tamamla ve Arşivle'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
