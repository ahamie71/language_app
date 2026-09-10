// Langues supportées par l'application : nom affiché, drapeau et locale
// (pour la synthèse vocale du navigateur en repli de l'API TTS).
// flagCode : code pays ISO 3166-1 alpha-2 (lowercase) pour la lib flag-icons
// (@import 'flag-icons/css/flag-icons.min.css' dans index.css), utilisé via
// <span className={`fi fi-${flagCode}`} />. Les emoji de drapeaux ne sont pas
// fiables sous Windows (Segoe UI Emoji affiche le code pays en lettres au lieu
// du drapeau), d'où le recours à flag-icons partout hors des <option> natives.
export const LANGUAGES = [
  { code: 'fr', name: 'Français',  flag: '🇫🇷', flagCode: 'fr', locale: 'fr-FR' },
  { code: 'en', name: 'Anglais',   flag: '🇬🇧', flagCode: 'gb', locale: 'en-US' },
  { code: 'es', name: 'Espagnol',  flag: '🇪🇸', flagCode: 'es', locale: 'es-ES' },
  { code: 'de', name: 'Allemand',  flag: '🇩🇪', flagCode: 'de', locale: 'de-DE' },
  { code: 'ar', name: 'Arabe',     flag: '🇸🇦', flagCode: 'sa', locale: 'ar-SA' },
  { code: 'it', name: 'Italien',   flag: '🇮🇹', flagCode: 'it', locale: 'it-IT' },
  { code: 'pt', name: 'Portugais', flag: '🇵🇹', flagCode: 'pt', locale: 'pt-BR' },
  { code: 'zh', name: 'Chinois',   flag: '🇨🇳', flagCode: 'cn', locale: 'zh-CN' },
  { code: 'ja', name: 'Japonais',  flag: '🇯🇵', flagCode: 'jp', locale: 'ja-JP' },
]

export const LANG_NAMES = Object.fromEntries(LANGUAGES.map(l => [l.code, l.name]))
LANG_NAMES.us = 'Anglais' // alias legacy

export const LANG_LOCALE = Object.fromEntries(LANGUAGES.map(l => [l.code, l.locale]))
LANG_LOCALE.us = 'en-US'

export const LANG_FLAG = Object.fromEntries(LANGUAGES.map(l => [l.code, l.flag]))

// Nom de la langue affiché selon la langue du SITE (pas la langue apprise) —
// ex. code 'en' affiche "Anglais" en site FR, "English" en site EN. `t` vient
// de useTranslation() (n'importe quel namespace, la clé est préfixée `common:`).
export const translatedLanguageName = (t, code) => {
  if (!code) return ''
  const key = code === 'us' ? 'en' : code
  return t(`common:languageNames.${key}`, { defaultValue: LANG_NAMES[code] || code })
}
