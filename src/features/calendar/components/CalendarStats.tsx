import { Card, CardContent } from '@/components/ui/card'
import { CalendarBlank, Clock, CheckCircle, XCircle } from '@phosphor-icons/react'
import type { CalendarStats as CalendarStatsType } from '@/types/calendar'

interface CalendarStatsProps {
  stats: CalendarStatsType
}

export function CalendarStats({ stats }: CalendarStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Toplam Etkinlik</p>
              <p className="text-2xl font-bold">{stats.totalEvents}</p>
            </div>
            <CalendarBlank size={32} weight="duotone" className="text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Bugün</p>
              <p className="text-2xl font-bold">{stats.todayEvents}</p>
            </div>
            <Clock size={32} weight="duotone" className="text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Yaklaşan</p>
              <p className="text-2xl font-bold">{stats.upcomingEvents}</p>
            </div>
            <CheckCircle size={32} weight="duotone" className="text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Gecikmiş</p>
              <p className="text-2xl font-bold">{stats.overdueEvents}</p>
            </div>
            <XCircle size={32} weight="duotone" className="text-red-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

