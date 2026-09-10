import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, RotateCcw, CheckCircle, XCircle, Loader2, Trophy } from 'lucide-react'
import { getDueVocabulary, updateWordProgress, recordActivity } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import BottomNav from '../components/BottomNav'
import TopNav from '../components/TopNav'

export default function Flashcards() {
  const navigate      = useNavigate()
  const { user }      = useAuth()
  const { t }         = useTranslation('flashcards')
  const [cards,       setCards]       = useState([])
  const [index,       setIndex]       = useState(0)
  const [flipped,     setFlipped]     = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [results,     setResults]     = useState([])  // { correct: bool }[]
  const [done,        setDone]        = useState(false)

  useEffect(() => {
    getDueVocabulary()
      .then(d => setCards(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [])

  const current = cards[index]

  const answer = async (correct) => {
    if (!current) return

    await updateWordProgress(current.id, correct)
    setResults(prev => [...prev, { correct, word: current.word }])

    if (index + 1 >= cards.length) {
      const score = results.filter(r => r.correct).length + (correct ? 1 : 0)
      await recordActivity('flashcard', score * 5)
      setDone(true)
    } else {
      setFlipped(false)
      setTimeout(() => setIndex(i => i + 1), 150)
    }
  }

  const restart = () => {
    setIndex(0)
    setFlipped(false)
    setResults([])
    setDone(false)
    setLoading(true)
    getDueVocabulary()
      .then(d => setCards(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-duo-gray font-duo">
      <div className="text-center">
        <span className="text-6xl block mb-4 animate-float">🃏</span>
        <p className="text-duo-muted font-bold">{t('loading')}</p>
      </div>
    </div>
  )

  if (cards.length === 0) return (
    <div className="min-h-screen bg-duo-gray font-duo pb-24 md:pb-8">
      <TopNav active="vocabulary" />
      <header className="bg-white border-b-2 border-duo-border sticky top-0 md:static z-20">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-duo-gray rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-duo-muted" />
          </button>
          <h1 className="text-xl font-black text-duo-text">{t('empty.title')}</h1>
        </div>
      </header>
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <Trophy size={48} className="text-duo-green mb-4" />
        <p className="font-extrabold text-duo-text text-lg mb-2">{t('empty.heading')}</p>
        <p className="text-duo-muted font-semibold text-sm mb-6">
          {t('empty.subtitle')}
        </p>
        <button onClick={() => navigate('/vocabulary')} className="duo-btn duo-btn-green px-8 py-3 text-sm">
          {t('empty.viewVocabulary')}
        </button>
      </div>
      <BottomNav active="vocabulary" />
    </div>
  )

  if (done) {
    const correct = results.filter(r => r.correct).length
    const pct     = Math.round((correct / results.length) * 100)
    return (
      <div className="min-h-screen bg-duo-gray font-duo pb-24 md:pb-8 flex flex-col">
        <TopNav active="vocabulary" />
        <header className="bg-white border-b-2 border-duo-border">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => navigate('/vocabulary')} className="p-2 hover:bg-duo-gray rounded-lg">
              <ChevronLeft size={20} className="text-duo-muted" />
            </button>
            <h1 className="text-xl font-black text-duo-text">{t('results.title')}</h1>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-24 h-24 rounded-full bg-duo-green flex items-center justify-center mb-6 shadow-lg">
            <Trophy size={40} className="text-duo-black" />
          </div>
          <h2 className="text-3xl font-black text-duo-text mb-1">{pct}%</h2>
          <p className="text-duo-muted font-semibold mb-2">{t('results.correctCount', { correct, total: results.length })}</p>
          <div className="w-full max-w-sm bg-duo-border rounded-full h-3 mb-8 overflow-hidden">
            <div className="h-full bg-duo-green rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>

          <div className="w-full max-w-sm space-y-2 mb-8">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${r.correct ? 'bg-duo-green-bg' : 'bg-duo-red-bg'}`}>
                {r.correct
                  ? <CheckCircle size={18} className="text-duo-green shrink-0" />
                  : <XCircle    size={18} className="text-duo-red shrink-0" />}
                <span className="font-bold text-sm text-duo-text">{r.word}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={restart} className="duo-btn bg-white border-2 border-duo-border text-duo-text px-6 py-3 text-sm">
              <RotateCcw size={16} /> {t('results.replay')}
            </button>
            <button onClick={() => navigate('/vocabulary')} className="duo-btn duo-btn-green px-6 py-3 text-sm">
              {t('results.finish')}
            </button>
          </div>
        </div>
        <BottomNav active="vocabulary" />
      </div>
    )
  }

  const progress = Math.round(((index) / cards.length) * 100)

  return (
    <div className="min-h-screen bg-duo-gray font-duo pb-24 md:pb-8">
      <TopNav active="vocabulary" />
      <header className="bg-white border-b-2 border-duo-border sticky top-0 md:static z-20">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-duo-gray rounded-lg transition-colors">
              <ChevronLeft size={20} className="text-duo-muted" />
            </button>
            <h1 className="text-xl font-black text-duo-text flex-1">{t('main.title')}</h1>
            <span className="text-sm font-extrabold text-duo-muted">{index + 1}/{cards.length}</span>
          </div>
          <div className="duo-progress">
            <div className="duo-progress-fill transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Flashcard */}
        <div
          onClick={() => setFlipped(f => !f)}
          className="cursor-pointer select-none"
          style={{ perspective: '1000px' }}
        >
          <div style={{
            position: 'relative',
            height: '280px',
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.4s ease',
          }}>
            {/* Front */}
            <div style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}
              className="bg-white rounded-2xl border-2 border-duo-border shadow-lg flex flex-col items-center justify-center p-8">
              <div className="text-xs font-extrabold text-duo-muted uppercase tracking-widest mb-4">
                {user?.target_language?.toUpperCase()} → {user?.native_language?.toUpperCase()}
              </div>
              <div className="text-4xl font-black text-duo-text mb-3">{current?.word}</div>
              <div className="text-duo-muted font-semibold text-sm">{current?.category}</div>
              <div className="mt-6 text-xs text-duo-light font-bold uppercase tracking-wide">{t('main.flipHint')}</div>
            </div>

            {/* Back */}
            <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', inset: 0 }}
              className="bg-duo-green rounded-2xl border-2 border-duo-green shadow-lg flex flex-col items-center justify-center p-8">
              <div className="text-xs font-extrabold text-duo-black opacity-70 uppercase tracking-widest mb-4">{t('main.translationLabel')}</div>
              <div className="text-4xl font-black text-duo-black mb-3">{current?.translation}</div>
              {current?.times_practiced > 0 && (
                <div className="text-duo-black opacity-70 text-sm font-semibold">
                  {t('main.successRate', { pct: Math.round((current.times_correct / current.times_practiced) * 100) })}
                </div>
              )}
            </div>
          </div>
        </div>

        {flipped && (
          <div className="mt-6 flex gap-4">
            <button onClick={() => answer(false)}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-4 border-duo-red bg-duo-red-bg text-duo-red font-extrabold text-base transition-all active:scale-95">
              <XCircle size={22} /> {t('main.dontKnow')}
            </button>
            <button onClick={() => answer(true)}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-4 border-duo-green bg-duo-green-bg text-duo-green font-extrabold text-base transition-all active:scale-95">
              <CheckCircle size={22} /> {t('main.knew')}
            </button>
          </div>
        )}

        {!flipped && (
          <p className="text-center text-duo-muted font-semibold text-sm mt-6">
            {t('main.thinkHint')}
          </p>
        )}

        {/* SRS info */}
        <div className="mt-6 duo-card">
          <div className="text-xs font-bold text-duo-muted">
            {t('main.srsPrefix')}<span className="text-duo-green font-extrabold">{t('main.srsValue', { count: current?.srs_interval || 1 })}</span>
          </div>
        </div>
      </div>

      <BottomNav active="vocabulary" />
    </div>
  )
}
