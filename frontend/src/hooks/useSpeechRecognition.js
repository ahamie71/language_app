import { useRef, useState } from 'react'

/** Dictée en direct via l'API navigateur (Chrome/Edge) — texte affiché au
 * fur et à mesure qu'on parle, comme au clavier. Pas de support Firefox/
 * Safari : `supported` retombe alors sur le flux MediaRecorder + Vosk. */
export function useSpeechRecognition() {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  const SpeechRecognitionApi = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null
  const supported = !!SpeechRecognitionApi

  const start = (lang, onTranscript) => {
    if (!supported || recognitionRef.current) return

    const recognition = new SpeechRecognitionApi()
    recognition.lang = lang || 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let text = ''
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript
      }
      onTranscript(text.trim(), event.results[event.results.length - 1].isFinal)
    }

    recognition.onerror = () => { recognition.stop() }
    recognition.onend = () => { recognitionRef.current = null; setListening(false) }

    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
  }

  const stop = () => {
    recognitionRef.current?.stop()
  }

  return { supported, listening, start, stop }
}
