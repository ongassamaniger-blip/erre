import { BudgetTransfer } from '@/types/finance'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CheckCircle,
  XCircle,
  Clock,
  DotsThreeVertical,
  ArrowRight,
  PencilSimple,
} from '@phosphor-icons/react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'


interface BudgetTransferTableProps {
  transfers: BudgetTransfer[]
  isLoading: boolean
  isHeadquarters: boolean
  onApprove: (id: string) => void
  onReject: (id: string, reason?: string) => void
  approveLoading?: boolean
  rejectLoading?: boolean
  onEdit?: (transfer: BudgetTransfer) => void
}

export function BudgetTransferTable({
  transfers,
  isLoading,
  isHeadquarters,
  onApprove,
  onReject,
  onEdit,
  approveLoading,
  rejectLoading,
}: BudgetTransferTableProps) {
  const getStatusBadge = (status: BudgetTransfer['status']) => {
    const variants: Record<BudgetTransfer['status'], { variant: any; icon: any; label: string }> = {
      pending: {
        variant: 'secondary',
        icon: Clock,
        label: 'Bekliyor',
      },
      approved: {
        variant: 'default',
        icon: CheckCircle,
        label: 'Onaylandı',
      },
      rejected: {
        variant: 'destructive',
        icon: XCircle,
        label: 'Reddedildi',
      },
      completed: {
        variant: 'default',
        icon: CheckCircle,
        label: 'Tamamlandı',
      },
    }

    const config = variants[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon size={12} />
        {config.label}
      </Badge>
    )
  }

  const getFacilityName = (facilityId: string) => {
    // In a real app, we would fetch this or have it in a context
    // For now, we will display the ID if name is not available, or assume it's fetched elsewhere
    return facilityId
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (transfers.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground">Bütçe aktarımı bulunamadı</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kod</TableHead>
          <TableHead>{isHeadquarters ? 'Hedef Şube' : 'Gönderen'}</TableHead>
          <TableHead>Tutar</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Açıklama</TableHead>
          <TableHead>Oluşturulma</TableHead>
          <TableHead className="text-right">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transfers.map(transfer => (
          <TableRow key={transfer.id}>
            <TableCell className="font-medium">{transfer.code}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {isHeadquarters ? (
                  <>
                    <span>{getFacilityName(transfer.toFacilityId)}</span>
                    <ArrowRight size={16} className="text-muted-foreground" />
                  </>
                ) : (
                  <>
                    <span>{getFacilityName(transfer.fromFacilityId)}</span>
                    <ArrowRight size={16} className="text-muted-foreground" />
                  </>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-0.5">
                {/* Ana tutar: Her zaman TRY olarak göster */}
                <span className="font-semibold text-foreground">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                    minimumFractionDigits: 0,
                  }).format(transfer.amountInTry || transfer.amount)}
                </span>
                {/* Orijinal para birimi TRY değilse alt satırda göster */}
                {transfer.currency !== 'TRY' && (
                  <div className="text-xs text-muted-foreground">
                    ({new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: transfer.currency,
                      minimumFractionDigits: 0,
                    }).format(transfer.amount)} @ {transfer.exchangeRate?.toFixed(2) || '1'})
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>{getStatusBadge(transfer.status)}</TableCell>
            <TableCell className="max-w-xs truncate">
              {transfer.description || '-'}
            </TableCell>
            <TableCell>
              {format(new Date(transfer.createdAt), 'dd MMM yyyy', { locale: tr })}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <DotsThreeVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {transfer.status === 'pending' && isHeadquarters && (
                    <>
                      <DropdownMenuItem
                        onClick={() => onEdit?.(transfer)}
                      >
                        <PencilSimple size={16} className="mr-2" />
                        Düzenle
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => onReject(transfer.id)}
                        disabled={rejectLoading}
                      >
                        <XCircle size={16} className="mr-2" />
                        Reddet
                      </DropdownMenuItem>
                    </>
                  )}

                  {transfer.status === 'completed' && (
                    <DropdownMenuItem disabled>
                      <CheckCircle size={16} className="mr-2" />
                      Tamamlandı
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

