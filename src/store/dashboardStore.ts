import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type WidgetId =
    | 'stats-income'
    | 'stats-expense'
    | 'stats-budget-hq'
    | 'stats-pending'
    | 'stats-active-employees'
    | 'chart-trend'
    | 'chart-category'
    | 'list-transactions'
    | 'list-payments'

export interface WidgetState {
    id: WidgetId
    isVisible: boolean
    order: number
}

interface DashboardStore {
    widgets: WidgetState[]
    toggleWidget: (id: WidgetId) => void
    reorderWidgets: (newOrder: WidgetState[]) => void
    resetToDefault: () => void
}

const DEFAULT_WIDGETS: WidgetState[] = [
    { id: 'stats-income', isVisible: true, order: 0 },
    { id: 'stats-budget-hq', isVisible: true, order: 1 },
    { id: 'stats-expense', isVisible: true, order: 2 },
    { id: 'stats-pending', isVisible: true, order: 3 },
    { id: 'stats-active-employees', isVisible: true, order: 4 },
    { id: 'chart-trend', isVisible: true, order: 5 },
    { id: 'chart-category', isVisible: true, order: 6 },
    { id: 'list-transactions', isVisible: true, order: 7 },
    { id: 'list-payments', isVisible: true, order: 8 },
]

export const useDashboardStore = create<DashboardStore>()(
    persist(
        (set) => ({
            widgets: DEFAULT_WIDGETS,
            toggleWidget: (id) =>
                set((state) => ({
                    widgets: state.widgets.map((w) =>
                        w.id === id ? { ...w, isVisible: !w.isVisible } : w
                    ),
                })),
            reorderWidgets: (newOrder) => set({ widgets: newOrder }),
            resetToDefault: () => set({ widgets: DEFAULT_WIDGETS }),
        }),
        {
            name: 'dashboard-preferences',
        }
    )
)
