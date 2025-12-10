export type WidgetType = 
  | 'kpi-card' 
  | 'line-chart' 
  | 'bar-chart' 
  | 'pie-chart'
  | 'table'
  | 'list'
  | 'calendar'

export interface DashboardWidget {
  id: string
  type: WidgetType
  title: string
  config: WidgetConfig
  position: {
    x: number
    y: number
    w: number
    h: number
  }
}

export interface WidgetConfig {
  dataSource?: string
  metric?: string
  dateRange?: string
  filters?: Record<string, any>
  color?: string
  icon?: string
  showTrend?: boolean
  [key: string]: any
}

export interface DashboardLayout {
  widgets: DashboardWidget[]
  updatedAt: string
}
