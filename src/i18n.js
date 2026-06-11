import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// import LanguageDetector from 'i18next-browser-languagedetector';

import translationKO from './locales/ko/translation.json';
import translationVI from './locales/vi/translation.json';
import translationEN from './locales/en/translation.json';
import translationZH from './locales/zh-CN/translation.json';

const resources = {
    ko: {
        translation: translationKO
    },
    vi: {
        translation: translationVI
    },
    en: {
        translation: translationEN
    },
    'zh-CN': {
        translation: translationZH
    }
};

i18n
    // .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'ko',
        lng: (typeof window !== "undefined" && localStorage.getItem('userLanguage')) || 'ko',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
