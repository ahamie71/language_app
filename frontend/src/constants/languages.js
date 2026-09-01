// Langues supportées par l'application : nom affiché, drapeau et locale
// (pour la synthèse vocale du navigateur en repli de l'API TTS).
export const LANGUAGES = [
  { code: 'fr', name: 'Français',  flag: '🇫🇷', locale: 'fr-FR' },
  { code: 'en', name: 'Anglais',   flag: '🇬🇧', locale: 'en-US' },
  { code: 'es', name: 'Espagnol',  flag: '🇪🇸', locale: 'es-ES' },
  { code: 'de', name: 'Allemand',  flag: '🇩🇪', locale: 'de-DE' },
  { code: 'ar', name: 'Arabe',     flag: '🇸🇦', locale: 'ar-SA' },
  { code: 'it', name: 'Italien',   flag: '🇮🇹', locale: 'it-IT' },
  { code: 'pt', name: 'Portugais', flag: '🇵🇹', locale: 'pt-BR' },
  { code: 'zh', name: 'Chinois',   flag: '🇨🇳', locale: 'zh-CN' },
  { code: 'ja', name: 'Japonais',  flag: '🇯🇵', locale: 'ja-JP' },
]

export const LANG_NAMES = Object.fromEntries(LANGUAGES.map(l => [l.code, l.name]))
LANG_NAMES.us = 'Anglais' // alias legacy

export const LANG_LOCALE = Object.fromEntries(LANGUAGES.map(l => [l.code, l.locale]))
LANG_LOCALE.us = 'en-US'

export const LANG_FLAG = Object.fromEntries(LANGUAGES.map(l => [l.code, l.flag]))
