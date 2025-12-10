import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DashboardSummary } from '@/types'
import { formatCurrency } from '@/utils/format'
import { Users, UserPlus, UserMinus, Money } from '@phosphor-icons/react'

interface HRSummaryProps {
    summary: DashboardSummary['hr']
}

import { useState } from 'react'

export function HRSummary({ summary }: HRSummaryProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 10

    const employees = summary.employeeDetails || []
    const totalPages = Math.ceil(employees.length / pageSize)
    const paginatedEmployees = employees.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Personel</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summary.totalEmployees}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Aktif Personel</CardTitle>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summary.activeEmployees}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">İzindeki Personel</CardTitle>
                    <UserMinus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summary.leaveCount}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Maaş Yükü</CardTitle>
                    <Money className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(summary.totalSalaries)}</div>
                </CardContent>
            </Card>
            <Card className="col-span-full mt-6">
                <CardHeader>
                    <CardTitle>Personel Listesi ve Devamsızlık Durumu</CardTitle>
                    <CardDescription>Tüm personelin detaylı bilgileri ve izin kullanım durumları</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Ad Soyad</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Departman</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Pozisyon</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Durum</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Giriş Tarihi</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Kullanılan İzin (Gün)</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {paginatedEmployees.map((employee) => (
                                    <tr key={employee.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle font-medium">{employee.name}</td>
                                        <td className="p-4 align-middle">{employee.department}</td>
                                        <td className="p-4 align-middle">{employee.position}</td>
                                        <td className="p-4 align-middle">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${employee.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : employee.status === 'on-leave'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {employee.status === 'active' ? 'Aktif' : employee.status === 'on-leave' ? 'İzinde' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle">
                                            {new Date(employee.joinDate).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="p-4 align-middle text-right font-bold text-red-600">
                                            {employee.leaveDays}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <button
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Önceki
                            </button>
                            <div className="text-sm font-medium">
                                Sayfa {currentPage} / {totalPages}
                            </div>
                            <button
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Sonraki
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
