import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from '@phosphor-icons/react'

export function ReportsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Raporlar</h1>
          <p className="text-muted-foreground mt-1">
            Detaylı raporlar ve analizler
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <CardTitle>Raporlama Modülü</CardTitle>
              <CardDescription>Yakında aktif olacak</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Bu modül finansal raporlar, personel raporları, proje analizleri ve özelleştirilebilir 
            rapor şablonları içerecek.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
