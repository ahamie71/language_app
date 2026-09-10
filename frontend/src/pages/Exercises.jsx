import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle, XCircle, Loader2, RotateCcw, Zap, ChevronRight,
  Trophy, BookOpen, Sparkles, Flame, Target, Plane, Utensils,
  Users, Briefcase, GraduationCap, MessageCircle, Brain, Award,
  TrendingUp, X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { generateExercise, getVocabulary, updateWordProgress } from '../services/api'
import BottomNav from '../components/BottomNav'
import TopNav from '../components/TopNav'
import { translatedLanguageName } from '../constants/languages'

const TOPICS = [
  { key: 'general', value: 'general vocabulary and greetings', Icon: MessageCircle },
  { key: 'travel',  value: 'travel and transportation',        Icon: Plane         },
  { key: 'food',    value: 'food and restaurant',              Icon: Utensils      },
  { key: 'family',  value: 'family and relationships',         Icon: Users         },
  { key: 'work',    value: 'work and professions',             Icon: Briefcase     },
  { key: 'grammar', value: 'grammar and sentence structure',   Icon: GraduationCap },
]

const ROUND_SIZE = 5
const OPTION_LETTERS = ['A', 'B', 'C', 'D']

function buildVocabExercise(words, usedIds, t) {
  const pool = words.filter(w => !usedIds.includes(w.id))
  if (pool.length === 0) return null
  const notMastered = pool.filter(w => !w.mastered)
  const target = notMastered.length > 0
    ? notMastered[Math.floor(Math.random() * notMastered.length)]
    : pool[Math.floor(Math.random() * pool.length)]
  const others = words.filter(w => w.id !== target.id)
  const wrong  = [...others].sort(() => Math.random() - 0.5).slice(0, 3)
  const options = [...wrong.map(w => w.translation), target.translation].sort(() => Math.random() - 0.5)
  return {
    question:    t('vocabExercise.question', { word: target.word }),
    options,
    correct:     options.indexOf(target.translation),
    explanation: t('vocabExercise.explanation', { word: target.word, translation: target.translation }),
    wordId:      target.id,
  }
}

function ScoreRing({ pct, score, total }) {
  const r = 54, c = 2 * Math.PI * r
  const dash = (pct / 100) * c
  const color = pct === 100 ? '#f59e0b' : pct >= 60 ? '#58cc02' : '#1cb0f6'
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color}
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-gray-800">{score}</span>
        <span className="text-xs font-bold text-gray-400">/ {total}</span>
      </div>
    </div>
  )
}

export default function Exercises() {
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const { t }     = useTranslation('exercises')

  const [mode,       setMode]       = useState(null)
  const [topic,      setTopic]      = useState(TOPICS[0])
  const [phase,      setPhase]      = useState('pick')
  const [exercise,   setExercise]   = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [selected,   setSelected]   = useState(null)
  const [answered,   setAnswered]   = useState(false)
  const [score,      setScore]      = useState(0)
  const [round,      setRound]      = useState(0)
  const [xp,         setXp]         = useState(0)
  const [combo,      setCombo]      = useState(0)
  const [vocabWords, setVocabWords] = useState([])
  const [usedIds,    setUsedIds]    = useState([])
  const [vocabError, setVocabError] = useState('')
  const [shake,      setShake]      = useState(false)
  const [pop,        setPop]        = useState(false)

  useEffect(() => {
    if (mode === 'vocab') {
      setLoading(true)
      getVocabulary()
        .then(d => {
          const words = Array.isArray(d) ? d : []
          setVocabWords(words)
          setVocabError(words.length < 4
            ? t('vocabError.notEnoughWords', { count: words.length })
            : '')
        })
        .finally(() => setLoading(false))
    }
  }, [mode])

  const fetchNext = async () => {
    setLoading(true); setSelected(null); setAnswered(false); setExercise(null)
    if (mode === 'vocab') {
      const ex = buildVocabExercise(vocabWords, usedIds, t)
      if (ex) { setUsedIds(prev => [...prev, ex.wordId]); setExercise(ex) }
      setLoading(false)
    } else {
      try {
        const data = await generateExercise(user?.target_language || 'en', user?.level || 'debutant', topic.value)
        setExercise(data)
      } catch {
        setExercise({
          question: t('fallbackExercise.question'),
          options: ["Hola", "Adiós", "Gracias", "Por favor"],
          correct: 0,
          explanation: t('fallbackExercise.explanation'),
        })
      }
      setLoading(false)
    }
  }

  const startRound = async () => {
    setScore(0); setRound(0); setXp(0); setCombo(0); setUsedIds([])
    setPhase('playing')
    await fetchNext()
  }

  const handleAnswer = async (idx) => {
    if (answered) return
    setSelected(idx); setAnswered(true)
    const isCorrect = idx === exercise.correct
    if (isCorrect) {
      setScore(s => s + 1)
      setCombo(c => c + 1)
      setXp(x => x + (combo >= 2 ? 25 : 15))
      setPop(true); setTimeout(() => setPop(false), 500)
    } else {
      setCombo(0)
      setShake(true); setTimeout(() => setShake(false), 500)
    }
    if (mode === 'vocab' && exercise.wordId) {
      try { await updateWordProgress(exercise.wordId, isCorrect) } catch {}
    }
  }

  const handleNext = async () => {
    const next = round + 1
    if (next >= ROUND_SIZE) { setPhase('result'); return }
    setRound(next)
    await fetchNext()
  }

  /* ════ ÉCRAN 0 — Choix du mode ════════════════════════════════════════ */
  if (!mode) return (
    <div className="min-h-screen font-duo pb-24 md:pb-8"
      style={{ background: 'linear-gradient(160deg,#f0f9ff 0%,#faf5ff 50%,#f0fdf4 100%)' }}>

      <TopNav active="exercises" />

      <div className="max-w-lg mx-auto px-5 pt-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
              <Target size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-800">{t('modeSelect.title')}</h1>
          </div>
          <p className="text-gray-400 font-semibold text-sm pl-[52px]">
            {t('modeSelect.subtitle')}<span className="text-purple-500 font-extrabold">{translatedLanguageName(t, user?.target_language)}</span>
          </p>
        </div>

        <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">
          {t('modeSelect.selectMode')}
        </p>

        {/* Mode Vocabulaire */}
        <button onClick={() => setMode('vocab')}
          className="w-full mb-4 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 text-left"
          style={{ background: 'linear-gradient(135deg,#1cb0f6,#0e8fcf)' }}>
          <div className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <BookOpen size={26} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="font-black text-white text-lg leading-tight">{t('modes.vocab.title')}</div>
              <div className="text-blue-100 text-sm font-semibold mt-0.5">
                {t('modes.vocab.subtitle')}
              </div>
            </div>
            <ChevronRight className="text-white/60" size={20} />
          </div>
          <div className="px-5 pb-4 flex gap-2">
            <span className="bg-white/15 text-white text-xs font-bold px-2.5 py-1 rounded-lg">{t('modes.vocab.tag1')}</span>
            <span className="bg-white/15 text-white text-xs font-bold px-2.5 py-1 rounded-lg">{t('modes.vocab.tag2')}</span>
          </div>
        </button>

        {/* Mode Thèmes IA */}
        <button onClick={() => setMode('theme')}
          className="w-full rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 text-left"
          style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
          <div className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Brain size={26} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="font-black text-white text-lg leading-tight">{t('modes.theme.title')}</div>
              <div className="text-purple-100 text-sm font-semibold mt-0.5">
                {t('modes.theme.subtitle')}
              </div>
            </div>
            <ChevronRight className="text-white/60" size={20} />
          </div>
          <div className="px-5 pb-4 flex gap-2">
            <span className="bg-white/15 text-white text-xs font-bold px-2.5 py-1 rounded-lg">{t('modes.theme.tag1')}</span>
            <span className="bg-white/15 text-white text-xs font-bold px-2.5 py-1 rounded-lg">{t('modes.theme.tag2')}</span>
          </div>
        </button>
      </div>

      <BottomNav active="exercises" />
    </div>
  )

  /* ════ ÉCRAN 1 — Config ══════════════════════════════════════════════ */
  if (phase === 'pick') return (
    <div className="min-h-screen font-duo pb-24 md:pb-8"
      style={{ background: 'linear-gradient(160deg,#f0f9ff 0%,#faf5ff 50%,#f0fdf4 100%)' }}>

      <TopNav active="exercises" />

      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 md:static z-30">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <button onClick={() => setMode(null)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            <X size={16} />
          </button>
          <div>
            <h1 className="font-black text-gray-800 text-base leading-none">
              {mode === 'vocab' ? t('modes.vocab.title') : t('modes.theme.title')}
            </h1>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">{translatedLanguageName(t, user?.target_language)}</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 mt-6">

        {/* Mode Vocabulaire */}
        {mode === 'vocab' && (
          loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={28} className="animate-spin text-blue-400" />
              <p className="text-gray-400 font-semibold text-sm">{t('common.loading')}</p>
            </div>
          ) : vocabError ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
                <BookOpen size={28} className="text-gray-400" />
              </div>
              <h2 className="font-black text-gray-800 text-xl mb-2">{t('config.notEnoughWordsHeading')}</h2>
              <p className="text-gray-400 font-semibold text-sm mb-8 max-w-xs mx-auto">{vocabError}</p>
              <button onClick={() => navigate('/dashboard')}
                className="font-extrabold text-white px-8 py-4 rounded-xl shadow-md hover:opacity-90 transition-all active:scale-95 text-sm"
                style={{ background: 'linear-gradient(135deg,#58cc02,#3fa801)' }}>
                {t('config.startLessonButton')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: vocabWords.length,                          label: t('config.stats.total'),        color: '#1cb0f6', bg: '#f0f9ff' },
                  { val: vocabWords.filter(w => !w.mastered).length, label: t('config.stats.dueForReview'), color: '#ff9600', bg: '#fff7ed' },
                  { val: vocabWords.filter(w => w.mastered).length,  label: t('config.stats.mastered'),     color: '#58cc02', bg: '#f0fdf4' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: s.bg }}>
                    <div className="text-2xl font-black" style={{ color: s.color }}>{s.val}</div>
                    <div className="text-xs font-bold text-gray-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              <button onClick={startRound}
                className="w-full py-4 rounded-xl font-black text-white text-sm shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#58cc02,#3fa801)' }}>
                <Zap size={18} fill="white" /> {t('config.startVocabRound', { count: ROUND_SIZE })}
              </button>
            </div>
          )
        )}

        {/* Mode Thèmes */}
        {mode === 'theme' && (
          <div className="space-y-5">
            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">{t('config.chooseTopic')}</p>
            <div className="grid grid-cols-2 gap-3">
              {TOPICS.map(topicOption => {
                const active = topic.value === topicOption.value
                return (
                  <button key={topicOption.value} onClick={() => setTopic(topicOption)}
                    className={`rounded-xl p-4 text-left border-2 transition-all ${
                      active ? 'border-purple-400 bg-purple-50 shadow-sm' : 'border-gray-100 bg-white hover:border-purple-200'
                    }`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                      active ? 'bg-purple-500' : 'bg-gray-100'
                    }`}>
                      <topicOption.Icon size={18} className={active ? 'text-white' : 'text-gray-400'} />
                    </div>
                    <div className={`font-extrabold text-sm ${active ? 'text-purple-600' : 'text-gray-700'}`}>
                      {t(`topics.${topicOption.key}`)}
                    </div>
                  </button>
                )
              })}
            </div>
            <button onClick={startRound}
              className="w-full py-4 rounded-xl font-black text-white text-sm shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
              <Sparkles size={18} /> {t('config.startThemeRound', { topic: t(`topics.${topic.key}`).toUpperCase() })}
            </button>
          </div>
        )}
      </div>
      <BottomNav active="exercises" />
    </div>
  )

  /* ════ ÉCRAN 2 — Résultats ═════════════════════════════════════════════ */
  if (phase === 'result') {
    const pct  = Math.round((score / ROUND_SIZE) * 100)
    const perf = pct === 100 ? { msg: t('results.perfect'),  grad:'linear-gradient(135deg,#fbbf24,#f59e0b)', Icon: Trophy   }
               : pct >= 60   ? { msg: t('results.good'),     grad:'linear-gradient(135deg,#58cc02,#3fa801)', Icon: Award    }
               :               { msg: t('results.keepGoing'), grad:'linear-gradient(135deg,#1cb0f6,#0e8fcf)', Icon: TrendingUp }
    return (
      <div className="min-h-screen font-duo pb-24 md:pb-8 flex flex-col"
        style={{ background: 'linear-gradient(160deg,#f0f9ff 0%,#faf5ff 50%,#f0fdf4 100%)' }}>
        <TopNav active="exercises" />
        <div className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm">

          {/* Trophy card */}
          <div className="rounded-2xl overflow-hidden shadow-xl mb-5" style={{ background: perf.grad }}>
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                <perf.Icon size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-black text-white mb-1">{perf.msg}</h2>
              <p className="text-white/75 font-semibold">{t('results.scoreSummary', { score, total: ROUND_SIZE })}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-5">
            <ScoreRing pct={pct} score={score} total={ROUND_SIZE} />
            <div className="flex justify-center gap-8 mt-5 pt-5 border-t border-gray-100">
              <div className="text-center">
                <div className="flex items-center gap-1 justify-center">
                  <Zap size={16} className="text-yellow-500" fill="#eab308" />
                  <span className="text-2xl font-black text-gray-800">+{xp}</span>
                </div>
                <div className="text-xs font-bold text-gray-400 mt-0.5">{t('results.xpEarnedLabel')}</div>
              </div>
              <div className="w-px bg-gray-100" />
              <div className="text-center">
                <div className="text-2xl font-black text-gray-800">{pct}%</div>
                <div className="text-xs font-bold text-gray-400 mt-0.5">{t('results.accuracyLabel')}</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button onClick={startRound}
              className="w-full py-4 rounded-xl font-black text-white text-sm shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#58cc02,#3fa801)' }}>
              <RotateCcw size={16} /> {t('results.replayButton')}
            </button>
            <button onClick={() => { setPhase('pick'); setMode(null) }}
              className="w-full py-4 rounded-xl font-black text-gray-500 bg-white border-2 border-gray-100 text-sm hover:bg-gray-50 transition-all">
              {t('results.changeModeButton')}
            </button>
          </div>
        </div>
        </div>
        <BottomNav active="exercises" />
      </div>
    )
  }

  /* ════ ÉCRAN 3 — Question ══════════════════════════════════════════════ */
  const isCorrect = answered && selected === exercise?.correct
  const TopicIcon = topic.Icon

  return (
    <div className="min-h-screen font-duo pb-24 md:pb-8"
      style={{ background: 'linear-gradient(160deg,#f0f9ff 0%,#faf5ff 50%,#f0fdf4 100%)' }}>

      <TopNav active="exercises" />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 md:static z-30">
        <div className="max-w-lg mx-auto px-5 py-3">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setPhase('pick')}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-400 transition-colors">
              <X size={16} />
            </button>

            {combo >= 2 && (
              <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl animate-bounce-in">
                <Flame size={13} className="text-orange-500" fill="#f97316" />
                <span className="text-orange-600 font-extrabold text-xs">{t('question.comboBadge', { count: combo })}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl">
              <Zap size={13} className="text-amber-500" fill="#f59e0b" />
              <span className="font-extrabold text-amber-600 text-sm">+{xp} XP</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5">
            {Array.from({ length: ROUND_SIZE }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i < round ? 'bg-green-400' : i === round ? 'bg-green-200' : 'bg-gray-200'
              }`} />
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 mt-6 pb-6">

        {/* Mode badge */}
        <div className="flex justify-center mb-5">
          <div className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider px-4 py-2 rounded-xl ${
            mode === 'vocab' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
          }`}>
            {mode === 'vocab'
              ? <><BookOpen size={13} /> {t('question.vocabBadge')}</>
              : <><TopicIcon size={13} /> {t(`topics.${topic.key}`)}</>
            }
          </div>
        </div>

        {/* Question card */}
        <div className={`bg-white rounded-2xl shadow-md p-6 mb-5 min-h-[120px] flex items-center justify-center ${
          shake ? 'animate-shake' : pop ? 'animate-bounce-in' : ''
        }`}>
          {loading || !exercise
            ? <div className="flex flex-col items-center gap-3">
                <Loader2 size={24} className="animate-spin text-gray-300" />
                <span className="text-gray-300 text-sm font-semibold">{t('common.loading')}</span>
              </div>
            : <p className="font-black text-gray-800 text-xl text-center leading-relaxed">
                {exercise.question}
              </p>
          }
        </div>

        {/* Options */}
        {exercise && !loading && (
          <div className="space-y-3 mb-5">
            {exercise.options.map((opt, idx) => {
              const isRight  = answered && idx === exercise.correct
              const isWrong  = answered && idx === selected && idx !== exercise.correct
              const isDimmed = answered && !isRight && !isWrong

              return (
                <button key={idx} onClick={() => handleAnswer(idx)} disabled={answered}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 font-extrabold text-sm text-left transition-all duration-200 ${
                    isRight  ? 'border-green-400 bg-green-50 text-green-700'
                    : isWrong  ? 'border-red-400 bg-red-50 text-red-600'
                    : isDimmed ? 'border-gray-100 bg-white/60 text-gray-300'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50 active:scale-[0.98]'
                  }`}>
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                    isRight  ? 'bg-green-500 text-white'
                    : isWrong  ? 'bg-red-500 text-white'
                    : isDimmed ? 'bg-gray-100 text-gray-300'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                    {OPTION_LETTERS[idx]}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {isRight && <CheckCircle size={18} className="text-green-500 shrink-0" />}
                  {isWrong && <XCircle     size={18} className="text-red-400   shrink-0" />}
                </button>
              )
            })}
          </div>
        )}

        {/* Feedback */}
        {answered && exercise && (
          <div className={`rounded-xl border-2 p-4 mb-5 ${
            isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className={`flex items-center gap-2 font-extrabold text-sm mb-2 ${
              isCorrect ? 'text-green-600' : 'text-red-500'
            }`}>
              {isCorrect
                ? <><CheckCircle size={15} /> {t('question.correctAnswer')} {combo >= 2 ? t('question.comboSuffix', { count: combo }) : ''}</>
                : <><XCircle size={15} /> {t('question.notQuite')}</>
              }
            </div>
            <p className="text-gray-500 font-semibold text-sm leading-relaxed">{exercise.explanation}</p>
          </div>
        )}

        {/* Bouton suivant */}
        {answered && (
          <button onClick={handleNext}
            className="w-full py-4 rounded-xl font-black text-white text-sm shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
            style={{ background: round + 1 >= ROUND_SIZE
              ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
              : 'linear-gradient(135deg,#58cc02,#3fa801)' }}>
            {round + 1 >= ROUND_SIZE
              ? <><Trophy size={17} /> {t('question.viewResultsButton')}</>
              : <>{t('question.nextQuestionButton')} <ChevronRight size={17} /></>
            }
          </button>
        )}
      </div>

      <BottomNav active="exercises" />
    </div>
  )
}
