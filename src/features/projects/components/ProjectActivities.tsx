import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, CheckCircle, ChatCircle, Users, User, Trash, PencilSimple, Clock, CurrencyDollar } from '@phosphor-icons/react'
import { projectService } from '@/services/projects/projectService'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

interface ProjectActivitiesProps {
  projectId: string
  managerName?: string
}

const activityIcons = {
  task_created: FileText,
  task_completed: CheckCircle,
  task_deleted: Trash,
  status_changed: ChatCircle,
  member_added: Users,
  member_removed: Users,
  comment_added: ChatCircle,
  project_updated: PencilSimple,
  budget_updated: CurrencyDollar,
}

const activityColors = {
  task_created: 'text-blue-600',
  task_completed: 'text-green-600',
  task_deleted: 'text-red-600',
  status_changed: 'text-yellow-600',
  member_added: 'text-purple-600',
  member_removed: 'text-red-500',
  comment_added: 'text-gray-600',
  project_updated: 'text-orange-600',
  budget_updated: 'text-green-600',
}

export function ProjectActivities({ projectId, managerName }: ProjectActivitiesProps) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['project-activities', projectId],
    queryFn: () => projectService.getActivities(projectId),
  })

  // Realtime subscription
  useRealtimeSubscription({
    table: 'project_activities',
    queryKey: ['project-activities', projectId],
    filter: `project_id=eq.${projectId}`,
  })

  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ChatCircle size={20} className="text-primary" />
          Son Aktiviteler
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex flex-col gap-6 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-9 h-9 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <ScrollArea className="h-[450px]">
            <div className="p-6">
              <div className="space-y-0">
                {activities.map((activity, index) => {
                  const Icon = activityIcons[activity.type]
                  const colorClass = activityColors[activity.type]
                  const isLast = index === activities.length - 1

                  return (
                    <div key={activity.id} className="relative flex gap-4 group">
                      {/* Timeline Line */}
                      {!isLast && (
                        <div
                          className="absolute left-[17px] top-9 bottom-0 w-[2px] bg-border/60"
                          style={{ height: 'calc(100% + 0px)' }}
                        />
                      )}

                      <div className={`relative z-10 w-9 h-9 rounded-full border-4 border-background flex items-center justify-center flex-shrink-0 shadow-sm ${colorClass.replace('text-', 'bg-').replace('600', '100')} ${colorClass}`}>
                        <Icon size={16} weight="duotone" />
                      </div>

                      <div className="flex-1 min-w-0 pb-8 pt-1">
                        <div className="flex flex-col gap-1.5">
                          <p className="text-sm font-medium text-foreground leading-snug">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground/70 flex items-center gap-1">
                              <User size={12} />
                              {managerName || activity.userName || 'Sistem'}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: tr })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground p-6">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <ChatCircle size={32} weight="duotone" className="text-muted-foreground/50" />
            </div>
            <p className="font-medium text-foreground">Henüz aktivite bulunmuyor</p>
            <p className="text-sm mt-1">Proje üzerinde işlem yapıldıkça burada görünecektir.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
