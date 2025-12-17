import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { facilityService } from '@/services/facilityService'
import type { Facility } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CaretDown, List, SignOut, User, Buildings, Check, MagnifyingGlass, Command as CommandIcon } from '@phosphor-icons/react'
import { Clock } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { GlobalSearch } from '@/components/common/GlobalSearch'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { branchSettingsService } from '@/services/branchSettingsService'
import { useTranslation } from '@/hooks/useTranslation'
import { toast } from 'sonner'

function ClockDisplay() {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const [time, setTime] = useState(new Date())

  const { data: settings } = useQuery({
    queryKey: ['branch-settings', selectedFacility?.id],
    queryFn: () => branchSettingsService.getSettings(selectedFacility?.id || ''),
    enabled: !!selectedFacility?.id && selectedFacility.type === 'branch',
  })

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Parse timezone offset from settings (e.g., "UTC+03:00")
  const getTimeWithOffset = () => {
    if (!settings?.regional?.timezone) return time

    const tz = settings.regional.timezone
    if (tz.startsWith('UTC')) {
      const offsetStr = tz.replace('UTC', '')
      const sign = offsetStr.startsWith('-') ? -1 : 1
      const [hours, minutes] = offsetStr.replace(/[+-]/, '').split(':').map(Number)

      const utc = time.getTime() + (time.getTimezoneOffset() * 60000)
      const offsetMs = (hours * 60 + (minutes || 0)) * 60000 * sign
      return new Date(utc + offsetMs)
    }
    return time
  }

  const displayTime = getTimeWithOffset()

  return (
    <span className="text-sm font-medium font-mono">
      {displayTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const logout = useAuthStore(state => state.logout)
  const selectFacility = useAuthStore(state => state.selectFacility)
  const { t, language, setLanguage } = useTranslation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  // Sadece kullanıcının erişimi olan tesisleri getir
  const { data: allFacilities = [] } = useQuery({
    queryKey: ['facilities'],
    queryFn: () => facilityService.getFacilities(),
  })

  // Kullanıcının erişimi olan tesisleri filtrele
  const facilities = allFacilities.filter((facility: Facility) => {
    if (!user?.facilityAccess || user.facilityAccess.length === 0) {
      return false
    }
    // Super Admin tüm tesislere erişebilir
    if (user.role === 'Super Admin') {
      return true
    }
    // Diğer kullanıcılar sadece erişimi olan tesisleri görebilir
    return user.facilityAccess.includes(facility.code)
  })

  useEffect(() => {
    if (!user || !user.id || !user.name || !user.email) {
      navigate('/login', { replace: true })
      return
    }
    if (!selectedFacility || !selectedFacility.id || !selectedFacility.code || !selectedFacility.name) {
      navigate('/tenant-select', { replace: true })
    }
  }, [user, selectedFacility, navigate])

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const queryClient = useQueryClient()

  const handleFacilityChange = async (facility: Facility) => {
    if (selectedFacility?.id === facility.id) return

    // Erişim kontrolü
    if (!user) {
      console.error('User not found')
      return
    }

    // Super Admin tüm tesislere erişebilir
    if (user.role !== 'Super Admin') {
      // Kullanıcının bu tesise erişimi var mı kontrol et
      if (!user.facilityAccess || !user.facilityAccess.includes(facility.code)) {
        toast.error('Bu tesise erişim yetkiniz bulunmamaktadır')
        return
      }
    }

    setIsSwitching(true)

    // First clear all cached data
    queryClient.clear()

    // Wait a moment for visual feedback
    await new Promise(resolve => setTimeout(resolve, 500))

    // Switch facility
    selectFacility(facility)

    // Navigate based on facility type
    if (facility.type === 'headquarters') {
      navigate('/headquarters/dashboard')
    } else {
      navigate('/')
    }

    // Wait for navigation and initial data load
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Prefetch new data
    await queryClient.invalidateQueries()

    // Small delay before hiding loading screen
    await new Promise(resolve => setTimeout(resolve, 300))

    setIsSwitching(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (!user || typeof user !== 'object' || !user.id || !user.name || !user.email) return null
  if (!selectedFacility || typeof selectedFacility !== 'object' || !selectedFacility.id || !selectedFacility.code || !selectedFacility.name) return null

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-gradient-to-r from-background via-background to-muted/30 px-4 md:px-6 shadow-sm">
      {/* Left Section - Logo & Facility */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <List size={20} />
        </Button>

        <div className="hidden md:flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
            <Buildings size={20} className="text-primary-foreground" weight="fill" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight leading-tight">NGO Yönetim</span>
            <span className="text-[10px] text-muted-foreground">Sivil Toplum Yönetim Sistemi</span>
          </div>
        </div>

        <div className="h-8 w-px bg-border/60 mx-1 hidden md:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 h-9 bg-background/50 hover:bg-accent">
              <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                <Buildings size={14} className="text-primary" weight="duotone" />
              </div>
              <span className="hidden sm:inline font-medium">{selectedFacility.name}</span>
              <span className="sm:hidden text-xs">{selectedFacility.code}</span>
              <CaretDown size={14} className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>{t('Tesis Seçin')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[300px]">
              {facilities.map((facility) => (
                <DropdownMenuItem
                  key={facility.id}
                  onClick={() => handleFacilityChange(facility)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="font-medium">{facility.name}</div>
                    <div className="text-xs text-muted-foreground">{facility.location}</div>
                  </div>
                  {selectedFacility?.id === facility.id && (
                    <Check size={16} weight="bold" className="text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </ScrollArea>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate('/tenant-select')}
              className="cursor-pointer font-medium text-primary focus:text-primary"
            >
              <Buildings size={16} className="mr-2" />
              {t('Tüm Tesisleri Yönet')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Center Section - Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl mx-4">
        <Button
          variant="outline"
          className="flex-1 justify-start text-muted-foreground h-9 bg-muted/30 border-muted hover:bg-muted/50 transition-colors"
          onClick={() => setSearchOpen(true)}
        >
          <MagnifyingGlass size={16} className="mr-2 text-muted-foreground/70" />
          <span className="hidden md:inline text-sm">{t('Ara...')}</span>
          <span className="md:hidden text-sm">{t('Ara')}</span>
          <kbd className="ml-auto hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium">
            <CommandIcon size={10} />
            K
          </kbd>
        </Button>
      </div>

      {/* Right Section - Quick Info & Actions */}
      <div className="flex items-center gap-2">
        {/* Date & Time */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-muted/40 rounded-lg border border-border/50">
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-muted-foreground" />
            <ClockDisplay />
          </div>
          <div className="h-4 w-px bg-border/60" />
          <span className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>

        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-primary/10"
          onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
        >
          <span className="text-xs font-bold">{language.toUpperCase()}</span>
        </Button>

        {/* User Menu */}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm">{user.name}</span>
              <CaretDown size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground font-normal">{user.email}</div>
                <Badge variant="secondary" className="mt-2 text-xs">
                  {user.role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User size={16} className="mr-2" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <SignOut size={16} className="mr-2" />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      {isSwitching && <LoadingScreen message="Tesis değiştiriliyor..." />}
    </header>
  )
}
