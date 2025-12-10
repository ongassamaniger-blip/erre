import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  TreeStructure, 
  Plus, 
  MagnifyingGlass, 
  CaretRight, 
  CaretDown,
  CurrencyCircleDollar,
  TrendUp,
  TrendDown,
  Wallet,
  Receipt,
  PencilSimple,
  Trash,
  DotsThree
} from '@phosphor-icons/react'
import { chartOfAccountsService, type ChartAccount } from '@/services/finance/chartOfAccountsService'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { AccountDialog } from './components/AccountDialog'

function AccountRow({ 
  account, 
  level = 0, 
  expanded, 
  onToggle,
  onEdit,
  onDelete,
  onAddChild
}: { 
  account: ChartAccount
  level?: number
  expanded: Set<string>
  onToggle: (id: string) => void
  onEdit?: (account: ChartAccount) => void
  onDelete?: (account: ChartAccount) => void
  onAddChild?: (account: ChartAccount) => void
}) {
  const hasChildren = account.children && account.children.length > 0
  const isExpanded = expanded.has(account.id)

  const typeColors: Record<ChartAccount['type'], string> = {
    asset: 'text-blue-600',
    liability: 'text-red-600',
    equity: 'text-green-600',
    income: 'text-emerald-600',
    expense: 'text-orange-600',
  }

  const typeIcons: Record<ChartAccount['type'], any> = {
    asset: Wallet,
    liability: TrendDown,
    equity: CurrencyCircleDollar,
    income: TrendUp,
    expense: Receipt,
  }

  const Icon = typeIcons[account.type] || Wallet

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: account.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <>
      <tr className="hover:bg-accent/50 transition-colors">
        <td className="p-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 1.5}rem` }}>
            {hasChildren ? (
              <button
                onClick={() => onToggle(account.id)}
                className="hover:bg-accent rounded p-1"
              >
                {isExpanded ? <CaretDown size={16} /> : <CaretRight size={16} />}
              </button>
            ) : (
              <div className="w-6" />
            )}
            <Icon size={18} className={cn("flex-shrink-0", typeColors[account.type])} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">{account.code}</span>
                <span className={level === 0 ? 'font-semibold' : level === 1 ? 'font-medium' : ''}>
                  {account.name}
                </span>
                {!account.isActive && (
                  <Badge variant="secondary" className="text-xs">Pasif</Badge>
                )}
              </div>
            </div>
          </div>
        </td>
        <td className="p-3">
          <Badge variant="outline" className={typeColors[account.type]}>
            {account.type === 'asset' && 'Aktif'}
            {account.type === 'liability' && 'Pasif'}
            {account.type === 'equity' && 'Özkaynak'}
            {account.type === 'income' && 'Gelir'}
            {account.type === 'expense' && 'Gider'}
          </Badge>
        </td>
        <td className="p-3 text-right">
          <span className={cn(
            "font-medium",
            account.balance >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {formatBalance(account.balance)}
          </span>
        </td>
        <td className="p-3">
          <span className="text-sm text-muted-foreground">{account.currency}</span>
        </td>
        <td className="p-3">
          <div className="flex items-center justify-end gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <DotsThree size={16} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onAddChild && (
                  <DropdownMenuItem onClick={() => onAddChild(account)}>
                    <Plus size={16} className="mr-2" />
                    Alt Hesap Ekle
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(account)}>
                    <PencilSimple size={16} className="mr-2" />
                    Düzenle
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(account)}
                      className="text-destructive"
                    >
                      <Trash size={16} className="mr-2" />
                      Sil
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </td>
      </tr>
      {hasChildren && isExpanded && account.children!.map(child => (
        <AccountRow
          key={child.id}
          account={child}
          level={level + 1}
          expanded={expanded}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
        />
      ))}
    </>
  )
}

export function ChartOfAccountsPage() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<ChartAccount | null>(null)
  const [parentAccount, setParentAccount] = useState<ChartAccount | null>(null)
  const queryClient = useQueryClient()

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: () => chartOfAccountsService.getAccounts(),
  })

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpanded(newExpanded)
  }

  const filterAccounts = (acc: ChartAccount): boolean => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        acc.code.toLowerCase().includes(query) ||
        acc.name.toLowerCase().includes(query) ||
        acc.description?.toLowerCase().includes(query)
      
      if (!matchesSearch) {
        // Check children
        if (acc.children && acc.children.some(child => filterAccounts(child))) {
          return true
        }
        return false
      }
    }

    // Type filter
    if (typeFilter !== 'all' && acc.type !== typeFilter) {
      // Check if any child matches
      if (acc.children && acc.children.some(child => filterAccounts(child))) {
        return true
      }
      return false
    }

    // Status filter
    if (statusFilter === 'active' && !acc.isActive) {
      if (acc.children && acc.children.some(child => filterAccounts(child))) {
        return true
      }
      return false
    }
    if (statusFilter === 'inactive' && acc.isActive) {
      if (acc.children && acc.children.some(child => filterAccounts(child))) {
        return true
      }
      return false
    }

    return true
  }

  const filteredAccounts = accounts?.filter(filterAccounts) || []

  const handleEdit = (account: ChartAccount) => {
    setEditingAccount(account)
    setParentAccount(null)
    setDialogOpen(true)
  }

  const handleDelete = async (account: ChartAccount) => {
    if (account.children && account.children.length > 0) {
      toast.error('Alt hesapları olan bir hesabı silemezsiniz. Önce alt hesapları silin.')
      return
    }

    if (window.confirm(`"${account.name}" hesabını silmek istediğinizden emin misiniz?`)) {
      try {
        await chartOfAccountsService.deleteAccount(account.id)
        toast.success('Hesap silindi')
        queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] })
      } catch (error) {
        toast.error('Hesap silinirken hata oluştu')
      }
    }
  }

  const handleAddChild = (account: ChartAccount) => {
    setParentAccount(account)
    setEditingAccount(null)
    setDialogOpen(true)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Hesap Planı</h1>
            <p className="text-muted-foreground mt-1">
              Muhasebe hesap planı hiyerarşisi ve bakiyeler
            </p>
          </div>
          <Button 
            onClick={() => {
              setEditingAccount(null)
              setParentAccount(null)
              setDialogOpen(true)
            }}
          >
            <Plus size={20} className="mr-2" />
            Yeni Hesap
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlass 
                  size={20} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                />
                <Input
                  placeholder="Hesap kodu veya adı ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <TreeStructure size={20} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {accounts?.reduce((acc, curr) => {
                    const count = (acc: ChartAccount): number => {
                      return 1 + (acc.children?.reduce((sum, child) => sum + count(child), 0) || 0)
                    }
                    return acc + count(curr)
                  }, 0) || 0} hesap
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hesap Tipi</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="asset">Aktif</SelectItem>
                    <SelectItem value="liability">Pasif</SelectItem>
                    <SelectItem value="equity">Özkaynak</SelectItem>
                    <SelectItem value="income">Gelir</SelectItem>
                    <SelectItem value="expense">Gider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Durum</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left font-semibold">Hesap</th>
                    <th className="p-3 text-left font-semibold">Tip</th>
                    <th className="p-3 text-right font-semibold">Bakiye</th>
                    <th className="p-3 text-left font-semibold">Para Birimi</th>
                    <th className="p-3 text-right font-semibold">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        {searchQuery || typeFilter !== 'all' || statusFilter !== 'all' 
                          ? 'Arama sonucu bulunamadı' 
                          : 'Hesap bulunamadı'}
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map(account => (
                      <AccountRow
                        key={account.id}
                        account={account}
                        expanded={expanded}
                        onToggle={toggleExpanded}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAddChild={handleAddChild}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AccountDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingAccount(null)
            setParentAccount(null)
          }
        }}
        account={editingAccount || undefined}
        parentAccount={parentAccount || undefined}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] })
          setEditingAccount(null)
          setParentAccount(null)
        }}
      />
    </div>
  )
}
