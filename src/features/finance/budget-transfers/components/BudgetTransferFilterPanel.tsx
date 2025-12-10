import { BudgetTransferFilters } from '@/types/finance'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Facility } from '@/types'

interface BudgetTransferFilterPanelProps {
  filters: BudgetTransferFilters
  onChange: (filters: BudgetTransferFilters) => void
  isHeadquarters: boolean
  facilities: Facility[]
}

export function BudgetTransferFilterPanel({
  filters,
  onChange,
  isHeadquarters,
  facilities
}: BudgetTransferFilterPanelProps) {
  const handleChange = (key: keyof BudgetTransferFilters, value: any) => {
    onChange({ ...filters, [key]: value || undefined })
  }

  const branches = facilities.filter(f => f.type === 'branch')
  const headquarters = facilities.filter(f => f.type === 'headquarters')

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {!isHeadquarters && (
        <div className="space-y-2">
          <Label>Gönderen Şube</Label>
          <Select
            value={filters.fromFacilityId || ''}
            onValueChange={value => handleChange('fromFacilityId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tümü</SelectItem>
              {headquarters.map(facility => (
                <SelectItem key={facility.id} value={facility.id}>
                  {facility.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isHeadquarters && (
        <div className="space-y-2">
          <Label>Hedef Şube</Label>
          <Select
            value={filters.toFacilityId || ''}
            onValueChange={value => handleChange('toFacilityId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tümü</SelectItem>
              {branches.map(branch => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Durum</Label>
        <Select
          value={filters.status || ''}
          onValueChange={value => handleChange('status', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tümü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tümü</SelectItem>
            <SelectItem value="pending">Bekliyor</SelectItem>
            <SelectItem value="approved">Onaylandı</SelectItem>
            <SelectItem value="rejected">Reddedildi</SelectItem>
            <SelectItem value="completed">Tamamlandı</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Başlangıç Tarihi</Label>
        <Input
          type="date"
          value={filters.dateFrom || ''}
          onChange={e => handleChange('dateFrom', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Bitiş Tarihi</Label>
        <Input
          type="date"
          value={filters.dateTo || ''}
          onChange={e => handleChange('dateTo', e.target.value)}
        />
      </div>
    </div>
  )
}

