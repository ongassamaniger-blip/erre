import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'
import { leaveService } from '@/services/leaveService'
import { useAuthStore } from '@/store/authStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Check, X, FileText } from '@phosphor-icons/react'
import type { LeaveRequest } from '@/types/hr'

interface LeaveDetailModalProps {
  leave: LeaveRequest
  open: boolean
  onOpenChange: (open: boolean) => void
}

const leaveTypeLabels: Record<string, string> = {
  annual: 'Yıllık İzin',
  sick: 'Hastalık İzni',
  unpaid: 'Ücretsiz İzin',
  maternity: 'Doğum İzni',
  paternity: 'Babalık İzni',
  other: 'Diğer',
}

export function LeaveDetailModal({ leave, open, onOpenChange }: LeaveDetailModalProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionInput, setShowRejectionInput] = useState(false)
  const user = useAuthStore(state => state.user)
  const queryClient = useQueryClient()

  const approveMutation = useMutation({
    mutationFn: () => leaveService.approveLeave(leave.id, user?.id || '', user?.name || ''),
    onSuccess: () => {
      toast.success('İzin talebi onaylandı')
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      queryClient.invalidateQueries({ queryKey: ['employee-leaves'] })
      onOpenChange(false)
    },
    onError: () => {
      toast.error('İzin talebi onaylanırken bir hata oluştu')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => 
      leaveService.rejectLeave(leave.id, user?.id || '', user?.name || '', reason),
    onSuccess: () => {
      toast.success('İzin talebi reddedildi')
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      queryClient.invalidateQueries({ queryKey: ['employee-leaves'] })
      onOpenChange(false)
      setShowRejectionInput(false)
      setRejectionReason('')
    },
    onError: () => {
      toast.error('İzin talebi reddedilirken bir hata oluştu')
    },
  })

  const handleApprove = () => {
    approveMutation.mutate()
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Lütfen red nedeni giriniz')
      return
    }
    rejectMutation.mutate(rejectionReason)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const canApprove = user && leave.status === 'pending' && (user.role === 'Super Admin' || user.role === 'Admin' || user.role === 'Manager')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>İzin Talebi Detayı</DialogTitle>
          <DialogDescription>
            {leave.employeeName} tarafından oluşturuldu
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {getInitials(leave.employeeName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{leave.employeeName}</h3>
              <p className="text-sm text-muted-foreground">
                {leaveTypeLabels[leave.leaveType] || leave.leaveType}
              </p>
            </div>
            <Badge variant={
              leave.status === 'approved' ? 'default' :
              leave.status === 'rejected' ? 'destructive' : 'secondary'
            }>
              {leave.status === 'approved' ? 'Onaylandı' :
               leave.status === 'rejected' ? 'Reddedildi' : 'Beklemede'}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Başlangıç Tarihi</p>
              <p className="font-medium">
                {format(new Date(leave.startDate), 'dd MMMM yyyy', { locale: tr })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Bitiş Tarihi</p>
              <p className="font-medium">
                {format(new Date(leave.endDate), 'dd MMMM yyyy', { locale: tr })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Toplam Gün</p>
              <p className="font-medium">{leave.totalDays} gün</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">İzin Tipi</p>
              <p className="font-medium">{leaveTypeLabels[leave.leaveType] || leave.leaveType}</p>
            </div>
          </div>

          {leave.reason && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Sebep</p>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">{leave.reason}</p>
              </div>
            </div>
          )}

          {leave.documentUrl && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Belge</p>
              <Button variant="outline" size="sm">
                <FileText size={16} />
                Belgeyi Görüntüle
              </Button>
            </div>
          )}

          <Separator />

          <div>
            <p className="text-sm font-medium mb-3">Onay Durumu</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="text-sm font-medium">Talep Oluşturuldu</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(leave.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
                  </p>
                </div>
              </div>

              {leave.status !== 'pending' && (
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    leave.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">
                      {leave.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {leave.approverName} tarafından
                    </p>
                    {leave.approvalDate && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(leave.approvalDate), 'dd MMMM yyyy HH:mm', { locale: tr })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {leave.rejectionReason && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm font-medium text-destructive mb-1">Red Nedeni</p>
                  <p className="text-sm text-muted-foreground">{leave.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>

          {canApprove && !showRejectionInput && (
            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={approveMutation.isPending}
              >
                <Check size={20} />
                Onayla
              </Button>
              <Button 
                variant="destructive"
                className="flex-1"
                onClick={() => setShowRejectionInput(true)}
              >
                <X size={20} />
                Reddet
              </Button>
            </div>
          )}

          {showRejectionInput && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Red Nedeni</label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reddetme nedeninizi giriniz..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                >
                  <X size={20} />
                  Talebi Reddet
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowRejectionInput(false)
                    setRejectionReason('')
                  }}
                >
                  İptal
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
