import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import frTranslations from '../../public/locales/fr/translation.json';
import arTranslations from '../../public/locales/ar/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: {
        translation: frTranslations,
      },
      ar: {
        translation: arTranslations,
      },
    },
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'ar'],
    debug: false,

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
