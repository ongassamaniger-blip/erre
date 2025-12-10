import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    TrendUp,
    TrendDown,
    CurrencyDollar,
    Receipt,
    CheckCircle,
    Users,
} from '@phosphor-icons/react'
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts'
import type { Transaction } from '@/types/finance'
import type { WidgetId } from '@/store/dashboardStore'
import { useCurrency } from '@/hooks/useCurrency'
import { useTranslation } from '@/hooks/useTranslation'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface WidgetProps {
    id: WidgetId
    data: any
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed':
        case 'approved':
            return 'bg-emerald-500/10 text-emerald-600'
        case 'pending':
            return 'bg-amber-500/10 text-amber-600'
        case 'cancelled':
        case 'rejected':
            return 'bg-red-500/10 text-red-600'
        default:
            return 'bg-slate-500/10 text-slate-600'
    }
}

const getPaymentStatusBadge = (date: string | null | undefined) => {
    if (!date) return null
    const today = new Date()
    const paymentDate = new Date(date)
    if (isNaN(paymentDate.getTime())) return null
    const diffTime = paymentDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
        return <span className="text-[10px] font-medium text-red-500">Gecikmiş</span>
    } else if (diffDays <= 3) {
        return <span className="text-[10px] font-medium text-blue-500">Yakında</span>
    }
    return null
}

export function DashboardWidget({ id, data }: WidgetProps) {
    const { format: formatCurrency, symbol } = useCurrency()
    const { t } = useTranslation()

    switch (id) {
        case 'stats-income':
            return (
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">{t('Toplam Gelir')}</p>
                                <p className="text-xl font-bold text-slate-900">{formatCurrency(data?.totalIncome || 0)}</p>
                                <div className={`flex items-center gap-1 text-[10px] mt-1 font-medium ${(data?.incomeTrend || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {(data?.incomeTrend || 0) >= 0 ? <TrendUp size={10} weight="bold" /> : <TrendDown size={10} weight="bold" />}
                                    {Math.abs(data?.incomeTrend || 0).toFixed(1)}%
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <CurrencyDollar size={20} weight="bold" className="text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )
        case 'stats-budget-hq':
            return (
                <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">{t('GM Bütçesi')}</p>
                                <p className="text-xl font-bold text-slate-900">{formatCurrency(data?.budgetFromHQ || 0)}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{t('Aktarılan')}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                <CurrencyDollar size={20} weight="bold" className="text-indigo-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )
        case 'stats-expense':
            return (
                <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">{t('Toplam Gider')}</p>
                                <p className="text-xl font-bold text-slate-900">{formatCurrency(data?.totalExpense || 0)}</p>
                                <div className={`flex items-center gap-1 text-[10px] mt-1 font-medium ${(data?.expenseTrend || 0) <= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {(data?.expenseTrend || 0) <= 0 ? <TrendDown size={10} weight="bold" /> : <TrendUp size={10} weight="bold" />}
                                    {Math.abs(data?.expenseTrend || 0).toFixed(1)}%
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <Receipt size={20} weight="bold" className="text-red-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )
        case 'stats-pending':
            return (
                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">{t('Bekleyen')}</p>
                                <p className="text-xl font-bold text-slate-900">{data?.pendingCount || 0}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{t('Onay bekliyor')}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <CheckCircle size={20} weight="bold" className="text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )
        case 'stats-active-employees':
            return (
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">{t('Çalışan')}</p>
                                <p className="text-xl font-bold text-slate-900">{data || 0}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{t('Aktif')}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Users size={20} weight="bold" className="text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )
        case 'chart-trend':
            // data.chartData for chart, data.totalIncome and data.totalExpense from stats
            const chartTrendData = data?.chartData || data || []
            const totalIncome = data?.totalIncome || 0
            const totalExpense = data?.totalExpense || 0
            return (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2 pt-4 px-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold text-slate-700">{t('Gelir/Gider Trendi')}</CardTitle>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400">{t('Toplam Gelir')}</p>
                                    <p className="text-xs font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400">{t('Toplam Gider')}</p>
                                    <p className="text-xs font-bold text-red-500">{formatCurrency(totalExpense)}</p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-2 pb-4">
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={chartTrendData} barGap={4} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    interval={1}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                                    width={35}
                                />
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        fontSize: '12px',
                                        padding: '8px 12px'
                                    }}
                                />
                                <Bar dataKey="revenue" fill="#10b981" name="Gelir" radius={[3, 3, 0, 0]} barSize={12} />
                                <Bar dataKey="expense" fill="#ef4444" name="Gider" radius={[3, 3, 0, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-[10px] text-slate-500">Gelir</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span className="text-[10px] text-slate-500">Gider</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )
        case 'chart-category':
            return (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-sm font-semibold text-slate-700">{t('Gider Dağılımı')}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        {data?.length === 0 ? (
                            <p className="text-center text-slate-400 py-8 text-sm">{t('Veri yok')}</p>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={140}>
                                    <PieChart>
                                        <Pie
                                            data={data}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={35}
                                            outerRadius={55}
                                            fill="#8884d8"
                                            dataKey="value"
                                            paddingAngle={2}
                                        >
                                            {data?.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                fontSize: '11px',
                                                padding: '6px 10px'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                                    {data?.slice(0, 4).map((entry: any, index: number) => (
                                        <div key={index} className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="text-[10px] text-slate-500 truncate max-w-[60px]">{entry.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )
        case 'list-transactions':
            return (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-sm font-semibold text-slate-700">{t('Son İşlemler')}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="space-y-2">
                            {data?.length === 0 ? (
                                <p className="text-center text-slate-400 py-4 text-xs">{t('İşlem yok')}</p>
                            ) : (
                                data?.slice(0, 4).map((tx: Transaction) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50/80 hover:bg-slate-100/80 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-slate-700 truncate">
                                                {tx.title || tx.description || 'İşlem'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-slate-400">{tx.categories?.name || '-'}</span>
                                                <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 h-4 ${getStatusColor(tx.status)}`}>
                                                    {tx.status === 'approved' ? '✓' : tx.status === 'pending' ? '•' : '✕'}
                                                </Badge>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-semibold ml-3 ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            )
        case 'list-payments':
            return (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-sm font-semibold text-slate-700">{t('Yaklaşan Ödemeler')}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="space-y-2">
                            {data?.length === 0 ? (
                                <p className="text-center text-slate-400 py-4 text-xs">{t('Ödeme yok')}</p>
                            ) : (
                                data?.slice(0, 4).map((payment: Transaction) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50/80"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-medium text-slate-700 truncate">
                                                    {payment.title || payment.description || 'Ödeme'}
                                                </p>
                                                {getPaymentStatusBadge(payment.date)}
                                            </div>
                                            <span className="text-[10px] text-slate-400">
                                                {payment.date ? new Date(payment.date).toLocaleDateString('tr-TR') : '-'}
                                            </span>
                                        </div>
                                        <span className="text-xs font-semibold text-red-500 ml-3">
                                            {formatCurrency(Number(payment.amount))}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            )
        default:
            return null
    }
}
