import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, CalendarBlank, Clock, MapPin, FileArrowDown, Printer, FilePdf } from '@phosphor-icons/react'
import { exportSchedulesToExcel } from '@/utils/qurbanExport'
import { toast } from 'sonner'
import { scheduleService } from '@/services/qurban/qurbanService'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useAuthStore } from '@/store/authStore'
import { CreateScheduleDialog } from './CreateScheduleDialog'
import { ExportDialog } from './ExportDialog'
import type { QurbanSchedule } from '@/types'

const statusColors = {
  scheduled: 'bg-blue-500/10 text-blue-700 border-blue-200',
  'in-progress': 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  completed: 'bg-green-500/10 text-green-700 border-green-200',
}

const statusLabels = {
  scheduled: 'Planlandı',
  'in-progress': 'Devam Ediyor',
  completed: 'Tamamlandı',
}

export function ScheduleTab() {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const queryClient = useQueryClient()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<QurbanSchedule | undefined>()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['qurban-schedules', selectedFacility?.id],
    queryFn: () => scheduleService.getSchedules({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id,
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(schedules.map((s) => s.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleExport = (options: {
    type: 'all' | 'filtered' | 'selected'
    selectedIds?: string[]
  }) => {
    let dataToExport: QurbanSchedule[] = []

    if (options.type === 'all' || options.type === 'filtered') {
      dataToExport = schedules
    } else if (options.type === 'selected' && options.selectedIds) {
      dataToExport = schedules.filter((s) => options.selectedIds!.includes(s.id))
    }

    if (dataToExport.length === 0) {
      toast.error('Dışa aktarılacak program bulunamadı')
      return
    }

    exportSchedulesToExcel(dataToExport)
    toast.success(`${dataToExport.length} program Excel dosyası olarak indiriliyor...`)
  }

  const handleCreate = () => {
    setEditingSchedule(undefined)
    setCreateDialogOpen(true)
  }

  const handleEdit = (schedule: QurbanSchedule) => {
    setEditingSchedule(schedule)
    setCreateDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setExportDialogOpen(true)}
          >
            <FileArrowDown size={20} />
            Excel İndir
          </Button>
        </div>
        <Button onClick={handleCreate}>
          <Plus size={20} weight="bold" />
          Yeni Kesim Programı
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kesim Programı</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
          ) : schedules.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.size === schedules.length && schedules.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Saat</TableHead>
                    <TableHead>Lokasyon</TableHead>
                    <TableHead>Planlanan</TableHead>
                    <TableHead>Tamamlanan</TableHead>
                    <TableHead>Sorumlu</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">Aksiyonlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(schedule.id)}
                          onCheckedChange={(checked) => handleSelectOne(schedule.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarBlank size={16} />
                          <span className="font-medium">
                            {schedule.date && !isNaN(new Date(schedule.date).getTime())
                              ? format(new Date(schedule.date), 'dd MMMM yyyy', { locale: tr })
                              : '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock size={16} />
                          <span>{schedule.startTime} - {schedule.endTime}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={16} />
                          <span>{schedule.location}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{schedule.plannedCount}</TableCell>
                      <TableCell>
                        <span className={schedule.completedCount > 0 ? 'text-green-600 font-medium' : ''}>
                          {schedule.completedCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{schedule.responsible}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[schedule.status]}>
                          {statusLabels[schedule.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(schedule)}
                        >
                          Detay
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Henüz kesim programı eklenmemiş
            </div>
          )}
        </CardContent>
      </Card>

      <CreateScheduleDialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false)
          setEditingSchedule(undefined)
        }}
        onSuccess={() => {
          setCreateDialogOpen(false)
          setEditingSchedule(undefined)
          queryClient.invalidateQueries({ queryKey: ['qurban-schedules'] })
        }}
        schedule={editingSchedule}
      />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={(options) =>
          handleExport({
            ...options,
            selectedIds: options.type === 'selected' ? Array.from(selectedIds) : undefined,
          })
        }
        totalCount={schedules.length}
        filteredCount={schedules.length}
        selectedCount={selectedIds.size}
        hasFilters={false}
      />
    </div>
  )
}
