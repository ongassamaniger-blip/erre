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
import { Switch } from '@/components/ui/switch'
import { chartOfAccountsService } from '@/services/finance/chartOfAccountsService'
import { ChartAccount } from '@/types/finance'
import { toast } from 'sonner'

interface AccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: ChartAccount
  parentAccount?: ChartAccount
  onSuccess: () => void
}

export function AccountDialog({ open, onOpenChange, account, parentAccount, onSuccess }: AccountDialogProps) {
  const [formData, setFormData] = useState<Partial<ChartAccount>>({
    code: '',
    name: '',
    type: 'expense',
    parentId: undefined,
    level: 1,
    isActive: true,
    balance: 0,
    currency: 'TRY',
    description: '',
  })

  const isEditing = !!account

  // Get all accounts for parent selection
  const { data: allAccounts } = useQuery({
    queryKey: ['chart-of-accounts-flat'],
    queryFn: () => chartOfAccountsService.getAllAccountsFlat(),
    enabled: open,
  })

  // Filter parent options (exclude self and descendants)
  const parentOptions = allAccounts?.filter(acc => {
    if (isEditing && acc.id === account?.id) return false
    // Exclude descendants
    if (isEditing && account) {
      const isDescendant = (parentId: string | undefined): boolean => {
        if (!parentId) return false
        if (parentId === account.id) return true
        const parent = allAccounts?.find(a => a.id === parentId)
        return parent ? isDescendant(parent.parentId) : false
      }
      if (isDescendant(acc.parentId)) return false
    }
    return true
  }) || []

  useEffect(() => {
    if (account) {
      setFormData({
        code: account.code,
        name: account.name,
        type: account.type,
        parentId: account.parentId,
        level: account.level,
        isActive: account.isActive,
        balance: account.balance,
        currency: account.currency,
        description: account.description,
      })
    } else if (parentAccount) {
      setFormData({
        code: '',
        name: '',
        type: parentAccount.type,
        parentId: parentAccount.id,
        level: parentAccount.level + 1,
        isActive: true,
        balance: 0,
        currency: parentAccount.currency,
        description: '',
      })
    } else {
      setFormData({
        code: '',
        name: '',
        type: 'expense',
        parentId: undefined,
        level: 1,
        isActive: true,
        balance: 0,
        currency: 'TRY',
        description: '',
      })
    }
  }, [account, parentAccount, open])

  const handleSubmit = async () => {
    if (!formData.code || !formData.name) {
      toast.error('Hesap kodu ve adı zorunludur')
      return
    }

    // Check if code already exists (for new accounts)
    if (!isEditing && allAccounts?.some(acc => acc.code === formData.code)) {
      toast.error('Bu hesap kodu zaten kullanılıyor')
      return
    }

    // Check if code already exists for another account (for editing)
    if (isEditing && allAccounts?.some(acc => acc.code === formData.code && acc.id !== account?.id)) {
      toast.error('Bu hesap kodu başka bir hesap tarafından kullanılıyor')
      return
    }

    try {
      if (isEditing && account) {
        await chartOfAccountsService.updateAccount(account.id, formData)
        toast.success('Hesap güncellendi')
      } else {
        await chartOfAccountsService.createAccount(formData)
        toast.success('Hesap oluşturuldu')
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.message || 'Bir hata oluştu')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Hesap Düzenle' : 'Yeni Hesap Oluştur'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Hesap bilgilerini güncelleyin' : 'Yeni bir hesap oluşturun'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Hesap Kodu *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Örn: 100, 101, 102"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Hesap Tipi *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as ChartAccount['type'] })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">Aktif</SelectItem>
                  <SelectItem value="liability">Pasif</SelectItem>
                  <SelectItem value="equity">Özkaynak</SelectItem>
                  <SelectItem value="income">Gelir</SelectItem>
                  <SelectItem value="expense">Gider</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Hesap Adı *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Hesap adı"
            />
          </div>

          {!parentAccount && (
            <div className="space-y-2">
              <Label htmlFor="parentId">Üst Hesap</Label>
              <Select
                value={formData.parentId || 'none'}
                onValueChange={(value) => {
                  if (value === 'none') {
                    setFormData({ ...formData, parentId: undefined, level: 1 })
                  } else {
                    const selectedParent = parentOptions.find(p => p.id === value)
                    setFormData({
                      ...formData,
                      parentId: value,
                      level: (selectedParent?.level || 0) + 1,
                      type: selectedParent?.type || formData.type
                    })
                  }
                }}
              >
                <SelectTrigger id="parentId">
                  <SelectValue placeholder="Üst hesap seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Üst hesap yok (Ana hesap)</SelectItem>
                  {parentOptions.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.code} - {parent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {parentAccount && !isEditing && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Üst Hesap</div>
              <div className="font-medium">{parentAccount.code} - {parentAccount.name}</div>
            </div>
          )}

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="parentId">Üst Hesap</Label>
              <Select
                value={formData.parentId || 'none'}
                onValueChange={(value) => {
                  if (value === 'none') {
                    setFormData({ ...formData, parentId: undefined, level: 1 })
                  } else {
                    const selectedParent = parentOptions.find(p => p.id === value)
                    setFormData({
                      ...formData,
                      parentId: value,
                      level: (selectedParent?.level || 0) + 1
                    })
                  }
                }}
              >
                <SelectTrigger id="parentId">
                  <SelectValue placeholder="Üst hesap seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Üst hesap yok (Ana hesap)</SelectItem>
                  {parentOptions.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.code} - {parent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="currency">Para Birimi</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => setFormData({ ...formData, currency: value })}
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">TRY</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Açıklama</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Hesap açıklaması"
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">Aktif</Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  )
}

