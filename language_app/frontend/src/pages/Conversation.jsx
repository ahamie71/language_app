import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  X, Volume2, ChevronDown, ChevronUp, Sparkles,
  Mic, MicOff, Send, Loader2, Brain, BookOpen
} from 'lucide-react'
import { getMessages, processMessage, transcribeAudio, speakText } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const LANG_LOCALE = {
  fr:'fr-FR', en:'en-US', us:'en-US', es:'es-ES', de:'de-DE',
  ar:'ar-SA', it:'it-IT', pt:'pt-BR', zh:'zh-CN', ja:'ja-JP',
}
const LANG_NAMES = {
  fr:'Français', en:'Anglais', us:'Anglais', es:'Espagnol', de:'Allemand',
  ar:'Arabe', it:'Italien', pt:'Portugais', zh:'Chinois', ja:'Japonais',
}

export default function Conversation() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuth()

  const [messages,       setMessages]       = useState([])
  const [input,          setInput]          = useState('')
  const [sending,        setSending]        = useState(false)
  const [initLoading,    setInitLoading]    = useState(true)
  const [openExp,        setOpenExp]        = useState(null)
  const [isRecording,    setIsRecording]    = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [canRecord,      setCanRecord]      = useState(false)
  const [xpGained,       setXpGained]      = useState(0)

  const bottomRef        = useRef(null)
  const inputRef         = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef   = useRef([])

  const msgCount = messages.filter(m => m.role === 'user').length
  const GOAL     = 5
  const progress = Math.min(100, Math.round((msgCount / GOAL) * 100))

  /* ── Init ── */
  useEffect(() => {
    getMessages(id)
      .then(d => setMessages(Array.isArray(d) ? d : []))
      .finally(() => setInitLoading(false))

    if (navigator.mediaDevices && window.MediaRecorder) {
      setCanRecord(true)
    }
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  /* ── Send ── */
  const handleSend = async () => {
    if (!input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)
    inputRef.current?.focus()
    try {
      const res = await processMessage({ conversation_id: parseInt(id), original_text: text })
      setMessages(prev => [...prev, res.userMessage, { ...res.assistantMessage, role: 'assistant' }])
      setXpGained(prev => prev + 10)
    } catch (e) { console.error(e) }
    setSending(false)
  }

  /* ── 3.3.1 Mic — enregistrement + Whisper ── */
  const toggleMic = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []

      recorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setIsRecording(false)
        setIsTranscribing(true)
        try {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          const result = await transcribeAudio(blob)
          if (result.text) setInput(result.text)
        } catch (e) {
          console.error('Transcription error:', e)
        }
        setIsTranscribing(false)
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (e) {
      console.error('Mic access denied:', e)
    }
  }

  /* ── 3.3.3 TTS — OpenAI TTS avec fallback navigateur ── */
  const speak = async (text, lang) => {
    try {
      const blob = await speakText(text, lang)
      const url  = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => URL.revokeObjectURL(url)
      audio.play()
    } catch {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)
        u.lang = LANG_LOCALE[lang] || 'en-US'; u.rate = 0.85
        window.speechSynthesis.speak(u)
      }
    }
  }

  if (initLoading) return (
    <div className="flex items-center justify-center h-screen bg-duo-gray font-duo">
      <div className="text-center">
        <span className="text-6xl block mb-4 animate-float">🦉</span>
        <p className="text-duo-muted font-bold">Chargement de la leçon...</p>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col bg-duo-gray font-duo">

      {/* ── Lesson header ─────────────────────────────────────────────── */}
      <header className="bg-white border-b-2 border-duo-border shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4 mb-3">
            <button onClick={() => navigate('/dashboard')}
              className="p-1.5 text-duo-muted hover:text-duo-red transition-colors rounded-lg">
              <X size={22} />
            </button>
            {/* Progress bar */}
            <div className="flex-1 duo-progress h-5">
              <div className="duo-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            {/* XP gain */}
            {xpGained > 0 && (
              <div className="flex items-center gap-1 text-duo-yellow font-extrabold text-sm animate-bounce-in">
                ⚡ +{xpGained} XP
              </div>
            )}
          </div>
          {/* Lesson info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-duo-purple-bg rounded-duo-sm flex items-center justify-center shrink-0">
              <Brain size={20} className="text-duo-purple" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-duo-text">
                Conversation IA — Coach Lingua
              </div>
              <div className="text-xs text-duo-muted font-semibold">
                {LANG_NAMES[user?.native_language]} → {LANG_NAMES[user?.target_language]}
                &nbsp;•&nbsp; Objectif : {GOAL} échanges
              </div>
            </div>
            <Link to="/vocabulary" className="ml-auto p-2 text-duo-muted hover:text-duo-blue transition-colors" title="Mon vocabulaire">
              <BookOpen size={19} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Messages ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

          {/* Empty / welcome */}
          {messages.length === 0 && !sending && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
              <span className="text-7xl animate-float block">🦉</span>
              <div className="duo-card max-w-sm">
                <p className="font-extrabold text-duo-text mb-1">Commencez la conversation !</p>
                <p className="text-duo-muted text-sm font-semibold">
                  Parlez en <strong className="text-duo-blue">{LANG_NAMES[user?.native_language]}</strong> — votre coach IA répond en <strong className="text-duo-green">{LANG_NAMES[user?.target_language]}</strong> et explique tout.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            const expKey = msg.id ?? i
            return (
              <div key={expKey} className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-lg">
                  {isUser ? '🧑‍🎓' : '🦉'}
                </div>

                <div className={`flex flex-col gap-1.5 max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Bubble */}
                  <div className={`rounded-duo-lg px-4 py-3 ${
                    isUser
                      ? 'bg-duo-blue text-white rounded-br-sm'
                      : 'bg-white border-2 border-duo-border text-duo-text rounded-bl-sm'
                  }`}>
                    <p className="font-semibold text-sm leading-relaxed">{msg.original_text}</p>

                    {/* Translation */}
                    {msg.translated_text && (
                      <div className={`mt-2 pt-2 border-t text-xs font-semibold ${
                        isUser ? 'border-blue-400 text-blue-100' : 'border-duo-border text-duo-muted'
                      }`}>
                        <span className="font-extrabold opacity-70">Traduction IA : </span>
                        {msg.translated_text}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => speak(msg.original_text, isUser ? user?.native_language : user?.target_language)}
                        className={`p-1.5 rounded-lg transition-all ${isUser ? 'hover:bg-blue-500' : 'hover:bg-duo-gray'}`}
                        title="Écouter">
                        <Volume2 size={13} className={isUser ? 'text-blue-200' : 'text-duo-muted'} />
                      </button>
                      {!isUser && msg.explanation && (
                        <button onClick={() => setOpenExp(openExp === expKey ? null : expKey)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold transition-all ${
                            openExp === expKey ? 'bg-duo-purple text-white' : 'bg-duo-purple-bg text-duo-purple'
                          }`}>
                          {openExp === expKey ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          EXPLICATION IA
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Explanation panel */}
                  {!isUser && msg.explanation && openExp === expKey && (
                    <div className="bg-duo-purple-bg border-2 border-purple-200 rounded-duo p-4 text-sm text-duo-text animate-slide-up w-full max-w-full">
                      <div className="flex items-center gap-2 font-extrabold text-duo-purple mb-2">
                        <Sparkles size={14} /> Analyse de votre coach IA
                      </div>
                      <p className="font-semibold leading-relaxed text-duo-muted">{msg.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Typing indicator */}
          {sending && (
            <div className="flex items-end gap-2">
              <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-lg">🦉</div>
              <div className="bg-white border-2 border-duo-border rounded-duo-lg rounded-bl-sm px-4 py-3.5">
                <div className="flex items-center gap-1.5">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          {/* Goal reached banner */}
          {msgCount >= GOAL && (
            <div className="duo-card border-duo-yellow border-2 bg-duo-yellow-bg text-center animate-bounce-in">
              <div className="text-4xl mb-2">🎉</div>
              <div className="font-extrabold text-duo-text">Objectif atteint !</div>
              <div className="text-duo-muted text-sm font-semibold">Vous avez complété {GOAL} échanges avec votre coach IA</div>
              <div className="flex justify-center gap-1 mt-2">
                <span className="duo-badge bg-duo-yellow text-duo-text border border-yellow-300">
                  ⚡ +{msgCount * 10} XP gagnés
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input bar ─────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-t-2 border-duo-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2">
            {/* 3.3.1 Mic */}
            {canRecord && (
              <button onClick={toggleMic} disabled={sending || isTranscribing}
                className={`shrink-0 w-12 h-12 rounded-duo-sm border-b-4 flex items-center justify-center transition-all active:translate-y-0.5 active:border-b-0 ${
                  isRecording
                    ? 'bg-duo-red border-duo-red-d animate-pulse'
                    : isTranscribing
                    ? 'bg-duo-yellow border-yellow-400 animate-pulse'
                    : 'bg-duo-gray border-duo-border text-duo-muted hover:bg-duo-border'
                }`}>
                {isTranscribing
                  ? <Loader2 size={19} className="animate-spin text-white" />
                  : isRecording
                  ? <MicOff size={19} className="text-white" />
                  : <Mic size={19} />}
              </button>
            )}

            {/* Textarea */}
            <textarea
              ref={inputRef} rows={1}
              placeholder={`Parlez en ${LANG_NAMES[user?.native_language] || 'français'}…`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              disabled={sending}
              style={{ maxHeight: '100px', overflowY: 'auto', resize: 'none' }}
              className="flex-1 bg-duo-gray border-2 border-duo-border rounded-duo px-4 py-3 text-sm font-semibold text-duo-text focus:outline-none focus:border-duo-blue transition-colors"
            />

            {/* Send */}
            <button onClick={handleSend} disabled={sending || !input.trim()}
              className="duo-btn duo-btn-green shrink-0 w-12 h-12 px-0 py-0 rounded-duo-sm">
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <p className="text-center text-duo-light text-xs font-semibold mt-2">
            Entrée pour envoyer • Shift+Entrée pour un saut de ligne
          </p>
        </div>
      </div>
    </div>
  )
}
