import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Un namespace i18next par page (locales/{lng}/<namespace>.json). Le glob Vite
// ramasse automatiquement tout nouveau fichier de traduction sans jamais avoir
// à retoucher ce fichier — évite les collisions quand plusieurs pages sont
// traduites en parallèle.
const frModules = import.meta.glob('./locales/fr/*.json', { eager: true })
const enModules = import.meta.glob('./locales/en/*.json', { eager: true })

function buildNamespaces(modules) {
  const namespaces = {}
  for (const path in modules) {
    const [, name] = path.match(/([^/]+)\.json$/)
    namespaces[name] = modules[path].default
  }
  return namespaces
}

i18n.use(initReactI18next).init({
  resources: {
    fr: buildNamespaces(frModules),
    en: buildNamespaces(enModules),
  },
  lng: localStorage.getItem('siteLang') || 'fr',
  fallbackLng: 'fr',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
})

export const setSiteLanguage = (code) => {
  i18n.changeLanguage(code)
  localStorage.setItem('siteLang', code)
}

export default i18n
