import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Circle } from '@phosphor-icons/react'

interface RealtimeIndicatorProps {
  lastCheck: Date
  isActive?: boolean
}

export function RealtimeIndicator({ lastCheck, isActive = true }: RealtimeIndicatorProps) {
  const [timeSinceCheck, setTimeSinceCheck] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const diff = Math.floor((now.getTime() - lastCheck.getTime()) / 1000)
      
      if (diff < 60) {
        setTimeSinceCheck(`${diff} saniye önce`)
      } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60)
        setTimeSinceCheck(`${minutes} dakika önce`)
      } else {
        const hours = Math.floor(diff / 3600)
        setTimeSinceCheck(`${hours} saat önce`)
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [lastCheck])

  if (!isActive) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-2 cursor-pointer">
            <Circle 
              size={8} 
              weight="fill" 
              className="text-green-500 animate-pulse" 
            />
            <span className="text-xs">Canlı</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Son kontrol: {timeSinceCheck}</p>
          <p className="text-xs text-muted-foreground">Her 30 saniyede otomatik güncellenir</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
