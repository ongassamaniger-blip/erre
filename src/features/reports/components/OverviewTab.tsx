import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DashboardSummary } from '@/types'
import { formatCurrency } from '@/utils/format'
import { useNavigate } from 'react-router-dom'
import {
    TrendUp,
    TrendDown,
    Users,
    Briefcase,
    Heart,
    Wallet,
    Warning
} from '@phosphor-icons/react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend
} from 'recharts'

interface OverviewTabProps {
    summary: DashboardSummary
}

export function OverviewTab({ summary }: OverviewTabProps) {
    const navigate = useNavigate()

    // Calculate key metrics
    const burnRate = summary.finance.totalExpense // Monthly burn rate (simplified)
    const cashFlow = summary.finance.netIncome
    const payrollRatio = summary.finance.totalExpense > 0
        ? (summary.hr.totalSalaries / summary.finance.totalExpense) * 100
        : 0

    const projectEfficiency = summary.projects.totalSpent > 0
        ? (summary.projects.totalSpent / summary.projects.totalBudget) * 100
        : 0

    // Chart Data Preparation
    const expenseDistribution = [
        { name: 'Personel', value: summary.hr.totalSalaries, color: '#FF6B6B' }, // Red
        { name: 'Projeler', value: summary.projects.totalSpent, color: '#4ECDC4' }, // Teal
        { name: 'Diğer', value: Math.max(0, summary.finance.totalExpense - summary.hr.totalSalaries - summary.projects.totalSpent), color: '#FFE66D' } // Yellow
    ]

    const projectBudgetVsActual = [
        {
            name: 'Projeler',
            Bütçe: summary.projects.totalBudget,
            Harcanan: summary.projects.totalSpent
        }
    ]

    // Mock Trend Data (since we don't have full history in summary yet)
    const trendData = summary.finance.monthlyTrend.map(t => ({
        name: t.name,
        Gelir: t.income,
        Gider: t.expense
    }))

    const handlePieClick = (data: any) => {
        if (data && data.name === 'Personel') {
            navigate('/finance?tab=transactions&search=Personel')
        } else if (data && data.name === 'Projeler') {
            navigate('/projects')
        } else {
            navigate('/finance?tab=transactions')
        }
    }

    return (
        <div className="space-y-6">
            {/* 1. KPI Cards (The Pulse) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nakit Akışı (Net)</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(cashFlow)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {cashFlow >= 0 ? 'Pozitif nakit akışı' : 'Negatif nakit akışı'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aktif Projeler</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.projects.activeProjects}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Toplam {summary.projects.totalProjects} proje arasından
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aktif Personel</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.hr.activeEmployees}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {summary.hr.leaveCount} kişi izinde
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Kurban Hisseleri</CardTitle>
                        <Heart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.qurban.totalShares}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Toplam bağış hissesi
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 2. Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income vs Expense Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>Gelir / Gider Trendi</CardTitle>
                        <CardDescription>Son 6 aylık finansal performans</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} onClick={() => navigate('/finance')}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                    <Legend />
                                    <Line type="monotone" dataKey="Gelir" stroke="#10B981" strokeWidth={2} activeDot={{ r: 8 }} />
                                    <Line type="monotone" dataKey="Gider" stroke="#EF4444" strokeWidth={2} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Expense Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Gider Dağılımı</CardTitle>
                        <CardDescription>Toplam giderlerin kategorilere göre dağılımı</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={expenseDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        onClick={handlePieClick}
                                        cursor="pointer"
                                    >
                                        {expenseDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-center mt-4 text-sm text-muted-foreground">
                            Maaş/Gider Oranı: <strong>%{payrollRatio.toFixed(1)}</strong>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 3. Alerts & Insights Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Warning className="h-5 w-5 text-yellow-500" />
                            Kritik Uyarılar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {cashFlow < 0 && (
                                <div className="flex items-start gap-3 p-3 bg-red-50 text-red-700 rounded-lg">
                                    <TrendDown className="h-5 w-5 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Negatif Nakit Akışı</p>
                                        <p className="text-sm">Giderler gelirlerden fazla. Harcamaları gözden geçirin.</p>
                                    </div>
                                </div>
                            )}
                            {summary.hr.leaveCount > 5 && (
                                <div className="flex items-start gap-3 p-3 bg-yellow-50 text-yellow-700 rounded-lg">
                                    <Users className="h-5 w-5 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Yüksek İzin Oranı</p>
                                        <p className="text-sm">{summary.hr.leaveCount} personel şu an izinde. Operasyonel aksama riski.</p>
                                    </div>
                                </div>
                            )}
                            {projectEfficiency > 100 && (
                                <div className="flex items-start gap-3 p-3 bg-orange-50 text-orange-700 rounded-lg">
                                    <Briefcase className="h-5 w-5 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Bütçe Aşımı</p>
                                        <p className="text-sm">Projeler toplam bütçeyi aşmış durumda.</p>
                                    </div>
                                </div>
                            )}
                            {/* Default empty state if no alerts */}
                            {cashFlow >= 0 && summary.hr.leaveCount <= 5 && projectEfficiency <= 100 && (
                                <div className="text-center text-muted-foreground py-4">
                                    Şu an kritik bir uyarı bulunmuyor. İşler yolunda! 🎉
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Proje Bütçe Durumu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={projectBudgetVsActual} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} />
                                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                    <Legend />
                                    <Bar dataKey="Bütçe" fill="#4ECDC4" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="Harcanan" fill="#FF6B6B" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
