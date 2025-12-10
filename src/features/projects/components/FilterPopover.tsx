import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FunnelSimple, X } from '@phosphor-icons/react'

interface FilterPopoverProps {
    filters: {
        type?: 'income' | 'expense'
        dateFrom?: string
        dateTo?: string
        category?: string
        status?: string
    }
    onFilterChange: (filters: any) => void
}

export function FilterPopover({ filters, onFilterChange }: FilterPopoverProps) {
    const hasActiveFilters = Object.values(filters).some(Boolean)

    const handleClear = () => {
        onFilterChange({})
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant={hasActiveFilters ? "secondary" : "outline"} size="sm" className={hasActiveFilters ? "bg-secondary text-secondary-foreground" : ""}>
                    <FunnelSimple size={16} className="mr-2" />
                    Filtrele
                    {hasActiveFilters && (
                        <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                            {Object.values(filters).filter(Boolean).length}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium leading-none">Filtreler</h4>
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={handleClear} className="h-auto p-0 text-muted-foreground hover:text-foreground">
                                <X size={14} className="mr-1" />
                                Temizle
                            </Button>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="grid gap-2">
                                <Label htmlFor="dateFrom">Başlangıç</Label>
                                <Input
                                    id="dateFrom"
                                    type="date"
                                    value={filters.dateFrom || ''}
                                    onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="dateTo">Bitiş</Label>
                                <Input
                                    id="dateTo"
                                    type="date"
                                    value={filters.dateTo || ''}
                                    onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="type">İşlem Tipi</Label>
                            <Select
                                value={filters.type || 'all'}
                                onValueChange={(value) => onFilterChange({ ...filters, type: value === 'all' ? undefined : value })}
                            >
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Tümü" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tümü</SelectItem>
                                    <SelectItem value="income">Gelir</SelectItem>
                                    <SelectItem value="expense">Gider</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="status">Durum</Label>
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) => onFilterChange({ ...filters, status: value === 'all' ? undefined : value })}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Tümü" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tümü</SelectItem>
                                    <SelectItem value="draft">Taslak</SelectItem>
                                    <SelectItem value="pending">Beklemede</SelectItem>
                                    <SelectItem value="approved">Onaylandı</SelectItem>
                                    <SelectItem value="rejected">Reddedildi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category">Kategori</Label>
                            <Select
                                value={filters.category || 'all'}
                                onValueChange={(value) => onFilterChange({ ...filters, category: value === 'all' ? undefined : value })}
                            >
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Tümü" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tümü</SelectItem>
                                    <SelectItem value="Malzeme">Malzeme</SelectItem>
                                    <SelectItem value="İşçilik">İşçilik</SelectItem>
                                    <SelectItem value="Ekipman">Ekipman</SelectItem>
                                    <SelectItem value="Danışmanlık">Danışmanlık</SelectItem>
                                    <SelectItem value="Diğer">Diğer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
