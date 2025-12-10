import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { branchSettingsService } from '@/services/branchSettingsService'

export const useCurrency = () => {
    const selectedFacility = useAuthStore(state => state.selectedFacility)

    const { data: settings, isLoading } = useQuery({
        queryKey: ['branch-settings', selectedFacility?.id],
        queryFn: () => branchSettingsService.getSettings(selectedFacility?.id || ''),
        enabled: !!selectedFacility?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    })

    const currencyCode = settings?.financial?.defaultCurrency || 'TRY'

    // Find the symbol for the currency code
    const currencySymbol = settings?.financial?.currencies?.find(c => c.code === currencyCode)?.symbol ||
        (currencyCode === 'USD' ? '$' :
            currencyCode === 'EUR' ? '€' :
                currencyCode === 'GBP' ? '£' : '₺')

    const format = (amount: number | string | undefined | null) => {
        if (amount === undefined || amount === null || amount === '') return '-'

        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
        if (isNaN(numAmount)) return '-'

        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numAmount)
    }

    return {
        code: currencyCode,
        symbol: currencySymbol,
        format,
        isLoading
    }
}
