import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem('optima_lang');
      return saved === 'en' || saved === 'es' ? saved : 'es';
    } catch (e) {
      return 'es';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('optima_lang', lang);
    } catch (e) {
      // silent
    }
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'es' ? 'en' : 'es'));
  };

  /**
   * Helper function to get translated text with safety fallbacks.
   * Usage: t('header', 'title')
   */
  const t = (section, key, fallback = '') => {
    if (!translations[lang] || !translations[lang][section] || translations[lang][section][key] === undefined) {
      // Fallback to Spanish or provided fallback
      if (translations.es?.[section]?.[key] !== undefined) {
        return translations.es[section][key];
      }
      return fallback || key;
    }
    return translations[lang][section][key];
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
