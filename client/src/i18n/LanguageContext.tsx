import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Language, translations } from './translations';

interface LanguageContextType {
  lang: Language;
  t: (key: string) => string;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ru',
  t: (key) => key,
  toggleLang: () => {},
});

export const useTranslation = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('lang');
    return (saved === 'ru' || saved === 'en') ? saved : 'ru';
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const t = useCallback((key: string): string => {
    return translations[lang][key] || key;
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang(prev => prev === 'ru' ? 'en' : 'ru');
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
};