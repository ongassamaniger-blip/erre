import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DashboardSummary } from '@/types'
import { formatCurrency } from '@/utils/format'
import { HandHeart, Users, Calendar, Tag } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface DonationSummaryProps {
    summary: DashboardSummary['donations']
}

export function DonationSummary({ summary }: DonationSummaryProps) {
    const selectedFacility = useAuthStore(state => state.selectedFacility)

    const { data: recentDonations, isLoading } = useQuery({
        queryKey: ['recent-qurban-donations', selectedFacility?.id],
        queryFn: async () => {
            if (!selectedFacility?.id) return []

            const { data, error } = await supabase
                .from('qurban_donations')
                .select(`
                    id,
                    donor_name,
                    amount,
                    share_count,
                    payment_status,
                    created_at,
                    qurban_campaigns (
                        name
                    )
                `)
                .eq('facility_id', selectedFacility.id)
                .order('created_at', { ascending: false })
                .limit(10)

            if (error) throw error
            return data
        },
        enabled: !!selectedFacility?.id
    })

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Bağış</CardTitle>
                        <HandHeart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bağışçı Sayısı</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.donorCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Donations List */}
            <Card>
                <CardHeader>
                    <CardTitle>Son Kurban Bağışları</CardTitle>
                    <CardDescription>
                        Sisteme girilen son 10 kurban bağışı
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bağışçı</TableHead>
                                <TableHead>Kampanya</TableHead>
                                <TableHead>Hisse</TableHead>
                                <TableHead>Tutar</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead>Tarih</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-4">Yükleniyor...</TableCell>
                                </TableRow>
                            ) : recentDonations?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-4">Henüz bağış bulunmuyor.</TableCell>
                                </TableRow>
                            ) : (
                                recentDonations?.map((donation) => (
                                    <TableRow key={donation.id}>
                                        <TableCell className="font-medium">{donation.donor_name}</TableCell>
                                        <TableCell>{donation.qurban_campaigns?.name || '-'}</TableCell>
                                        <TableCell>{donation.share_count}</TableCell>
                                        <TableCell>{formatCurrency(donation.amount)}</TableCell>
                                        <TableCell>
                                            <Badge variant={donation.payment_status === 'paid' ? 'default' : 'secondary'}>
                                                {donation.payment_status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(donation.created_at), 'd MMM yyyy', { locale: tr })}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
