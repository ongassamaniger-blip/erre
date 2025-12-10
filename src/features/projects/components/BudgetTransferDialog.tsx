import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { budgetService } from '@/services/finance/budgetService'
import { toast } from 'sonner'
import { CurrencyDollar } from '@phosphor-icons/react'

interface BudgetTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectName: string
  currentBudget: number
  currency: string
  onSuccess: () => void
}

export function BudgetTransferDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  currentBudget,
  currency,
  onSuccess,
}: BudgetTransferDialogProps) {
  const [formData, setFormData] = useState({
    sourceBudgetId: '',
    amount: 0,
    description: '',
  })

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets', 'available'],
    queryFn: () => budgetService.getBudgets({ status: 'active' }),
    enabled: open,
  })

  // Sadece proje dışı bütçeleri göster (departman veya kategori bazlı)
  const availableBudgets = Array.isArray(budgets)
    ? budgets.filter(b => b.scope !== 'project' || (b.scope === 'project' && b.scopeId !== projectId))
    : []

  const handleSubmit = async () => {
    if (!formData.sourceBudgetId) {
      toast.error('Kaynak bütçe seçiniz')
      return
    }
    if (formData.amount <= 0) {
      toast.error('Tutar 0\'dan büyük olmalıdır')
      return
    }

    try {
      const sourceBudget = availableBudgets.find(b => b.id === formData.sourceBudgetId)
      if (!sourceBudget) {
        toast.error('Kaynak bütçe bulunamadı')
        return
      }

      // Kaynak bütçeden düş
      const remaining = sourceBudget.remaining
      if (formData.amount > remaining) {
        toast.error(`Yetersiz bütçe. Kalan: ${remaining.toLocaleString('tr-TR')} ${currency}`)
        return
      }

      // Bütçe aktarımını gerçekleştir
      await budgetService.transferBudgetToProject(
        formData.sourceBudgetId,
        projectId,
        formData.amount,
        formData.description || `Proje bütçesi aktarımı: ${projectName}`
      )

      toast.success('Bütçe başarıyla aktarıldı')
      onSuccess()
      onOpenChange(false)
      setFormData({ sourceBudgetId: '', amount: 0, description: '' })
    } catch (error: any) {
      toast.error(error.message || 'Bütçe aktarımı sırasında hata oluştu')
    }
  }

  const selectedBudget = availableBudgets.find(b => b.id === formData.sourceBudgetId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CurrencyDollar size={20} />
            Projeye Bütçe Aktar
          </DialogTitle>
          <DialogDescription>
            {projectName} projesine finans modülünden bütçe aktarın
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Proje</div>
            <div className="font-semibold">{projectName}</div>
            <div className="text-sm text-muted-foreground mt-2">
              Mevcut Bütçe: {currentBudget.toLocaleString('tr-TR')} {currency}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceBudget">Kaynak Bütçe *</Label>
            <Select
              value={formData.sourceBudgetId}
              onValueChange={(value) => setFormData({ ...formData, sourceBudgetId: value })}
            >
              <SelectTrigger id="sourceBudget">
                <SelectValue placeholder="Kaynak bütçe seçin" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                ) : availableBudgets.length === 0 ? (
                  <SelectItem value="none" disabled>Uygun bütçe bulunamadı</SelectItem>
                ) : (
                  <>
                    <SelectItem value="header_hq" disabled className="font-semibold text-primary">Genel Merkez</SelectItem>
                    {availableBudgets.filter(b => b.scope === 'global' || b.name.toLowerCase().includes('genel merkez')).map(budget => (
                      <SelectItem key={budget.id} value={budget.id}>
                        {budget.name} - Kalan: {budget.remaining.toLocaleString('tr-TR')} {budget.currency}
                      </SelectItem>
                    ))}

                    <SelectItem value="header_dept" disabled className="font-semibold text-primary mt-2">Departmanlar</SelectItem>
                    {availableBudgets.filter(b => b.scope === 'department' && !b.name.toLowerCase().includes('genel merkez')).map(budget => (
                      <SelectItem key={budget.id} value={budget.id}>
                        {budget.name} - Kalan: {budget.remaining.toLocaleString('tr-TR')} {budget.currency}
                      </SelectItem>
                    ))}

                    <SelectItem value="header_other" disabled className="font-semibold text-primary mt-2">Diğer</SelectItem>
                    {availableBudgets.filter(b => b.scope !== 'global' && b.scope !== 'department').map(budget => (
                      <SelectItem key={budget.id} value={budget.id}>
                        {budget.name} - Kalan: {budget.remaining.toLocaleString('tr-TR')} {budget.currency}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            {selectedBudget && (
              <div className="text-sm text-muted-foreground mt-1">
                Kullanılabilir: {selectedBudget.remaining.toLocaleString('tr-TR')} {selectedBudget.currency}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Aktarılacak Tutar *</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            {selectedBudget && formData.amount > selectedBudget.remaining && (
              <div className="text-sm text-red-600">
                Yetersiz bütçe! Maksimum: {selectedBudget.remaining.toLocaleString('tr-TR')} {selectedBudget.currency}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Bütçe aktarım açıklaması (isteğe bağlı)"
              rows={3}
            />
          </div>

          {selectedBudget && formData.amount > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm font-semibold mb-2">Özet</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kaynak Bütçe:</span>
                  <span className="font-medium">{selectedBudget.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aktarılacak Tutar:</span>
                  <span className="font-medium">{formData.amount.toLocaleString('tr-TR')} {currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Yeni Proje Bütçesi:</span>
                  <span className="font-semibold text-green-600">
                    {(currentBudget + formData.amount).toLocaleString('tr-TR')} {currency}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.sourceBudgetId || formData.amount <= 0}>
            Bütçe Aktar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

