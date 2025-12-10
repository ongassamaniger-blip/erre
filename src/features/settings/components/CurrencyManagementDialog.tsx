import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash, ArrowUp, ArrowDown } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Currency {
  code: string
  name: string
  symbol: string
  isDefault: boolean
}

interface CurrencyManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currencies: Currency[]
  onUpdate: (currencies: Currency[]) => void
}

const availableCurrencies = [
  { code: 'TRY', name: 'Türk Lirası', symbol: '₺' },
  { code: 'USD', name: 'Amerikan Doları', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'İngiliz Sterlini', symbol: '£' },
  { code: 'SAR', name: 'Suudi Riyali', symbol: '﷼' },
  { code: 'AED', name: 'Birleşik Arap Emirlikleri Dirhemi', symbol: 'د.إ' },
  { code: 'JPY', name: 'Japon Yeni', symbol: '¥' },
  { code: 'CNY', name: 'Çin Yuanı', symbol: '¥' },
]

export function CurrencyManagementDialog({
  open,
  onOpenChange,
  currencies,
  onUpdate,
}: CurrencyManagementDialogProps) {
  const [localCurrencies, setLocalCurrencies] = useState<Currency[]>(currencies)
  const [selectedCurrency, setSelectedCurrency] = useState<string>('')

  const handleAddCurrency = () => {
    if (!selectedCurrency) {
      toast.error('Lütfen bir para birimi seçin')
      return
    }

    const currency = availableCurrencies.find(c => c.code === selectedCurrency)
    if (!currency) return

    if (localCurrencies.some(c => c.code === currency.code)) {
      toast.error('Bu para birimi zaten ekli')
      return
    }

    setLocalCurrencies([...localCurrencies, { ...currency, isDefault: false }])
    setSelectedCurrency('')
  }

  const handleRemoveCurrency = (code: string) => {
    if (localCurrencies.find(c => c.code === code)?.isDefault) {
      toast.error('Varsayılan para birimi silinemez')
      return
    }
    setLocalCurrencies(localCurrencies.filter(c => c.code !== code))
  }

  const handleSetDefault = (code: string) => {
    setLocalCurrencies(
      localCurrencies.map(c => ({
        ...c,
        isDefault: c.code === code,
      }))
    )
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newCurrencies = [...localCurrencies]
    ;[newCurrencies[index - 1], newCurrencies[index]] = [
      newCurrencies[index],
      newCurrencies[index - 1],
    ]
    setLocalCurrencies(newCurrencies)
  }

  const handleMoveDown = (index: number) => {
    if (index === localCurrencies.length - 1) return
    const newCurrencies = [...localCurrencies]
    ;[newCurrencies[index], newCurrencies[index + 1]] = [
      newCurrencies[index + 1],
      newCurrencies[index],
    ]
    setLocalCurrencies(newCurrencies)
  }

  const handleSave = () => {
    if (localCurrencies.length === 0) {
      toast.error('En az bir para birimi olmalıdır')
      return
    }

    if (!localCurrencies.some(c => c.isDefault)) {
      toast.error('Varsayılan para birimi seçilmelidir')
      return
    }

    onUpdate(localCurrencies)
    toast.success('Para birimleri güncellendi')
    onOpenChange(false)
  }

  const availableToAdd = availableCurrencies.filter(
    c => !localCurrencies.some(lc => lc.code === c.code)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Para Birimi Yönetimi</DialogTitle>
          <DialogDescription>
            Şube için kullanılacak para birimlerini ekleyin, çıkarın veya sıralayın
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Para birimi seçin" />
              </SelectTrigger>
              <SelectContent>
                {availableToAdd.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name} ({currency.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddCurrency} disabled={!selectedCurrency} className="gap-2">
              <Plus size={16} />
              Ekle
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Mevcut Para Birimleri</Label>
            <div className="border rounded-lg divide-y">
              {localCurrencies.map((currency, index) => (
                <div
                  key={currency.code}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-lg font-semibold">{currency.symbol}</span>
                    <div className="flex-1">
                      <div className="font-medium">{currency.name}</div>
                      <div className="text-xs text-muted-foreground">{currency.code}</div>
                    </div>
                    {currency.isDefault && (
                      <Badge variant="default" className="text-xs">
                        Varsayılan
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      title="Yukarı Taşı"
                    >
                      <ArrowUp size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === localCurrencies.length - 1}
                      title="Aşağı Taşı"
                    >
                      <ArrowDown size={16} />
                    </Button>
                    {!currency.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCurrency(currency.code)}
                        title="Sil"
                      >
                        <Trash size={16} className="text-destructive" />
                      </Button>
                    )}
                    {!currency.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(currency.code)}
                      >
                        Varsayılan Yap
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSave}>Kaydet</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

