import { useQuery } from '@tanstack/react-query'

interface Country {
    name: {
        common: string
        official: string
    }
    cca2: string
    timezones: string[]
}

export function useCountries() {
    return useQuery({
        queryKey: ['countries'],
        queryFn: async () => {
            const response = await fetch('https://restcountries.com/v3.1/all?fields=name,timezones,cca2')
            if (!response.ok) {
                throw new Error('Failed to fetch countries')
            }
            const data = await response.json() as Country[]
            return data.sort((a, b) => a.name.common.localeCompare(b.name.common))
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    })
}
