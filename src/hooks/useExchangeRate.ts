import { useQuery } from '@tanstack/react-query'

interface ExchangeRateResponse {
    amount: number
    base: string
    date: string
    rates: Record<string, number>
}

export function useExchangeRate(fromCurrency: string, toCurrency: string = 'TRY') {
    return useQuery({
        queryKey: ['exchange-rate', fromCurrency, toCurrency],
        queryFn: async () => {
            if (fromCurrency === toCurrency) return 1

            // Frankfurter API: https://api.frankfurter.app/latest?from=USD&to=TRY
            const response = await fetch(`https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`)

            if (!response.ok) {
                throw new Error('Kur bilgisi alınamadı')
            }

            const data: ExchangeRateResponse = await response.json()
            return data.rates[toCurrency]
        },
        enabled: !!fromCurrency && !!toCurrency,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 2
    })
}


