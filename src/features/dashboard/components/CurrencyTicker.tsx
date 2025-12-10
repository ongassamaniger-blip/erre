import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from '@phosphor-icons/react'

interface ExchangeRate {
    currency: string
    rate: number
    change?: number // Optional: percentage change
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'CAD']

export function CurrencyTicker() {
    const { data: rates } = useQuery({
        queryKey: ['exchange-rates'],
        queryFn: async () => {
            // Frankfurter API supports multiple 'to' currencies if 'from' is specified, 
            // but we want 'from' X 'to' TRY. 
            // Since 'from' is singular in Frankfurter, we might need multiple requests or a different strategy.
            // Strategy: Fetch base=TRY. 1 TRY = X USD. Then 1 USD = 1/X TRY.
            // This allows one request.

            const response = await fetch('https://api.frankfurter.app/latest?from=TRY&to=USD,EUR,GBP,CHF,CAD')
            if (!response.ok) throw new Error('Failed to fetch rates')
            const data = await response.json()

            // Convert to "1 Unit = X TRY" format
            return CURRENCIES.map(code => ({
                currency: code,
                rate: 1 / data.rates[code]
            }))
        },
        refetchInterval: 60000 * 5, // Refresh every 5 minutes
        staleTime: 60000 * 5,
    })

    if (!rates) return null

    return (
        <div className="w-full bg-slate-900 text-white overflow-hidden py-2 mb-4 rounded-md shadow-sm border border-slate-800 relative z-0">
            <div className="flex items-center">
                <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 mr-2 rounded-r absolute left-0 z-10 shadow-md">
                    CANLI BORSA
                </div>
                <motion.div
                    className="flex items-center gap-8 whitespace-nowrap"
                    animate={{
                        x: [0, -1000], // Adjust based on content width, or use a better infinite loop technique
                    }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 20,
                            ease: "linear",
                        },
                    }}
                    style={{ paddingLeft: '120px' }} // Space for the "CANLI BORSA" label
                >
                    {/* Duplicate the list to ensure smooth infinite scroll */}
                    {[...rates, ...rates, ...rates].map((item, index) => (
                        <div key={`${item.currency}-${index}`} className="flex items-center gap-2 text-sm font-medium">
                            <span className="text-slate-400">{item.currency}</span>
                            <span className="text-white">{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(item.rate)}</span>
                            <span className="text-xs text-slate-500">TL</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    )
}
