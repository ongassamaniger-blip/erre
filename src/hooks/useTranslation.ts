import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { tr } from '@/locales/tr'
import { en } from '@/locales/en'

type Language = 'tr' | 'en'

interface TranslationState {
    language: Language
    setLanguage: (lang: Language) => void
}

export const useTranslationStore = create<TranslationState>()(
    persist(
        (set) => ({
            language: 'tr',
            setLanguage: (lang) => {
                set({ language: lang })
                // Refresh the page to apply language changes everywhere
                setTimeout(() => window.location.reload(), 100)
            },
        }),
        {
            name: 'translation-storage',
        }
    )
)

const translations = {
    tr,
    en,
}

export function useTranslation() {
    const { language, setLanguage } = useTranslationStore()

    const t = (key: string) => {
        const currentDict = (translations[language] || translations['tr']) as Record<string, string>
        return currentDict?.[key] || key
    }

    // Legacy support for async translate function, now synchronous but keeps signature if needed
    // or we can remove it. The original code had it.
    // Let's keep a simple version that just returns the translated string.
    const translate = (text: string, targetLang: string) => {
        // This is a dummy implementation to satisfy the interface if used elsewhere.
        // In the new system, we just change the global language.
        // If we need to translate a specific text to a specific language:
        const targetDict = translations[targetLang as Language] as Record<string, string>
        return targetDict?.[text] || text
    }

    return { t, language, setLanguage, translate }
}
