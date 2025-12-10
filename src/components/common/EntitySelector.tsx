import { useState } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { entityService, type Entity } from '@/services/finance/entityService'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

interface EntitySelectorProps {
    value?: string // Entity Name
    onChange: (name: string, id?: string) => void
    type?: 'vendor' | 'customer'
    placeholder?: string
}

export function EntitySelector({ value, onChange, type, placeholder }: EntitySelectorProps) {
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    const selectedFacility = useAuthStore((state) => state.selectedFacility)
    const queryClient = useQueryClient()

    const { data: entities = [], isLoading } = useQuery({
        queryKey: ['entities', selectedFacility?.id, type],
        queryFn: () => entityService.getEntities(selectedFacility!.id, type),
        enabled: !!selectedFacility?.id,
    })

    const createEntityMutation = useMutation({
        mutationFn: (name: string) => entityService.createEntity({
            name,
            type: type || 'vendor', // Default to vendor if not specified
            facility_id: selectedFacility?.id
        }),
        onSuccess: (newEntity) => {
            queryClient.invalidateQueries({ queryKey: ['entities'] })
            onChange(newEntity.name, newEntity.id)
            setOpen(false)
            toast.success(`${type === 'customer' ? 'Müşteri' : 'Tedarikçi'} oluşturuldu`)
        },
        onError: (error) => {
            toast.error('Oluşturma hatası: ' + error.message)
        }
    })

    const handleCreate = () => {
        if (!searchValue) return
        createEntityMutation.mutate(searchValue)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value || placeholder || "Seçiniz..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder={`${type === 'customer' ? 'Müşteri' : 'Tedarikçi'} ara...`}
                        onValueChange={setSearchValue}
                    />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2 text-center">
                                <p className="text-sm text-muted-foreground mb-2">Bulunamadı</p>
                                {searchValue && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={handleCreate}
                                        disabled={createEntityMutation.isPending}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        "{searchValue}" Oluştur
                                    </Button>
                                )}
                            </div>
                        </CommandEmpty>
                        <CommandGroup>
                            {entities.map((entity) => (
                                <CommandItem
                                    key={entity.id}
                                    value={entity.name}
                                    onSelect={() => {
                                        onChange(entity.name, entity.id)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === entity.name ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {entity.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
