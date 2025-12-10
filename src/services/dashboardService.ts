import type { DashboardWidget, DashboardLayout, WidgetType } from '@/types'

const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    id: 'widget-revenue',
    type: 'kpi-card',
    title: 'Bu Ay Gelir',
    config: {
      dataSource: 'finance',
      metric: 'totalRevenue',
      dateRange: 'this-month',
      color: 'green',
      icon: 'CurrencyDollar',
      showTrend: true
    },
    position: { x: 0, y: 0, w: 1, h: 1 }
  },
  {
    id: 'widget-expense',
    type: 'kpi-card',
    title: 'Bu Ay Gider',
    config: {
      dataSource: 'finance',
      metric: 'totalExpense',
      dateRange: 'this-month',
      color: 'red',
      icon: 'Receipt',
      showTrend: true
    },
    position: { x: 1, y: 0, w: 1, h: 1 }
  },
  {
    id: 'widget-approvals',
    type: 'kpi-card',
    title: 'Bekleyen Onaylar',
    config: {
      dataSource: 'approvals',
      metric: 'pending',
      color: 'yellow',
      icon: 'CheckCircle'
    },
    position: { x: 2, y: 0, w: 1, h: 1 }
  },
  {
    id: 'widget-employees',
    type: 'kpi-card',
    title: 'Aktif Çalışan',
    config: {
      dataSource: 'hr',
      metric: 'activeEmployees',
      color: 'blue',
      icon: 'Users'
    },
    position: { x: 3, y: 0, w: 1, h: 1 }
  },
  {
    id: 'widget-trend',
    type: 'bar-chart',
    title: 'Aylık Gelir/Gider Trendi',
    config: {
      dataSource: 'finance',
      metric: 'monthlyTrend',
      dateRange: 'last-12-months'
    },
    position: { x: 0, y: 1, w: 2, h: 2 }
  },
  {
    id: 'widget-categories',
    type: 'pie-chart',
    title: 'Kategori Bazlı Gider Dağılımı',
    config: {
      dataSource: 'finance',
      metric: 'categoryDistribution',
      dateRange: 'this-month'
    },
    position: { x: 2, y: 1, w: 2, h: 2 }
  }
]

export const dashboardService = {
  getLayout(userId: string): DashboardLayout {
    const stored = localStorage.getItem(`dashboard-layout-${userId}`)
    
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse dashboard layout:', e)
      }
    }
    
    return {
      widgets: DEFAULT_WIDGETS,
      updatedAt: new Date().toISOString()
    }
  },

  saveLayout(userId: string, layout: DashboardLayout): void {
    try {
      localStorage.setItem(
        `dashboard-layout-${userId}`,
        JSON.stringify({
          ...layout,
          updatedAt: new Date().toISOString()
        })
      )
    } catch (e) {
      console.error('Failed to save dashboard layout:', e)
    }
  },

  addWidget(userId: string, widget: DashboardWidget): void {
    const layout = this.getLayout(userId)
    layout.widgets.push(widget)
    this.saveLayout(userId, layout)
  },

  removeWidget(userId: string, widgetId: string): void {
    const layout = this.getLayout(userId)
    layout.widgets = layout.widgets.filter(w => w.id !== widgetId)
    this.saveLayout(userId, layout)
  },

  updateWidget(userId: string, widgetId: string, updates: Partial<DashboardWidget>): void {
    const layout = this.getLayout(userId)
    const index = layout.widgets.findIndex(w => w.id === widgetId)
    
    if (index !== -1) {
      layout.widgets[index] = {
        ...layout.widgets[index],
        ...updates
      }
      this.saveLayout(userId, layout)
    }
  },

  resetToDefault(userId: string): void {
    localStorage.removeItem(`dashboard-layout-${userId}`)
  },

  getAvailableWidgets(): Array<{
    type: WidgetType
    name: string
    description: string
    icon: string
    defaultSize: { w: number; h: number }
  }> {
    return [
      {
        type: 'kpi-card',
        name: 'KPI Kartı',
        description: 'Tek bir metrik göstergesi',
        icon: 'ChartBar',
        defaultSize: { w: 1, h: 1 }
      },
      {
        type: 'line-chart',
        name: 'Çizgi Grafik',
        description: 'Zaman serisi trend grafiği',
        icon: 'ChartLine',
        defaultSize: { w: 2, h: 2 }
      },
      {
        type: 'bar-chart',
        name: 'Çubuk Grafik',
        description: 'Karşılaştırmalı çubuk grafik',
        icon: 'ChartBar',
        defaultSize: { w: 2, h: 2 }
      },
      {
        type: 'pie-chart',
        name: 'Pasta Grafik',
        description: 'Dağılım grafiği',
        icon: 'ChartPie',
        defaultSize: { w: 2, h: 2 }
      },
      {
        type: 'table',
        name: 'Tablo Widget',
        description: 'Veri tablosu gösterimi',
        icon: 'Table',
        defaultSize: { w: 2, h: 2 }
      },
      {
        type: 'list',
        name: 'Liste Widget',
        description: 'Öğe listesi veya aktivite feed',
        icon: 'List',
        defaultSize: { w: 1, h: 2 }
      },
      {
        type: 'calendar',
        name: 'Takvim Widget',
        description: 'Etkinlik takvimi',
        icon: 'Calendar',
        defaultSize: { w: 2, h: 2 }
      }
    ]
  }
}
