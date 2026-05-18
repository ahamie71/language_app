import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle, XCircle, Loader2, RotateCcw,
  Zap, ChevronRight, Trophy, BookOpen, Sparkles
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { generateExercise, getVocabulary, updateWordProgress } from '../services/api'
import BottomNav from '../components/BottomNav'

const LANG_NAMES = {
  fr:'Français', en:'Anglais', es:'Espagnol', de:'Allemand',
  ar:'Arabe', it:'Italien', pt:'Portugais', zh:'Chinois', ja:'Japonais',
}

const TOPICS = [
  { label: 'Général',    value: 'general vocabulary and greetings'  },
  { label: 'Voyage',     value: 'travel and transportation'         },
  { label: 'Nourriture', value: 'food and restaurant'               },
  { label: 'Famille',    value: 'family and relationships'          },
  { label: 'Travail',    value: 'work and professions'              },
  { label: 'Grammaire',  value: 'grammar and sentence structure'    },
]

const ROUND_SIZE = 5

/* ── Génère un QCM à partir du vocabulaire de l'utilisateur ─────────── */
function buildVocabExercise(words, usedIds) {
  const pool = words.filter(w => !usedIds.includes(w.id))
  if (pool.length === 0) return null

  // Priorité aux mots non maîtrisés
  const notMastered = pool.filter(w => !w.mastered)
  const target = notMastered.length > 0
    ? notMastered[Math.floor(Math.random() * notMastered.length)]
    : pool[Math.floor(Math.random() * pool.length)]

  // 3 mauvaises réponses parmi les autres mots
  const others = words.filter(w => w.id !== target.id)
  const wrong  = [...others].sort(() => Math.random() - 0.5).slice(0, 3)

  const options = [...wrong.map(w => w.translation), target.translation]
    .sort(() => Math.random() - 0.5)

  const correctIdx = options.indexOf(target.translation)

  return {
    question:    `Comment traduit-on "${target.word}" ?`,
    options,
    correct:     correctIdx,
    explanation: `🇫🇷 "${target.word}" signifie "${target.translation}" en français.\n\n🌐 "${target.word}" = "${target.translation}"`,
    wordId:      target.id,
  }
}

export default function Exercises() {
  const navigate  = useNavigate()
  const { user }  = useAuth()

  const [mode,       setMode]       = useState(null)      // null | 'vocab' | 'theme'
  const [topic,      setTopic]      = useState(TOPICS[0])
  const [phase,      setPhase]      = useState('pick')    // pick | playing | result
  const [exercise,   setExercise]   = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [selected,   setSelected]   = useState(null)
  const [answered,   setAnswered]   = useState(false)
  const [score,      setScore]      = useState(0)
  const [round,      setRound]      = useState(0)
  const [xp,         setXp]         = useState(0)
  const [vocabWords, setVocabWords] = useState([])
  const [usedIds,    setUsedIds]    = useState([])
  const [vocabError, setVocabError] = useState('')

  /* ── Charge le vocabulaire quand mode vocab sélectionné ── */
  useEffect(() => {
    if (mode === 'vocab') {
      setLoading(true)
      getVocabulary()
        .then(d => {
          const words = Array.isArray(d) ? d : []
          setVocabWords(words)
          if (words.length < 4) {
            setVocabError(`Vous avez ${words.length} mot(s) dans votre vocabulaire. Il en faut au moins 4 pour jouer.`)
          } else {
            setVocabError('')
          }
        })
        .finally(() => setLoading(false))
    }
  }, [mode])

  /* ── Question suivante ── */
  const fetchNext = async () => {
    setLoading(true)
    setSelected(null)
    setAnswered(false)
    setExercise(null)

    if (mode === 'vocab') {
      const ex = buildVocabExercise(vocabWords, usedIds)
      if (ex) {
        setUsedIds(prev => [...prev, ex.wordId])
        setExercise(ex)
      }
      setLoading(false)
    } else {
      try {
        const data = await generateExercise(
          user?.target_language || 'en',
          user?.level || 'debutant',
          topic.value
        )
        setExercise(data)
      } catch {
        setExercise({
          question:    "¿Cómo se dice 'Bonjour' en español?",
          options:     ["Hola", "Adiós", "Gracias", "Por favor"],
          correct:     0,
          explanation: "🇫🇷 \"Hola\" signifie \"Bonjour\" en espagnol.\n\n🌐 \"Hola\" significa \"Bonjour\" en francés.",
        })
      }
      setLoading(false)
    }
  }

  const startRound = async () => {
    setScore(0); setRound(0); setXp(0); setUsedIds([])
    setPhase('playing')
    await fetchNext()
  }

  const handleAnswer = async (idx) => {
    if (answered) return
    setSelected(idx)
    setAnswered(true)
    const isCorrect = idx === exercise.correct
    if (isCorrect) { setScore(s => s + 1); setXp(x => x + 15) }

    // Met à jour la progression du mot dans le vocabulaire
    if (mode === 'vocab' && exercise.wordId) {
      try { await updateWordProgress(exercise.wordId, isCorrect) } catch {}
    }
  }

  const handleNext = async () => {
    const nextRound = round + 1
    if (nextRound >= ROUND_SIZE) { setPhase('result'); return }
    setRound(nextRound)
    await fetchNext()
  }

  /* ════ ÉCRAN 0 — Choix du mode ════════════════════════════════════════ */
  if (!mode) return (
    <div className="min-h-screen bg-duo-gray font-duo pb-24">
      <header className="bg-white border-b-2 border-duo-border sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-4 text-center">
          <h1 className="text-xl font-black text-duo-text">Exercices</h1>
          <p className="text-xs font-semibold text-duo-muted mt-0.5">{LANG_NAMES[user?.target_language]}</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 mt-8 space-y-4">
        <p className="text-xs font-extrabold text-duo-muted uppercase tracking-wider mb-2">
          Choisir un mode
        </p>

        {/* Mode Vocabulaire */}
        <button onClick={() => setMode('vocab')}
          className="duo-card w-full text-left border-2 hover:border-duo-green transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-duo-blue-bg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <BookOpen size={26} className="text-duo-blue" />
            </div>
            <div>
              <div className="font-extrabold text-duo-text text-base">Mon Vocabulaire</div>
              <div className="text-duo-muted text-sm font-semibold mt-0.5">
                Révise les mots extraits de tes conversations
              </div>
            </div>
          </div>
        </button>

        {/* Mode Thèmes IA */}
        <button onClick={() => setMode('theme')}
          className="duo-card w-full text-left border-2 hover:border-duo-green transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-duo-purple-bg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Sparkles size={26} className="text-duo-purple" />
            </div>
            <div>
              <div className="font-extrabold text-duo-text text-base">Thèmes IA</div>
              <div className="text-duo-muted text-sm font-semibold mt-0.5">
                Questions générées par l'IA sur un thème
              </div>
            </div>
          </div>
        </button>
      </div>

      <BottomNav active="exercises" />
    </div>
  )

  /* ════ ÉCRAN 1 — Config (thème ou info vocab) ══════════════════════════ */
  if (phase === 'pick') return (
    <div className="min-h-screen bg-duo-gray font-duo pb-24">
      <header className="bg-white border-b-2 border-duo-border sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => setMode(null)}
            className="text-duo-muted hover:text-duo-text font-extrabold text-xs uppercase">← Retour</button>
          <h1 className="text-lg font-black text-duo-text">
            {mode === 'vocab' ? 'Mon Vocabulaire' : 'Thèmes IA'}
          </h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 mt-6">

        {/* Mode Vocabulaire */}
        {mode === 'vocab' && (
          loading ? (
            <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-duo-muted" /></div>
          ) : vocabError ? (
            <div className="duo-card border-2 border-duo-border text-center py-8">
              <span className="text-5xl block mb-3">📚</span>
              <p className="font-extrabold text-duo-text mb-2">Pas assez de mots</p>
              <p className="text-duo-muted text-sm font-semibold mb-5">{vocabError}</p>
              <button onClick={() => navigate('/dashboard')}
                className="duo-btn duo-btn-green text-sm px-8 py-3">
                FAIRE UNE LEÇON IA
              </button>
            </div>
          ) : (
            <div>
              <div className="duo-card border-2 border-duo-green bg-duo-green-bg mb-5">
                <div className="font-extrabold text-duo-green mb-1">
                  {vocabWords.length} mots disponibles
                </div>
                <div className="text-duo-muted text-sm font-semibold">
                  {vocabWords.filter(w => !w.mastered).length} mots à réviser •{' '}
                  {vocabWords.filter(w => w.mastered).length} maîtrisés
                </div>
              </div>
              <button onClick={startRound} className="duo-btn duo-btn-green w-full text-base py-4">
                <Zap size={18} /> COMMENCER ({ROUND_SIZE} questions)
              </button>
            </div>
          )
        )}

        {/* Mode Thèmes */}
        {mode === 'theme' && (
          <div>
            <p className="text-xs font-extrabold text-duo-muted uppercase tracking-wider mb-3">
              Choisir un thème
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {TOPICS.map(t => (
                <button key={t.value} onClick={() => setTopic(t)}
                  className={`duo-card text-left border-2 transition-all ${
                    topic.value === t.value
                      ? 'border-duo-green bg-duo-green-bg'
                      : 'border-duo-border hover:border-duo-green'
                  }`}>
                  <div className={`font-extrabold text-sm ${topic.value === t.value ? 'text-duo-green' : 'text-duo-text'}`}>
                    {t.label}
                  </div>
                  {topic.value === t.value && <CheckCircle size={14} className="text-duo-green mt-1" />}
                </button>
              ))}
            </div>
            <button onClick={startRound} className="duo-btn duo-btn-green w-full text-base py-4">
              <Zap size={18} /> COMMENCER
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
    const perf = pct === 100 ? { msg:'Parfait !',   emoji:'🏆', color:'text-duo-yellow' }
               : pct >= 60   ? { msg:'Bien joué !', emoji:'🎉', color:'text-duo-green'  }
               :               { msg:'Continuez !', emoji:'💪', color:'text-duo-blue'   }
    return (
      <div className="min-h-screen bg-duo-gray font-duo pb-24 flex items-center justify-center">
        <div className="max-w-sm w-full mx-4">
          <div className="duo-card text-center">
            <div className="text-7xl mb-4">{perf.emoji}</div>
            <h2 className={`text-3xl font-black mb-1 ${perf.color}`}>{perf.msg}</h2>
            <p className="text-duo-muted font-semibold mb-6">{score} / {ROUND_SIZE} bonnes réponses</p>
            <div className="flex justify-center gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-black text-duo-green">{pct}%</div>
                <div className="text-xs font-bold text-duo-muted">Score</div>
              </div>
              <div className="w-px bg-duo-border" />
              <div className="text-center">
                <div className="text-3xl font-black text-duo-purple">+{xp}</div>
                <div className="text-xs font-bold text-duo-muted">XP gagnés</div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={startRound} className="duo-btn duo-btn-green w-full text-sm py-3">
                <RotateCcw size={16} /> REJOUER
              </button>
              <button onClick={() => { setPhase('pick'); setMode(null) }}
                className="duo-btn duo-btn-ghost w-full text-sm py-3">
                CHANGER DE MODE
              </button>
            </div>
          </div>
        </div>
        <BottomNav active="exercises" />
      </div>
    )
  }

  /* ════ ÉCRAN 3 — Question ══════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-duo-gray font-duo pb-24">
      <header className="bg-white border-b-2 border-duo-border sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setPhase('pick')}
              className="text-duo-muted hover:text-duo-red font-extrabold text-xs uppercase">
              ✕ Quitter
            </button>
            <span className="text-xs font-extrabold text-duo-muted">{round + 1} / {ROUND_SIZE}</span>
            <div className="flex items-center gap-1 text-duo-purple font-extrabold text-xs">
              <Zap size={13} /> +{xp} XP
            </div>
          </div>
          <div className="w-full bg-duo-gray rounded-full h-3 border border-duo-border overflow-hidden">
            <div className="h-full bg-duo-green rounded-full transition-all duration-500"
              style={{ width: `${(round / ROUND_SIZE) * 100}%` }} />
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 mt-6">

        {/* Badge mode */}
        <div className="flex justify-center mb-4">
          <span className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${
            mode === 'vocab'
              ? 'text-duo-blue bg-duo-blue-bg border-blue-200'
              : 'text-duo-purple bg-duo-purple-bg border-purple-200'
          }`}>
            {mode === 'vocab' ? '📚 Mon Vocabulaire' : `✨ ${topic.label} — ${LANG_NAMES[user?.target_language]}`}
          </span>
        </div>

        {/* Question */}
        <div className="duo-card border-2 border-duo-border mb-5 min-h-[100px] flex items-center justify-center">
          {loading || !exercise
            ? <Loader2 size={28} className="animate-spin text-duo-muted" />
            : <p className="font-extrabold text-duo-text text-lg text-center leading-relaxed">
                {exercise.question}
              </p>}
        </div>

        {/* Options */}
        {exercise && !loading && (
          <div className="grid grid-cols-1 gap-3 mb-5">
            {exercise.options.map((opt, idx) => {
              let style = 'border-duo-border bg-white hover:border-duo-blue text-duo-text'
              if (answered) {
                if (idx === exercise.correct) style = 'border-duo-green bg-duo-green-bg text-duo-green'
                else if (idx === selected)    style = 'border-duo-red bg-duo-red-bg text-duo-red'
                else                         style = 'border-duo-border bg-white text-duo-muted opacity-40'
              }
              return (
                <button key={idx} onClick={() => handleAnswer(idx)} disabled={answered}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-duo border-2 border-b-4 font-extrabold text-sm text-left transition-all active:translate-y-0.5 active:border-b-2 ${style}`}>
                  <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {answered && idx === exercise.correct && <CheckCircle size={18} className="text-duo-green shrink-0" />}
                  {answered && idx === selected && idx !== exercise.correct && <XCircle size={18} className="text-duo-red shrink-0" />}
                </button>
              )
            })}
          </div>
        )}

        {/* Explication bilingue */}
        {answered && exercise && (
          <div className={`rounded-2xl border-2 p-4 mb-5 animate-slide-up ${
            selected === exercise.correct ? 'bg-duo-green-bg border-green-200' : 'bg-duo-red-bg border-red-200'
          }`}>
            <div className={`flex items-center gap-2 font-extrabold text-sm mb-3 ${
              selected === exercise.correct ? 'text-duo-green' : 'text-duo-red'
            }`}>
              {selected === exercise.correct
                ? <><CheckCircle size={15} /> Bonne réponse !</>
                : <><XCircle size={15} /> Pas tout à fait…</>}
            </div>
            <div className="space-y-3">
              {exercise.explanation.split('\n\n').filter(Boolean).map((part, i) => (
                <div key={i} className="flex gap-2.5">
                  <span className="text-base shrink-0">{i === 0 ? '🇫🇷' : '🌐'}</span>
                  <p className="text-duo-muted font-semibold text-sm leading-relaxed">{part.trim()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bouton suivant */}
        {answered && (
          <button onClick={handleNext} className="duo-btn duo-btn-green w-full text-sm py-4">
            {round + 1 >= ROUND_SIZE
              ? <><Trophy size={16} /> VOIR MES RÉSULTATS</>
              : <>QUESTION SUIVANTE <ChevronRight size={16} /></>}
          </button>
        )}
      </div>

      <BottomNav active="exercises" />
    </div>
  )
}
