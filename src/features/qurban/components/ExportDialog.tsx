import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { FileArrowDown } from '@phosphor-icons/react'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (options: { type: 'all' | 'filtered' | 'selected'; selectedIds?: string[] }) => void
  totalCount: number
  filteredCount: number
  selectedCount: number
  hasFilters: boolean
}

export function ExportDialog({
  open,
  onOpenChange,
  onExport,
  totalCount,
  filteredCount,
  selectedCount,
  hasFilters,
}: ExportDialogProps) {
  const [exportType, setExportType] = useState<'all' | 'filtered' | 'selected'>('filtered')

  const handleExport = () => {
    onExport({ type: exportType })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excel Dışa Aktar</DialogTitle>
          <DialogDescription>
            Dışa aktarmak istediğiniz kayıtları seçin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={exportType} onValueChange={(value: any) => setExportType(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span>Tüm Kayıtlar</span>
                  <span className="text-sm text-muted-foreground">{totalCount} kayıt</span>
                </div>
              </Label>
            </div>

            {hasFilters && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="filtered" id="filtered" />
                <Label htmlFor="filtered" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span>Filtrelenmiş Kayıtlar</span>
                    <span className="text-sm text-muted-foreground">{filteredCount} kayıt</span>
                  </div>
                </Label>
              </div>
            )}

            {selectedCount > 0 && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="selected" id="selected" />
                <Label htmlFor="selected" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span>Seçili Kayıtlar</span>
                    <span className="text-sm text-muted-foreground">{selectedCount} kayıt</span>
                  </div>
                </Label>
              </div>
            )}
          </RadioGroup>

          {!hasFilters && selectedCount === 0 && (
            <p className="text-sm text-muted-foreground">
              Filtre veya seçim yapmadığınız için tüm kayıtlar dışa aktarılacak.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleExport}>
            <FileArrowDown size={16} className="mr-2" />
            Dışa Aktar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

