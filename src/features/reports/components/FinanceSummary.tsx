import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DashboardSummary } from '@/types'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts'
import { formatCurrency } from '@/utils/format'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendUp, TrendDown } from '@phosphor-icons/react'
import { useTranslation } from '@/hooks/useTranslation'

interface FinanceSummaryProps {
    summary: DashboardSummary['finance']
}

export function FinanceSummary({ summary }: FinanceSummaryProps) {
    const { t } = useTranslation()

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t('Toplam Gelir')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t('Toplam Gider')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpense)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t('Net Durum')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${summary.netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {formatCurrency(summary.netIncome)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trend Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Aylık Gelir/Gider Trendi')}</CardTitle>
                        <CardDescription>{t('Son 6 aylık finansal performans')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={summary.monthlyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="income" name={t('Gelir')} fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expense" name={t('Gider')} fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Distribution Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Gider Dağılımı')}</CardTitle>
                        <CardDescription>{t('Kategorilere göre harcamalar')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={summary.categoryExpenses}
                                        dataKey="amount"
                                        nameKey="category"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                    >
                                        {summary.categoryExpenses?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Category Breakdown List */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('Kategori Bazlı Detaylar')}</CardTitle>
                    <CardDescription>{t('Gelir ve gider kalemlerinin detaylı analizi ve geçen döneme göre değişimi')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="expenses" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="expenses">{t('Giderler')}</TabsTrigger>
                            <TabsTrigger value="incomes">{t('Gelirler')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="expenses">
                            <div className="space-y-4">
                                {summary.categoryExpenses?.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <div>
                                                <p className="font-medium">{item.category}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {t('Toplamın')} %{item.percentage.toFixed(1)}'i
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{formatCurrency(item.amount)}</p>
                                            <div className={`flex items-center justify-end gap-1 text-sm ${item.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {item.change > 0 ? <TrendUp className="w-4 h-4" /> : <TrendDown className="w-4 h-4" />}
                                                <span>%{Math.abs(item.change).toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!summary.categoryExpenses || summary.categoryExpenses.length === 0) && (
                                    <div className="text-center py-8 text-muted-foreground">{t('Veri bulunamadı.')}</div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="incomes">
                            <div className="space-y-4">
                                {summary.categoryIncomes?.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }} />
                                            <div>
                                                <p className="font-medium">{item.category}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {t('Toplamın')} %{item.percentage.toFixed(1)}'i
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{formatCurrency(item.amount)}</p>
                                            <div className={`flex items-center justify-end gap-1 text-sm ${item.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {item.change > 0 ? <TrendUp className="w-4 h-4" /> : <TrendDown className="w-4 h-4" />}
                                                <span>%{Math.abs(item.change).toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!summary.categoryIncomes || summary.categoryIncomes.length === 0) && (
                                    <div className="text-center py-8 text-muted-foreground">{t('Veri bulunamadı.')}</div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C', '#2EC4B6', '#E71D36', '#011627'];
