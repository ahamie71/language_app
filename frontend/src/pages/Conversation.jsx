import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  X, Volume2, ChevronDown, ChevronUp, Sparkles,
  Mic, MicOff, Send, Loader2, Brain, BookOpen, Zap, PartyPopper, Bot, User
} from 'lucide-react'
import { getMessages, processMessageStream, transcribeAudio } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useSpeak } from '../hooks/useSpeak'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { LANG_NAMES, LANG_LOCALE } from '../constants/languages'

export default function Conversation() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const speak      = useSpeak()
  const { isRecording, startRecording, stopRecording } = useAudioRecorder()
  const speech     = useSpeechRecognition()

  const [messages,       setMessages]       = useState([])
  const [input,          setInput]          = useState('')
  const [sending,        setSending]        = useState(false)
  const [awaitingReply,  setAwaitingReply]  = useState(false)
  const [initLoading,    setInitLoading]    = useState(true)
  const [openExp,        setOpenExp]        = useState(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [canRecord,      setCanRecord]      = useState(false)
  const [xpGained,       setXpGained]      = useState(0)

  const bottomRef        = useRef(null)
  const inputRef         = useRef(null)

  const msgCount = messages.filter(m => m.role === 'user').length
  const GOAL     = 20
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

  /* ── Send — SSE : la réponse du coach arrive dès qu'elle est prête,
     traduction et explication se complètent ensuite au fil de l'eau ── */
  const handleSend = async () => {
    if (!input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)
    setAwaitingReply(true)
    inputRef.current?.focus()

    const tempId = `tmp-${Date.now()}`

    try {
      await processMessageStream(
        { conversation_id: parseInt(id), original_text: text },
        ({ event, data }) => {
          if (event === 'user_message') {
            setMessages(prev => [...prev, data])
          } else if (event === 'reply') {
            setAwaitingReply(false)
            setMessages(prev => [...prev, {
              id: tempId, role: 'assistant',
              original_text: data.text, translated_text: null, explanation: null,
            }])
            setXpGained(prev => prev + 10)
          } else if (event === 'translation') {
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, translated_text: data.text } : m))
          } else if (event === 'explanation') {
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, explanation: data.text } : m))
          } else if (event === 'done') {
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id } : m))
            setSending(false)
          } else if (event === 'error') {
            console.error(event, data.error)
            setSending(false)
            setAwaitingReply(false)
          }
        }
      )
    } catch (e) { console.error(e) }
    setSending(false)
    setAwaitingReply(false)
  }

  /* ── 3.3.1 Mic — dictée en direct (Web Speech API), avec repli
     enregistrement + transcription Vosk si le navigateur ne la supporte pas ── */
  const toggleMic = async () => {
    if (speech.supported) {
      if (speech.listening) { speech.stop(); return }
      speech.start(LANG_LOCALE[user?.native_language] || 'fr-FR', (text) => setInput(text))
      return
    }
    if (isRecording) {
      stopRecording()
      return
    }
    try {
      await startRecording(async (blob) => {
        setIsTranscribing(true)
        try {
          const result = await transcribeAudio(blob, user?.native_language || 'en')
          if (result.text) setInput(result.text)
        } catch (e) {
          console.error('Transcription error:', e)
        }
        setIsTranscribing(false)
      })
    } catch (e) {
      console.error('Mic access denied:', e)
    }
  }

  if (initLoading) return (
    <div className="flex items-center justify-center h-screen bg-duo-gray font-duo">
      <div className="text-center">
        <Bot size={48} className="text-duo-green mx-auto mb-4 animate-float" />
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
                <Zap size={14} /> +{xpGained} XP
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
              <Bot size={56} className="text-duo-green animate-float" />
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
                <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${isUser ? 'bg-duo-blue-bg text-duo-blue' : 'bg-duo-green-bg text-duo-green'}`}>
                  {isUser ? <User size={17} /> : <Bot size={17} />}
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
          {awaitingReply && (
            <div className="flex items-end gap-2">
              <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-duo-green-bg text-duo-green">
                <Bot size={17} />
              </div>
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
              <PartyPopper size={36} className="text-duo-orange mx-auto mb-2" />
              <div className="font-extrabold text-duo-text">Objectif atteint !</div>
              <div className="text-duo-muted text-sm font-semibold">Vous avez complété {GOAL} échanges avec votre coach IA</div>
              <div className="flex justify-center gap-1 mt-2">
                <span className="duo-badge bg-duo-yellow text-duo-text border border-yellow-300">
                  <Zap size={12} /> +{msgCount * 10} XP gagnés
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
            {(canRecord || speech.supported) && (
              <button onClick={toggleMic} disabled={sending || isTranscribing}
                className={`shrink-0 w-12 h-12 rounded-duo-sm border-b-4 flex items-center justify-center transition-all active:translate-y-0.5 active:border-b-0 ${
                  (isRecording || speech.listening)
                    ? 'bg-duo-red border-duo-red-d animate-pulse'
                    : isTranscribing
                    ? 'bg-duo-yellow border-yellow-400 animate-pulse'
                    : 'bg-duo-gray border-duo-border text-duo-muted hover:bg-duo-border'
                }`}>
                {isTranscribing
                  ? <Loader2 size={19} className="animate-spin text-white" />
                  : (isRecording || speech.listening)
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
