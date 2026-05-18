import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Flame, Zap, BookOpen, MessageCircle, CheckCircle, PenLine, Mic } from 'lucide-react'
import { getStats, getVocabulary } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import BottomNav from '../components/BottomNav'

const LANG_NAMES = {
  fr:'Français', en:'Anglais', es:'Espagnol', de:'Allemand',
  ar:'Arabe', it:'Italien', pt:'Portugais', zh:'Chinois', ja:'Japonais',
}

function StatCard({ icon: Icon, label, value, color, bg, sub }) {
  return (
    <div className={`rounded-2xl ${bg} p-5`}>
      <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-3`}>
        <Icon size={20} className={color} />
      </div>
      <div className={`text-3xl font-black ${color}`}>{value}</div>
      <div className="text-xs font-bold text-duo-muted mt-0.5">{label}</div>
      {sub && <div className="text-xs text-duo-muted font-semibold mt-1">{sub}</div>}
    </div>
  )
}

function Bar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold text-duo-muted w-20 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-extrabold text-duo-text w-8 shrink-0">{value}</span>
    </div>
  )
}

export default function Progress() {
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const [stats,      setStats]  = useState(null)
  const [vocab,      setVocab]  = useState([])
  const [loading,    setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getStats(), getVocabulary()])
      .then(([s, v]) => { setStats(s); setVocab(Array.isArray(v) ? v : []) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-duo-gray font-duo">
      <div className="text-center">
        <span className="text-6xl block mb-4 animate-float">📊</span>
        <p className="text-duo-muted font-bold">Chargement...</p>
      </div>
    </div>
  )

  const xp         = stats?.xp_total || (stats?.total_messages * 10) || 0
  const streak     = stats?.streak_days || 0
  const messages   = stats?.total_messages || 0
  const convs      = stats?.total_conversations || 0
  const words      = stats?.total_words_learned || 0
  const mastered   = stats?.mastered_words || vocab.filter(w => w.mastered).length
  const exercises  = stats?.exercises_completed || 0
  const dictations = stats?.dictation_completed || 0
  const flashcards = stats?.flashcards_reviewed || 0

  const learning   = words - mastered
  const masteryPct = words > 0 ? Math.round((mastered / words) * 100) : 0

  // Difficulty repartition
  const byDiff = vocab.reduce((acc, w) => {
    acc[w.difficulty_level] = (acc[w.difficulty_level] || 0) + 1
    return acc
  }, {})

  // Category repartition
  const byCat = vocab.reduce((acc, w) => {
    const cat = w.category || 'Général'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})
  const topCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCat  = topCats[0]?.[1] || 1

  return (
    <div className="min-h-screen bg-duo-gray font-duo pb-24">
      <header className="bg-white border-b-2 border-duo-border sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-duo-gray rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-duo-muted" />
          </button>
          <div>
            <h1 className="text-xl font-black text-duo-text">Ma progression</h1>
            <p className="text-xs text-duo-muted font-semibold">
              {LANG_NAMES[user?.native_language]} → {LANG_NAMES[user?.target_language]}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* XP + Streak hero */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-duo-green to-emerald-400" />
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-2">
                <Flame size={28} className="text-orange-500" />
              </div>
              <div className="text-3xl font-black text-duo-text">{streak}</div>
              <div className="text-xs font-bold text-duo-muted">Jours de suite</div>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-2">
                <Zap size={28} className="text-violet-500" />
              </div>
              <div className="text-3xl font-black text-duo-text">{xp}</div>
              <div className="text-xs font-bold text-duo-muted">XP total</div>
            </div>
          </div>
        </div>

        {/* Activity stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={MessageCircle} label="Conversations"   value={convs}      color="text-blue-500"     bg="bg-blue-50"     />
          <StatCard icon={Zap}           label="Messages IA"     value={messages}   color="text-violet-500"   bg="bg-violet-50"   />
          <StatCard icon={PenLine}       label="Exercices faits" value={exercises}  color="text-amber-500"    bg="bg-amber-50"    />
          <StatCard icon={Mic}           label="Dictées"         value={dictations} color="text-rose-500"     bg="bg-rose-50"     />
          <StatCard icon={BookOpen}      label="Flashcards revues" value={flashcards} color="text-cyan-500"   bg="bg-cyan-50"     />
          <StatCard icon={CheckCircle}   label="Mots maîtrisés"  value={mastered}   color="text-emerald-600"  bg="bg-emerald-50"  />
        </div>

        {/* Vocabulary mastery */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-extrabold text-duo-text text-sm uppercase tracking-widest mb-4">Maîtrise du vocabulaire</h3>
          <div className="flex items-center justify-between mb-3">
            <span className="text-duo-muted font-semibold text-sm">{mastered}/{words} mots maîtrisés</span>
            <span className="font-black text-duo-green text-xl">{masteryPct}%</span>
          </div>
          <div className="duo-progress mb-4">
            <div className="duo-progress-fill transition-all duration-700" style={{ width: `${masteryPct}%` }} />
          </div>
          <div className="space-y-2">
            <Bar label="Maîtrisés"  value={mastered}  max={words} color="bg-duo-green"  />
            <Bar label="En cours"   value={learning}  max={words} color="bg-duo-orange" />
            <Bar label="Faciles"    value={byDiff.easy   || 0} max={words} color="bg-emerald-400" />
            <Bar label="Moyens"     value={byDiff.medium || 0} max={words} color="bg-amber-400"   />
            <Bar label="Difficiles" value={byDiff.hard   || 0} max={words} color="bg-rose-400"    />
          </div>
        </div>

        {/* Top categories */}
        {topCats.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-extrabold text-duo-text text-sm uppercase tracking-widest mb-4">Catégories les plus étudiées</h3>
            <div className="space-y-3">
              {topCats.map(([cat, count]) => (
                <Bar key={cat} label={cat.length > 12 ? cat.slice(0, 12) + '…' : cat} value={count} max={maxCat} color="bg-duo-blue" />
              ))}
            </div>
          </div>
        )}

        {/* Level info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-extrabold text-duo-text text-sm uppercase tracking-widest mb-4">Niveau actuel</h3>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-full font-extrabold text-sm ${
              user?.level === 'avance' ? 'bg-rose-50 text-rose-600' :
              user?.level === 'intermediaire' ? 'bg-amber-50 text-amber-600' :
              'bg-emerald-50 text-emerald-600'
            }`}>
              {user?.level === 'avance' ? 'Avancé' : user?.level === 'intermediaire' ? 'Intermédiaire' : 'Débutant'}
            </div>
            <div className="flex-1">
              <div className="text-xs text-duo-muted font-semibold">Niveau adaptatif basé sur vos résultats</div>
            </div>
          </div>
        </div>

      </div>

      <BottomNav active="profile" />
    </div>
  )
}
