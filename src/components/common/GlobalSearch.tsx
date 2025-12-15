import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Receipt,
  UserCircle,
  CalendarBlank,
  FolderOpen,
  Cow,
  CheckCircle,
  MagnifyingGlass,
  ArrowRight,
} from '@phosphor-icons/react'
import { globalSearchService, type SearchResultGroup } from '@/services/globalSearchService'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useDebounce } from '@/hooks/use-debounce'

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const typeIcons = {
  transaction: Receipt,
  employee: UserCircle,
  leave: CalendarBlank,
  project: FolderOpen,
  qurban: Cow,
  approval: CheckCircle,
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce search - performans optimizasyonu
  const debouncedSearch = useDebounce(searchQuery, 300)

  const { data: results, isLoading } = useQuery({
    queryKey: ['global-search', debouncedSearch],
    queryFn: () => globalSearchService.search(debouncedSearch, 20),
    enabled: debouncedSearch.length >= 2,
    staleTime: 30000,
  })

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [open])

  const handleSelect = (url: string) => {
    navigate(url)
    onOpenChange(false)
    setSearchQuery('')
  }

  const totalResults = results?.reduce((sum, group) => sum + group.results.length, 0) || 0

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center gap-2 border-b px-3 h-12">
        <MagnifyingGlass size={18} className="text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Sistem genelinde ara... (işlemler, çalışanlar, projeler, vb.)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm h-full"
        />
      </div>
      <CommandList>
        {isLoading && debouncedSearch.length >= 2 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Aranıyor...
          </div>
        )}
        
        {!isLoading && debouncedSearch.length < 2 && (
          <div className="p-6 text-center">
            <MagnifyingGlass size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">
              Arama yapmak için en az 2 karakter girin
            </p>
            <div className="mt-6 space-y-2 text-left">
              <p className="text-xs font-medium text-muted-foreground mb-2">Arama örnekleri:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>• Finans işlemleri: "kira", "maaş", "fatura"</div>
                <div>• Çalışanlar: isim, e-posta, pozisyon</div>
                <div>• Projeler: proje adı, kod</div>
                <div>• Onaylar: onay başlığı</div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && debouncedSearch.length >= 2 && results && results.length === 0 && (
          <CommandEmpty>
            <div className="p-6 text-center">
              <MagnifyingGlass size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-sm font-medium mb-1">Sonuç bulunamadı</p>
              <p className="text-xs text-muted-foreground">
                "{debouncedSearch}" için arama sonucu bulunamadı
              </p>
            </div>
          </CommandEmpty>
        )}

        {!isLoading && results && results.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs text-muted-foreground border-b">
              {totalResults} sonuç bulundu
            </div>
            {results.map((group: SearchResultGroup) => {
              const Icon = typeIcons[group.type]
              return (
                <CommandGroup key={group.type} heading={group.label}>
                  {group.results.map((result) => (
                    <CommandItem
                      key={result.id}
                      value={`${group.type}-${result.id}`}
                      onSelect={() => handleSelect(result.url)}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                        <Icon size={18} weight="duotone" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          {result.metadata?.status && (
                            <Badge 
                              variant="outline" 
                              className="text-xs h-5 px-1.5"
                            >
                              {result.metadata.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {result.description}
                        </p>
                      </div>
                      <ArrowRight size={16} className="text-muted-foreground flex-shrink-0" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}

