import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, User, ArrowRight } from '@phosphor-icons/react'
import type { ApprovalRequest } from '@/types'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface ApprovalWorkflowVisualizationProps {
  approval: ApprovalRequest
}

export function ApprovalWorkflowVisualization({ approval }: ApprovalWorkflowVisualizationProps) {
  const getStatusIcon = (action: string) => {
    switch (action) {
      case 'submitted':
        return <Clock size={20} className="text-blue-600" />
      case 'approved':
        return <CheckCircle size={20} className="text-green-600" />
      case 'rejected':
        return <XCircle size={20} className="text-red-600" />
      default:
        return <Clock size={20} className="text-gray-600" />
    }
  }

  const getStatusColor = (action: string) => {
    switch (action) {
      case 'submitted':
        return 'bg-blue-500/10 border-blue-200'
      case 'approved':
        return 'bg-green-500/10 border-green-200'
      case 'rejected':
        return 'bg-red-500/10 border-red-200'
      default:
        return 'bg-gray-500/10 border-gray-200'
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'submitted':
        return 'Talep Oluşturuldu'
      case 'approved':
        return 'Onaylandı'
      case 'rejected':
        return 'Reddedildi'
      case 'commented':
        return 'Yorum Eklendi'
      case 'reassigned':
        return 'Yeniden Atandı'
      default:
        return action
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Onay Akışı</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Mevcut Durum */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              {approval.status === 'pending' && <Clock size={20} className="text-primary" />}
              {approval.status === 'approved' && <CheckCircle size={20} className="text-green-600" />}
              {approval.status === 'rejected' && <XCircle size={20} className="text-red-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm">
                  {approval.status === 'pending' && 'Beklemede'}
                  {approval.status === 'approved' && 'Onaylandı'}
                  {approval.status === 'rejected' && 'Reddedildi'}
                  {approval.status === 'cancelled' && 'İptal Edildi'}
                </p>
                {approval.currentApprover && (
                  <Badge variant="outline" className="text-xs">
                    {approval.currentApprover.role}
                  </Badge>
                )}
              </div>
              {approval.currentApprover && (
                <p className="text-xs text-muted-foreground">
                  Onaylayıcı: {approval.currentApprover.name}
                </p>
              )}
            </div>
          </div>

          {/* İşlem Geçmişi */}
          <div className="space-y-3">
            {approval.history.map((item, index) => (
              <div key={item.id} className="flex gap-3">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${getStatusColor(item.action)}`}>
                    {getStatusIcon(item.action)}
                  </div>
                  {index < approval.history.length - 1 && (
                    <div className="w-0.5 h-8 bg-border mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="font-medium text-sm">{getActionLabel(item.action)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.actor.name}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(item.timestamp), 'dd MMM yyyy, HH:mm', { locale: tr })}
                    </p>
                  </div>
                  {item.comment && (
                    <div className="mt-2 p-2 rounded-md bg-muted text-sm italic">
                      "{item.comment}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Süre Bilgisi */}
          {approval.history.length > 1 && (
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Toplam Süre:</span>
                <span className="font-medium">
                  {Math.floor(
                    (new Date(approval.history[approval.history.length - 1].timestamp).getTime() -
                      new Date(approval.history[0].timestamp).getTime()) /
                      (1000 * 60 * 60)
                  )}{' '}
                  saat
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

