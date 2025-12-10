import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { differenceInBusinessDays } from 'date-fns'
import { toast } from 'sonner'
import { leaveService } from '@/services/leaveService'
import { employeeService } from '@/services/hr/employeeService'
import { useAuthStore } from '@/store/authStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, FileArrowUp } from '@phosphor-icons/react'
import type { LeaveType } from '@/types/hr'

interface NewLeaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultEmployeeId?: string
}

const leaveTypes: { value: LeaveType; label: string; requiresDocument?: boolean }[] = [
  { value: 'annual', label: 'Yıllık İzin' },
  { value: 'sick', label: 'Hastalık İzni' },
  { value: 'unpaid', label: 'Ücretsiz İzin' },
  { value: 'maternity', label: 'Doğum İzni' },
  { value: 'paternity', label: 'Babalık İzni' },
  { value: 'other', label: 'Diğer' },
]

interface LeaveFormData {
  employeeId: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  reason: string
}

export function NewLeaveDialog({ open, onOpenChange, defaultEmployeeId }: NewLeaveDialogProps) {
  const user = useAuthStore(state => state.user)
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const queryClient = useQueryClient()
  const [totalDays, setTotalDays] = useState(0)

  const { data: employees } = useQuery({
    queryKey: ['employees', { facilityId: selectedFacility?.id }],
    queryFn: () => employeeService.getEmployees({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id || !!defaultEmployeeId,
  })

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<LeaveFormData>({
    defaultValues: {
      employeeId: defaultEmployeeId || user?.id || '',
      leaveType: 'annual',
      startDate: '',
      endDate: '',
      reason: '',
    }
  })

  const startDate = watch('startDate')
  const endDate = watch('endDate')
  const selectedLeaveType = watch('leaveType')
  const selectedEmployee = watch('employeeId')

  const createLeaveMutation = useMutation({
    mutationFn: async (data: LeaveFormData) => {
      // If defaultEmployeeId is provided, use it to find the employee in the fetched list
      // Or fetch it individually if not found (edge case)
      let employee = employees?.find(emp => emp.id === data.employeeId)

      if (!employee && data.employeeId) {
        employee = await employeeService.getEmployeeById(data.employeeId) || undefined
      }

      if (!employee) throw new Error('Employee not found')

      return leaveService.createLeave({
        employeeId: data.employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays,
        reason: data.reason,
        facilityId: employee.facilityId,
        status: 'approved', // Auto-approve
        approverId: user?.id,
        approverName: user ? `${user.email}` : 'Sistem', // User type might not have firstName/lastName yet
        approvalDate: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      toast.success('İzin talebi onaylandı')
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      queryClient.invalidateQueries({ queryKey: ['employee-leaves'] })
      queryClient.invalidateQueries({ queryKey: ['employee', defaultEmployeeId] }) // Invalidate employee details to update entitlements
      reset()
      setTotalDays(0)
      onOpenChange(false)
    },
    onError: () => {
      toast.error('İzin talebi oluşturulurken bir hata oluştu')
    },
  })

  const onSubmit = (data: LeaveFormData) => {
    if (totalDays <= 0) {
      toast.error('Geçerli bir tarih aralığı seçiniz')
      return
    }

    // Check for annual leave limit
    if (data.leaveType === 'annual') {
      const remainingDays = annualLeaveEntitlement ? annualLeaveEntitlement.remainingDays : 14

      if (totalDays > remainingDays) {
        toast.error('Bu kişinin yıllık izin hakkı doldu')
        return
      }
    }

    createLeaveMutation.mutate(data)
  }

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0
    const startDateObj = new Date(start)
    const endDateObj = new Date(end)
    if (startDateObj > endDateObj) return 0

    const days = differenceInBusinessDays(endDateObj, startDateObj) + 1
    return Math.max(0, days)
  }

  // Calculate days whenever start or end date changes
  useEffect(() => {
    const days = calculateDays(startDate, endDate)
    setTotalDays(days)
  }, [startDate, endDate])

  const selectedLeaveTypeConfig = leaveTypes.find(t => t.value === selectedLeaveType)
  const employee = employees?.find(emp => emp.id === selectedEmployee)
  const annualLeaveEntitlement = employee?.leaveEntitlements.find(e => e.type === 'annual')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni İzin Talebi</DialogTitle>
          <DialogDescription>
            Yeni bir izin talebi oluşturun
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {!defaultEmployeeId && (user?.role === 'Super Admin' || user?.role === 'Admin' || user?.role === 'Manager') ? (
            <div className="space-y-2">
              <Label htmlFor="employeeId">Çalışan *</Label>
              <Select
                value={selectedEmployee}
                onValueChange={(value) => setValue('employeeId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Çalışan seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    ?.filter(emp => emp.status === 'active')
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} - {emp.position}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <input type="hidden" {...register('employeeId')} />
          )}

          <div className="space-y-2">
            <Label htmlFor="leaveType">İzin Tipi *</Label>
            <Select
              value={selectedLeaveType}
              onValueChange={(value) => setValue('leaveType', value as LeaveType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="İzin tipi seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Başlangıç Tarihi *</Label>
              <Input
                type="date"
                {...register('startDate', { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Bitiş Tarihi *</Label>
              <Input
                type="date"
                {...register('endDate', { required: true })}
                {...register('endDate', { required: true })}
                min={startDate}
              />
            </div>
          </div>

          {totalDays > 0 && (
            <Alert>
              <Info size={20} />
              <AlertDescription>
                <strong>Toplam: {totalDays} iş günü</strong> izin talep ediliyor
                {annualLeaveEntitlement && selectedLeaveType === 'annual' && (
                  <span className="block mt-1 text-sm">
                    Kalan yıllık izin hakkınız: {annualLeaveEntitlement.remainingDays} gün
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {annualLeaveEntitlement && selectedLeaveType === 'annual' && totalDays > annualLeaveEntitlement.remainingDays && (
            <Alert variant="destructive">
              <Info size={20} />
              <AlertDescription>
                Talep edilen gün sayısı, kalan izin hakkınızdan fazla!
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Sebep *</Label>
            <Textarea
              {...register('reason', { required: true })}
              placeholder="İzin talebinizin sebebini açıklayınız..."
              rows={4}
            />
          </div>

          {selectedLeaveTypeConfig?.requiresDocument && (
            <Alert>
              <FileArrowUp size={20} />
              <AlertDescription>
                <strong>{selectedLeaveTypeConfig.label}</strong> için belge yüklenmesi gereklidir.
                <div className="mt-2">
                  <Button type="button" variant="outline" size="sm">
                    <FileArrowUp size={16} />
                    Belge Yükle
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={createLeaveMutation.isPending || totalDays <= 0}
            >
              Onayla
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                reset()
                setTotalDays(0)
                onOpenChange(false)
              }}
            >
              İptal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
