import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  ChartBar,
  CurrencyDollar,
  Users,
  FolderOpen,
  Cow,
  FileText,
  Gear,
  CheckCircle,
  List,
  X,
  CaretDown,
  Receipt,
  ChartPie,
  TreeStructure,
  UserList,
  Folder,
  UserCircle,
  CalendarBlank,
  ClockCounterClockwise,
  Wallet,
  Buildings as BuildingsIcon,
  MagnifyingGlass,
  Star,
  Command,
  ArrowRight,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'
import { approvalService } from '@/services/approvalService'
import { branchSettingsService } from '@/services/branchSettingsService'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<any>
  children?: NavItem[]
  badge?: number | (() => Promise<number>)
  shortcut?: string
  favorite?: boolean
}

const getNavItems = (isHeadquarters: boolean, t: (text: string) => string, enabledModules?: string[]): NavItem[] => {
  const items: NavItem[] = [
    { title: t('Dashboard'), href: isHeadquarters ? '/headquarters/dashboard' : '/', icon: ChartBar, shortcut: 'D' },
  ]

  if (isHeadquarters) {
    // Genel Merkez için özel menü
    items.push({
      title: t('Finans Yönetimi'),
      icon: CurrencyDollar,
      children: [
        { title: t('Tüm Şubeler - Finans'), href: '/headquarters/finance', icon: Receipt },
        { title: t('Bütçe Aktarımları'), href: '/finance/budget-transfers', icon: ArrowRight },

      ]
    })

    items.push({
      title: t('İK Yönetimi'),
      icon: Users,
      children: [
        { title: t('Tüm Şubeler - İK'), href: '/headquarters/hr', icon: UserCircle },
      ]
    })

    items.push({
      title: t('Proje Yönetimi'),
      icon: FolderOpen,
      children: [
        { title: t('Tüm Şubeler - Projeler'), href: '/headquarters/projects', icon: FolderOpen },
      ]
    })

    items.push({
      title: t('Kurban Yönetimi'),
      icon: Cow,
      children: [
        { title: t('Tüm Şubeler - Kurban'), href: '/headquarters/qurban', icon: Cow },
      ]
    })

    items.push({
      title: t('Ayarlar Yönetimi'),
      icon: Gear,
      children: [
        { title: t('Şube Ayarları'), href: '/headquarters/settings', icon: Gear },
      ]
    })
  } else {
    // Şube için normal menü
    // Finans Modülü - Seçmeli (şubeler için)
    if (enabledModules?.includes('finance')) {
      items.push({
        title: t('Finans'),
        icon: CurrencyDollar,
        children: [
          { title: t('İşlemler'), href: '/finance/transactions', icon: Receipt },
          { title: t('Bütçeler'), href: '/finance/budgets', icon: ChartPie },

          { title: t('Tedarikçiler & Müşteriler'), href: '/finance/vendors-customers', icon: UserList },
        ]
      })
    }

    // İnsan Kaynakları Modülü - Seçmeli (şubeler için)
    if (enabledModules?.includes('hr')) {
      items.push({
        title: t('İnsan Kaynakları'),
        icon: Users,
        children: [
          { title: t('Çalışanlar'), href: '/hr/employees', icon: UserCircle },
          { title: t('İzin Talepleri'), href: '/hr/leaves', icon: CalendarBlank },
          { title: t('Devamsızlık'), href: '/hr/attendance', icon: ClockCounterClockwise },
          { title: t('Bordro'), href: '/hr/payroll', icon: Wallet },
          { title: t('Departmanlar'), href: '/hr/departments', icon: BuildingsIcon },
        ]
      })
    }

    // Projeler Modülü - Seçmeli (şubeler için)
    if (enabledModules?.includes('projects')) {
      items.push({ title: t('Projeler'), href: '/projects', icon: FolderOpen, shortcut: 'P' })
    }

    // Kurban Modülü - Seçmeli (şubeler için)
    if (enabledModules?.includes('qurban')) {
      items.push({ title: t('Kurban'), href: '/qurban', icon: Cow })
    }
  }

  // Standart modüller (her zaman görünür)
  items.push(
    {
      title: t('Raporlar'),
      icon: FileText,
      children: [
        { title: t('Rapor Merkezi'), href: '/reports/center', icon: ChartBar },
      ]
    },
    {
      title: t('Onay Merkezi'),
      href: '/approvals',
      icon: CheckCircle,
      badge: async () => {
        const stats = await approvalService.getStats()
        return stats.pending
      },
      shortcut: 'A'
    },
    { title: t('Takvim'), href: '/calendar', icon: CalendarBlank, shortcut: 'C' }
  )

  // Şube için ayarlar menüsü ekle
  if (!isHeadquarters) {
    items.push({ title: t('Ayarlar'), href: '/settings/branch', icon: Gear, shortcut: 'S' })
  }

  return items
}

import { useTranslation } from '@/hooks/useTranslation'

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const isHeadquarters = selectedFacility?.type === 'headquarters'
  const enabledModules = selectedFacility?.enabledModules || (selectedFacility as any)?.enabled_modules
  const { t } = useTranslation()
  const navItems = getNavItems(isHeadquarters, t, enabledModules)

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    return saved === 'true'
  })
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    const saved = localStorage.getItem('sidebar-expanded')
    return saved ? JSON.parse(saved) : []
  })

  // Aktif sayfa varsa, o menüyü otomatik aç
  useEffect(() => {
    const activeItem = navItems.find(item => {
      if (item.href && location.pathname === item.href) return true
      if (item.children) {
        return item.children.some(child =>
          child.href && location.pathname.startsWith(child.href)
        )
      }
      return false
    })

    if (activeItem && activeItem.children && !expandedItems.includes(activeItem.title)) {
      setExpandedItems(prev => [...prev, activeItem.title])
    }
  }, [location.pathname])
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('sidebar-favorites')
    return saved ? JSON.parse(saved) : []
  })
  const notifications = useAuthStore(state => state.notifications)
  const unreadCount = notifications?.filter(n => !n.read).length || 0

  const { data: approvalStats } = useQuery({
    queryKey: ['approval-stats', selectedFacility?.id],
    queryFn: () => approvalService.getStats(selectedFacility?.id),
    refetchInterval: 30000,
  })

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }, [collapsed])

  useEffect(() => {
    localStorage.setItem('sidebar-expanded', JSON.stringify(expandedItems))
  }, [expandedItems])

  useEffect(() => {
    localStorage.setItem('sidebar-favorites', JSON.stringify(favorites))
  }, [favorites])

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    )
  }

  const toggleFavorite = (href: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorites(prev =>
      prev.includes(href)
        ? prev.filter(f => f !== href)
        : [...prev, href]
    )
  }

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return navItems

    const query = searchQuery.toLowerCase()
    return navItems.filter(item => {
      const matchesTitle = item.title.toLowerCase().includes(query)
      const matchesChildren = item.children?.some(child =>
        child.title.toLowerCase().includes(query)
      )
      return matchesTitle || matchesChildren
    }).map(item => {
      if (!item.children) return item
      return {
        ...item,
        children: item.children.filter(child =>
          child.title.toLowerCase().includes(query)
        )
      }
    })
  }, [searchQuery, navItems])

  const favoriteItems = useMemo(() => {
    return navItems.flatMap(item => {
      const items: Array<{ item: NavItem; href: string }> = []
      if (item.href && favorites.includes(item.href)) {
        items.push({ item, href: item.href })
      }
      item.children?.forEach(child => {
        if (child.href && favorites.includes(child.href)) {
          items.push({ item: child, href: child.href })
        }
      })
      return items
    })
  }, [favorites, navItems])

  const isItemActive = (item: NavItem): boolean => {
    if (!item || typeof item !== 'object') return false

    if (item.href) {
      return location.pathname === item.href
    }
    if (item.children && Array.isArray(item.children)) {
      return item.children.some(child =>
        child &&
        typeof child === 'object' &&
        child.href &&
        typeof child.href === 'string' &&
        location.pathname.startsWith(child.href)
      )
    }
    return false
  }

  const { data: settings } = useQuery({
    queryKey: ['branch-settings', selectedFacility?.id],
    queryFn: () => branchSettingsService.getSettings(selectedFacility?.id || ''),
    enabled: !!selectedFacility?.id && selectedFacility.type === 'branch',
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  })

  const logoUrl = settings?.general?.logo

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: collapsed ? '80px' : '280px',
        }}
        className={cn(
          'fixed left-0 top-0 h-screen bg-card border-r z-50 transition-transform',
          'lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center justify-between px-4 border-b">
            {!collapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 flex-1"
              >
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary-foreground font-bold text-sm">KY</span>
                  )}
                </div>
                <span className="font-semibold text-sm">Kurumsal Yönetim</span>
              </motion.div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary-foreground font-bold text-xs">KY</span>
                )}
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onClose}
            >
              <X size={20} />
            </Button>
          </div>

          {!collapsed && (
            <div className="px-3 py-3 border-b">
              <div className="relative">
                <MagnifyingGlass
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Menüyü ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={14} />
                  </Button>
                )}
              </div>
            </div>
          )}

          {!collapsed && favoriteItems.length > 0 && (
            <div className="px-3 py-2 border-b">
              <div className="flex items-center gap-2 px-2 mb-2">
                <Star size={14} weight="fill" className="text-yellow-500" />
                <span className="text-xs font-medium text-muted-foreground">Favoriler</span>
              </div>
              <div className="space-y-1">
                {favoriteItems.map(({ item, href }) => {
                  const Icon = item.icon
                  const isActive = location.pathname === href
                  return (
                    <TooltipProvider key={href}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link to={href} onClick={onClose}>
                            <motion.div
                              whileHover={{ x: 2 }}
                              className={cn(
                                'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                                isActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-accent'
                              )}
                            >
                              <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
                              <span className="flex-1 truncate">{item.title}</span>
                            </motion.div>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex-1 px-3 py-4 overflow-y-auto">
            <nav className="space-y-1">
              {filteredItems.map((item) => {
                const Icon = item.icon
                const isActive = isItemActive(item)
                const isExpanded = expandedItems.includes(item.title)
                const hasChildren = item.children && item.children.length > 0

                return (
                  <div key={item.title}>
                    {item.href ? (
                      <TooltipProvider>
                        <Tooltip delayDuration={collapsed ? 0 : 700}>
                          <TooltipTrigger asChild>
                            <Link to={item.href} onClick={onClose}>
                              <motion.div
                                whileHover={{ x: collapsed ? 0 : 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative group',
                                  isActive
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'hover:bg-accent hover:text-accent-foreground'
                                )}
                              >
                                <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                                {!collapsed && (
                                  <>
                                    <span className="text-sm font-medium flex-1">{item.title}</span>
                                    {item.badge && (
                                      <Badge
                                        variant="destructive"
                                        className="h-5 min-w-5 px-1.5 text-xs flex items-center justify-center"
                                      >
                                        {typeof item.badge === 'function'
                                          ? (approvalStats?.pending || 0)
                                          : item.badge}
                                      </Badge>
                                    )}
                                    {item.shortcut && (
                                      <kbd className="hidden group-hover:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono bg-muted rounded border">
                                        <Command size={10} />
                                        {item.shortcut}
                                      </kbd>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => toggleFavorite(item.href!, e)}
                                    >
                                      <Star
                                        size={14}
                                        weight={favorites.includes(item.href!) ? 'fill' : 'regular'}
                                        className={favorites.includes(item.href!) ? 'text-yellow-500' : ''}
                                      />
                                    </Button>
                                  </>
                                )}
                                {collapsed && item.badge && (
                                  <Badge
                                    variant="destructive"
                                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                                  >
                                    {typeof item.badge === 'function'
                                      ? (approvalStats?.pending || 0)
                                      : item.badge}
                                  </Badge>
                                )}
                              </motion.div>
                            </Link>
                          </TooltipTrigger>
                          {collapsed && (
                            <TooltipContent side="right">
                              <div className="flex items-center gap-2">
                                <p>{item.title}</p>
                                {item.shortcut && (
                                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded border">
                                    ⌘{item.shortcut}
                                  </kbd>
                                )}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <>
                        <TooltipProvider>
                          <Tooltip delayDuration={collapsed ? 0 : 700}>
                            <TooltipTrigger asChild>
                              <motion.div
                                whileHover={{ x: collapsed ? 0 : 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer relative group',
                                  isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'hover:bg-accent hover:text-accent-foreground'
                                )}
                                onClick={() => !collapsed && toggleExpanded(item.title)}
                              >
                                <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                                {!collapsed && (
                                  <>
                                    <span className="text-sm font-medium flex-1">{item.title}</span>
                                    {hasChildren && (
                                      <motion.div
                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <CaretDown size={16} />
                                      </motion.div>
                                    )}
                                  </>
                                )}
                              </motion.div>
                            </TooltipTrigger>
                            {collapsed && (
                              <TooltipContent side="right">
                                <p>{item.title}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>

                        {hasChildren && !collapsed && (
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="ml-6 mt-1 space-y-1 border-l pl-3">
                                  {item.children?.filter((child): child is NavItem & { href: string } =>
                                    !!child && !!child.href && !!child.icon
                                  ).map((child) => {
                                    const ChildIcon = child.icon
                                    const isChildActive = location.pathname === child.href

                                    return (
                                      <Link key={child.href} to={child.href} onClick={onClose}>
                                        <motion.div
                                          whileHover={{ x: 4 }}
                                          whileTap={{ scale: 0.98 }}
                                          className={cn(
                                            'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm relative group',
                                            isChildActive
                                              ? 'bg-primary text-primary-foreground shadow-sm'
                                              : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                                          )}
                                        >
                                          <ChildIcon size={16} weight={isChildActive ? 'fill' : 'regular'} />
                                          <span className="font-medium flex-1">{child.title}</span>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => toggleFavorite(child.href!, e)}
                                          >
                                            <Star
                                              size={12}
                                              weight={favorites.includes(child.href!) ? 'fill' : 'regular'}
                                              className={favorites.includes(child.href!) ? 'text-yellow-500' : ''}
                                            />
                                          </Button>
                                        </motion.div>
                                      </Link>
                                    )
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </nav>
          </div>

          <Separator />

          <div className="p-3">
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'sm'}
              className="w-full justify-start"
              onClick={() => setCollapsed(!collapsed)}
            >
              <List size={20} />
              {!collapsed && <span className="ml-2">Daralt</span>}
            </Button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
