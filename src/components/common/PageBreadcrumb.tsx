import { Link, useLocation } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { House } from '@phosphor-icons/react'

const routeNames: Record<string, string> = {
  '': 'Dashboard',
  'finance': 'Finans',
  'hr': 'İnsan Kaynakları',
  'projects': 'Projeler',
  'qurban': 'Kurban',
  'reports': 'Raporlar',
  'approvals': 'Onay Merkezi',
  'settings': 'Ayarlar'
}

export function PageBreadcrumb() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter(x => x)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="flex items-center gap-1">
              <House size={16} weight="fill" />
              <span className="sr-only">Ana Sayfa</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {pathnames.map((pathname, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
          const isLast = index === pathnames.length - 1
          const name = routeNames[pathname] || pathname

          return (
            <div key={routeTo} className="flex items-center">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={routeTo}>{name}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
