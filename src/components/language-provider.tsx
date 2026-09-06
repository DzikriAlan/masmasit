'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Lang = 'en' | 'id';

type LangContextValue = {
  lang: Lang;
  toggleLang: () => void;
  setLang: (l: Lang) => void;
  t: (en: string, id: string) => string;
};

const LangContext = createContext<LangContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? (localStorage.getItem('lang') as Lang | null) : null;
    if (stored === 'en' || stored === 'id') {
      setLangState(stored);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== 'undefined') localStorage.setItem('lang', l);
  };

  const toggleLang = () => setLang(lang === 'en' ? 'id' : 'en');

  const t = (en: string, id: string) => (lang === 'id' ? id : en);

  return (
    <LangContext.Provider value={{ lang, toggleLang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
