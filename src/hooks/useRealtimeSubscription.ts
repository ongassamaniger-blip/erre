import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface UseRealtimeSubscriptionProps {
    table: string
    queryKey: string[]
    filter?: string
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
    schema?: string
}

export function useRealtimeSubscription({
    table,
    queryKey,
    filter,
    event = '*',
    schema = 'public',
}: UseRealtimeSubscriptionProps) {
    const queryClient = useQueryClient()

    useEffect(() => {
        const channel = supabase
            .channel(`db-changes-${table}-${filter || 'all'}`)
            .on(
                'postgres_changes',
                {
                    event: event as any,
                    schema,
                    table,
                    filter: filter || undefined,
                },
                () => {
                    // Invalidate and refetch
                    queryClient.invalidateQueries({ queryKey })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [table, filter, event, schema, queryKey, queryClient])
}
