import { useDashboardStore, WidgetId } from '@/store/dashboardStore'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Gear, ArrowCounterClockwise } from '@phosphor-icons/react'

const WIDGET_LABELS: Record<WidgetId, string> = {
    'stats-income': 'Toplam Gelir',
    'stats-expense': 'Toplam Gider',
    'stats-pending': 'Bekleyen Onaylar',
    'stats-active-employees': 'Aktif Çalışan',
    'chart-trend': 'Aylık Trend Grafiği',
    'chart-category': 'Kategori Dağılımı',
    'list-transactions': 'Son İşlemler',
    'list-payments': 'Yaklaşan Ödemeler',
}

export function DashboardCustomizer() {
    const { widgets, toggleWidget, resetToDefault } = useDashboardStore()

    // Sort widgets by order to show them in the list in the same order as dashboard (optional, but good for UX)
    // Or maybe just show them in a fixed logical list. Let's show in current order.
    const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order)

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Gear size={16} />
                    Özelleştir
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Dashboard Özelleştir</SheetTitle>
                    <SheetDescription>
                        Görmek istediğiniz bileşenleri seçin. Sıralamayı değiştirmek için dashboard üzerinde sürükle-bırak yapabilirsiniz.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6">
                    <div className="space-y-4">
                        {sortedWidgets.map((widget) => (
                            <div key={widget.id} className="flex items-center justify-between">
                                <Label htmlFor={widget.id} className="flex-1 cursor-pointer">
                                    {WIDGET_LABELS[widget.id]}
                                </Label>
                                <Switch
                                    id={widget.id}
                                    checked={widget.isVisible}
                                    onCheckedChange={() => toggleWidget(widget.id)}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 border-t">
                        <Button variant="destructive" className="w-full gap-2" onClick={resetToDefault}>
                            <ArrowCounterClockwise size={16} />
                            Varsayılana Dön
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
