import { speakText } from '../services/api'
import { LANG_LOCALE } from '../constants/languages'

/** 3.3.3 — Lecture à voix haute : API TTS, avec repli sur la synthèse vocale du navigateur. */
export function useSpeak() {
  return async function speak(text, lang) {
    try {
      const blob = await speakText(text, lang)
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => URL.revokeObjectURL(url)
      audio.play()
    } catch {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = LANG_LOCALE[lang] || 'en-US'
        utterance.rate = 0.85
        window.speechSynthesis.speak(utterance)
      }
    }
  }
}
