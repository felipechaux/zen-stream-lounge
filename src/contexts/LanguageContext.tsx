'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { translations, type Language, type TranslationKey } from '@/lib/translations'

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => translations.en[key],
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es')

  useEffect(() => {
    const saved = localStorage.getItem('zsl-lang') as Language | null
    if (saved === 'en' || saved === 'es') setLanguageState(saved)
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('zsl-lang', lang)
  }, [])

  const t = useCallback((key: TranslationKey) => translations[language][key], [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
