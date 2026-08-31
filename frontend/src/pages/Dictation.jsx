import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Mic, MicOff, Volume2, RefreshCw, Loader2, CheckCircle, PenLine } from 'lucide-react'
import { generateDictationText, transcribeAudio, checkPronunciation, recordActivity } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useSpeak } from '../hooks/useSpeak'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { scoreColorClass, scoreBgClass, scoreBarClass } from '../utils/stats'
import BottomNav from '../components/BottomNav'

const STEPS = { READY: 'ready', LISTENING: 'listening', RECORDING: 'recording', CHECKING: 'checking', RESULT: 'result' }

export default function Dictation() {
  const navigate       = useNavigate()
  const { user }       = useAuth()
  const speak          = useSpeak()
  const { isRecording, startRecording, stopRecording } = useAudioRecorder()
  const [step,         setStep]         = useState(STEPS.READY)
  const [dictText,     setDictText]     = useState('')
  const [userText,     setUserText]     = useState('')
  const [score,        setScore]        = useState(null)
  const [feedback,     setFeedback]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [showText,     setShowText]     = useState(false)

  const loadExercise = async () => {
    setLoading(true)
    setShowText(false)
    setUserText('')
    setScore(null)
    setFeedback('')
    try {
      const data = await generateDictationText(user?.target_language || 'en', user?.level || 'debutant')
      setDictText(data.text || '')
      setStep(STEPS.LISTENING)
    } catch {
      setDictText('Hello, my name is Alex. I like to learn new languages every day.')
      setStep(STEPS.LISTENING)
    } finally {
      setLoading(false)
    }
  }

  const playText = () => speak(dictText, user?.target_language || 'en')

  const handleStartRecording = async () => {
    try {
      await startRecording(async (blob) => {
        setStep(STEPS.CHECKING)
        try {
          const { text } = await transcribeAudio(blob, user?.target_language || 'en')
          setUserText(text || '')
          await checkAnswer(text || '')
        } catch {
          setStep(STEPS.LISTENING)
        }
      })
      setStep(STEPS.RECORDING)
    } catch {
      alert("Accès au microphone refusé.")
    }
  }

  const checkAnswer = async (text) => {
    try {
      const result = await checkPronunciation(dictText, text)
      setScore(result.score)
      setFeedback(result.feedback)
      await recordActivity('dictation', result.score >= 70 ? 15 : 5)
      setStep(STEPS.RESULT)
    } catch {
      setStep(STEPS.LISTENING)
    }
  }

  const submitManual = async () => {
    if (!userText.trim()) return
    setStep(STEPS.CHECKING)
    await checkAnswer(userText)
  }

  const scoreColor = scoreColorClass(score)
  const scoreBg    = scoreBgClass(score)

  return (
    <div className="min-h-screen bg-duo-gray font-duo pb-24">
      <header className="bg-white border-b-2 border-duo-border sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-duo-gray rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-duo-muted" />
          </button>
          <div>
            <h1 className="text-xl font-black text-duo-text">Mode Dictée</h1>
            <p className="text-xs text-duo-muted font-semibold">Écoute → Écris → Vérife</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* READY */}
        {step === STEPS.READY && (
          <div className="text-center py-12">
            <PenLine size={56} className="text-duo-green mx-auto mb-4" />
            <h2 className="text-2xl font-black text-duo-text mb-2">Mode Dictée</h2>
            <p className="text-duo-muted font-semibold text-sm mb-8 max-w-xs mx-auto">
              L'IA génère un texte, le lit à voix haute, et tu dois l'écrire ou le répéter.
            </p>
            <button onClick={loadExercise} disabled={loading}
              className="duo-btn duo-btn-green px-10 py-4 text-base">
              {loading ? <Loader2 size={20} className="animate-spin" /> : null}
              Commencer la dictée
            </button>
          </div>
        )}

        {/* LISTENING */}
        {step === STEPS.LISTENING && (
          <>
            <div className="duo-card border-2 border-duo-blue bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <Volume2 size={18} className="text-duo-blue" />
                <span className="font-extrabold text-duo-blue text-sm uppercase tracking-wide">Écoute attentivement</span>
              </div>
              <button onClick={playText}
                className="w-full py-4 bg-duo-blue text-white font-extrabold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <Volume2 size={20} /> Écouter le texte
              </button>
              <button onClick={() => setShowText(v => !v)}
                className="w-full mt-2 py-2 text-duo-muted font-bold text-sm hover:text-duo-text transition-colors">
                {showText ? 'Masquer le texte' : 'Voir le texte (aide)'}
              </button>
              {showText && (
                <div className="mt-2 p-3 bg-white rounded-xl border border-duo-border text-duo-text font-semibold text-sm leading-relaxed">
                  {dictText}
                </div>
              )}
            </div>

            <div className="duo-card">
              <p className="font-extrabold text-duo-text mb-3">Ta réponse :</p>
              <textarea
                className="duo-input min-h-[100px] resize-none"
                placeholder="Écris ici ce que tu as entendu..."
                value={userText}
                onChange={e => setUserText(e.target.value)}
              />
              <div className="flex gap-3 mt-3">
                <button onClick={handleStartRecording}
                  className="flex-1 py-3 bg-duo-orange text-white font-extrabold rounded-xl flex items-center justify-center gap-2 hover:opacity-90">
                  <Mic size={18} /> Dicter avec micro
                </button>
                <button onClick={submitManual} disabled={!userText.trim()}
                  className="flex-1 duo-btn duo-btn-green py-3 text-sm disabled:opacity-40">
                  Vérifier →
                </button>
              </div>
            </div>
          </>
        )}

        {/* RECORDING */}
        {step === STEPS.RECORDING && (
          <div className="text-center py-12">
            <div className="w-24 h-24 rounded-full bg-duo-red flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Mic size={40} className="text-white" />
            </div>
            <p className="font-extrabold text-duo-text text-xl mb-2">Enregistrement en cours...</p>
            <p className="text-duo-muted font-semibold text-sm mb-8">Parle clairement dans le microphone</p>
            <button onClick={stopRecording}
              className="duo-btn bg-white border-2 border-duo-red text-duo-red px-10 py-4">
              <MicOff size={18} /> Arrêter
            </button>
          </div>
        )}

        {/* CHECKING */}
        {step === STEPS.CHECKING && (
          <div className="text-center py-16">
            <Loader2 size={40} className="animate-spin text-duo-green mx-auto mb-4" />
            <p className="font-extrabold text-duo-text">Analyse en cours...</p>
          </div>
        )}

        {/* RESULT */}
        {step === STEPS.RESULT && (
          <>
            <div className={`duo-card border-2 ${scoreBg}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="font-extrabold text-duo-text text-lg">Score</span>
                <span className={`text-4xl font-black ${scoreColor}`}>{score}/100</span>
              </div>
              <div className="duo-progress mb-4">
                <div className={`h-full rounded-full transition-all duration-700 ${scoreBarClass(score)}`}
                  style={{ width: `${score}%` }} />
              </div>
              <p className="text-duo-text font-semibold text-sm">{feedback}</p>
            </div>

            <div className="duo-card">
              <p className="font-extrabold text-duo-muted text-xs uppercase tracking-wide mb-2">Texte original</p>
              <p className="text-duo-text font-semibold text-sm leading-relaxed mb-4">{dictText}</p>
              <p className="font-extrabold text-duo-muted text-xs uppercase tracking-wide mb-2">Ta réponse</p>
              <p className="text-duo-text font-semibold text-sm leading-relaxed">{userText || '(aucune réponse)'}</p>
            </div>

            <div className="flex gap-3">
              <button onClick={loadExercise}
                className="flex-1 duo-btn bg-white border-2 border-duo-border text-duo-text py-3 text-sm">
                <RefreshCw size={16} /> Nouvel exercice
              </button>
              <button onClick={() => navigate('/exercises')}
                className="flex-1 duo-btn duo-btn-green py-3 text-sm">
                <CheckCircle size={16} /> Terminer
              </button>
            </div>
          </>
        )}
      </div>

      <BottomNav active="exercises" />
    </div>
  )
}
