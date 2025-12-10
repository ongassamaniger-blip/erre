import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardSummary } from '@/types'
import {
    TrendUp,
    TrendDown,
    CurrencyDollar,
    Users,
    FolderOpen,
    HandHeart,
    Gift
} from '@phosphor-icons/react'
import { formatCurrency } from '@/utils/format'
import { useTranslation } from '@/hooks/useTranslation'

interface DashboardOverviewProps {
    summary: DashboardSummary
}

export function DashboardOverview({ summary }: DashboardOverviewProps) {
    const { t } = useTranslation()

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Finance Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('Toplam Net Gelir (Bu Ay)')}</CardTitle>
                    <CurrencyDollar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(summary.finance.netIncome)}</div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                        {summary.finance.incomeChange > 0 ? (
                            <span className="text-green-600 flex items-center mr-1">
                                <TrendUp className="mr-1" /> %{summary.finance.incomeChange.toFixed(1)}
                            </span>
                        ) : (
                            <span className="text-red-600 flex items-center mr-1">
                                <TrendDown className="mr-1" /> %{Math.abs(summary.finance.incomeChange).toFixed(1)}
                            </span>
                        )}
                        {t('geçen aya göre')}
                    </div>
                </CardContent>
            </Card>

            {/* HR Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('Aktif Personel')}</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summary.hr.activeEmployees}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {t('Toplam')} {summary.hr.totalEmployees} {t('kayıtlı personel')}
                    </p>
                </CardContent>
            </Card>

            {/* Projects Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('Aktif Projeler')}</CardTitle>
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summary.projects.activeProjects}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {summary.projects.completedProjects} {t('tamamlanan proje')}
                    </p>
                </CardContent>
            </Card>

            {/* Qurban Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('Kurban Hisseleri')}</CardTitle>
                    <Gift className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summary.qurban.totalShares}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {summary.qurban.slaughteredCount} {t('kesilen hisse')}
                    </p>
                </CardContent>
            </Card>

            {/* Donations Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('Toplam Bağış')}</CardTitle>
                    <HandHeart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(summary.donations.totalAmount)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {summary.donations.donorCount} {t('bağışçıdan')}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
