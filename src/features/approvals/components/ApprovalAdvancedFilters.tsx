import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { FunnelSimple, X, CalendarBlank, MagnifyingGlass } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useState } from 'react'

interface ApprovalAdvancedFiltersProps {
  filters: {
    module: string
    status: string
    priority: string
    search?: string
    startDate?: Date
    endDate?: Date
    minAmount?: number
    maxAmount?: number
  }
  onFiltersChange: (filters: any) => void
  onClear: () => void
}

export function ApprovalAdvancedFilters({
  filters,
  onFiltersChange,
  onClear,
}: ApprovalAdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)

  const handleApply = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  const handleClear = () => {
    const cleared = {
      module: 'all',
      status: 'all',
      priority: 'all',
      search: '',
      startDate: undefined,
      endDate: undefined,
      minAmount: undefined,
      maxAmount: undefined,
    }
    setLocalFilters(cleared)
    onFiltersChange(cleared)
    onClear()
  }

  const activeFilterCount = [
    filters.module !== 'all',
    filters.status !== 'all',
    filters.priority !== 'all',
    filters.search,
    filters.startDate,
    filters.endDate,
    filters.minAmount,
    filters.maxAmount,
  ].filter(Boolean).length

  return (
    <div className="flex items-center gap-2">
      {/* Arama */}
      <div className="relative flex-1 max-w-sm">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Başlık, açıklama veya talep eden ara..."
          value={localFilters.search || ''}
          onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleApply()
            }
          }}
          className="pl-9"
        />
      </div>

      {/* Gelişmiş Filtreler */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <FunnelSimple size={16} />
            Filtreler
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Gelişmiş Filtreler</h4>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-7 text-xs"
                >
                  Temizle
                </Button>
              )}
            </div>

            {/* Tarih Aralığı */}
            <div className="space-y-2">
              <Label className="text-xs">Tarih Aralığı</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start text-left font-normal"
                    >
                      <CalendarBlank size={16} className="mr-2" />
                      {localFilters.startDate
                        ? format(localFilters.startDate, 'dd MMM yyyy', { locale: tr })
                        : 'Başlangıç'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.startDate}
                      onSelect={(date) =>
                        setLocalFilters({ ...localFilters, startDate: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start text-left font-normal"
                    >
                      <CalendarBlank size={16} className="mr-2" />
                      {localFilters.endDate
                        ? format(localFilters.endDate, 'dd MMM yyyy', { locale: tr })
                        : 'Bitiş'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.endDate}
                      onSelect={(date) =>
                        setLocalFilters({ ...localFilters, endDate: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Tutar Aralığı */}
            <div className="space-y-2">
              <Label className="text-xs">Tutar Aralığı</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={localFilters.minAmount || ''}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      minAmount: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={localFilters.maxAmount || ''}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      maxAmount: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handleApply} className="flex-1">
                Uygula
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsOpen(false)}>
                İptal
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

