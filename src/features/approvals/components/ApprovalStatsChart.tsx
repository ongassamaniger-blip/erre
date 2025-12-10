import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ApprovalRequest } from '@/types'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface ApprovalStatsChartProps {
  approvals: ApprovalRequest[]
}

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6']

export function ApprovalStatsChart({ approvals }: ApprovalStatsChartProps) {
  // Modül bazlı dağılım
  const moduleData = approvals.reduce((acc, approval) => {
    const module = approval.module
    if (!acc[module]) {
      acc[module] = { name: module, pending: 0, approved: 0, rejected: 0 }
    }
    if (approval.status === 'pending') acc[module].pending++
    if (approval.status === 'approved') acc[module].approved++
    if (approval.status === 'rejected') acc[module].rejected++
    return acc
  }, {} as Record<string, { name: string; pending: number; approved: number; rejected: number }>)

  const moduleChartData = Object.values(moduleData).map(item => ({
    name: item.name === 'finance' ? 'Finans' : item.name === 'hr' ? 'İK' : item.name === 'projects' ? 'Proje' : 'Kurban',
    Beklemede: item.pending,
    Onaylandı: item.approved,
    Reddedildi: item.rejected,
  }))

  // Öncelik bazlı dağılım
  const priorityData = approvals.reduce((acc, approval) => {
    const priority = approval.priority
    if (!acc[priority]) {
      acc[priority] = 0
    }
    acc[priority]++
    return acc
  }, {} as Record<string, number>)

  const priorityPieData = Object.entries(priorityData).map(([key, value]) => ({
    name: key === 'urgent' ? 'Acil' : key === 'high' ? 'Yüksek' : key === 'medium' ? 'Orta' : 'Düşük',
    value,
  }))

  // Aylık trend (son 6 ay)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - i))
    const monthKey = format(date, 'yyyy-MM', { locale: tr })
    const monthLabel = format(date, 'MMM yyyy', { locale: tr })
    
    const monthApprovals = approvals.filter(a => {
      const approvalDate = new Date(a.requestedAt)
      return format(approvalDate, 'yyyy-MM', { locale: tr }) === monthKey
    })

    return {
      month: monthLabel,
      Onaylandı: monthApprovals.filter(a => a.status === 'approved').length,
      Reddedildi: monthApprovals.filter(a => a.status === 'rejected').length,
      Beklemede: monthApprovals.filter(a => a.status === 'pending').length,
    }
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Modül Bazlı Dağılım */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Modül Bazlı Dağılım</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={moduleChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Beklemede" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Onaylandı" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Reddedildi" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Öncelik Dağılımı */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Öncelik Dağılımı</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityPieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {priorityPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Aylık Trend */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Aylık Onay Trendi</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Onaylandı" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Reddedildi" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Beklemede" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}


