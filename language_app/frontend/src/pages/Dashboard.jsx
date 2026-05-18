import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Plus, Loader2, MessageCircle, Flame, Star, Lock, Trophy, CheckCircle, Zap, BookOpen, Layers, X } from 'lucide-react'
import { getStats, createConversation, getConversations, getDueVocabulary } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import BottomNav from '../components/BottomNav'

const LANG_NAMES = {
  fr:'Français', en:'Anglais', es:'Espagnol', de:'Allemand',
  ar:'Arabe', it:'Italien', pt:'Portugais', zh:'Chinois', ja:'Japonais', us:'Anglais',
}

const LEVEL_INFO = {
  debutant:      { label:'Débutant',      xpNeeded:500  },
  intermediaire: { label:'Intermédiaire', xpNeeded:2000 },
  avance:        { label:'Avancé',        xpNeeded:5000 },
}

const TOPICS = [
  { emoji: '🍽️', label: 'Au restaurant',      value: 'restaurant' },
  { emoji: '🗺️', label: 'Demander son chemin', value: 'directions' },
  { emoji: '🛒', label: 'Faire les courses',   value: 'shopping'   },
  { emoji: '💼', label: 'Entretien d\'embauche', value: 'job interview' },
  { emoji: '🏖️', label: 'Vacances',            value: 'travel'     },
  { emoji: '🤝', label: 'Se présenter',         value: 'introduction' },
  { emoji: '🏥', label: 'Chez le médecin',      value: 'doctor'     },
  { emoji: '🎭', label: 'Loisirs & culture',    value: 'hobbies'    },
]

export default function Dashboard() {
  const navigate         = useNavigate()
  const { user }         = useAuth()
  const [stats,          setStats]         = useState(null)
  const [conversations,  setConversations] = useState([])
  const [dueCount,       setDueCount]      = useState(0)
  const [loading,        setLoading]       = useState(true)
  const [creating,       setCreating]      = useState(false)
  const [showTopics,     setShowTopics]    = useState(false)
  const [streakAlert,    setStreakAlert]   = useState(false)

  useEffect(() => {
    Promise.all([getStats(), getConversations(), getDueVocabulary()])
      .then(([s, c, due]) => {
        setStats(s)
        setConversations(Array.isArray(c) ? c : [])
        setDueCount(Array.isArray(due) ? due.length : 0)
        if (s?.streak_days >= 1) {
          const today = new Date().toISOString().slice(0, 10)
          const lastSeen = localStorage.getItem('streakAlertDate')
          if (lastSeen !== today) {
            setStreakAlert(true)
            localStorage.setItem('streakAlertDate', today)
          }
        }
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [])

  const startLesson = async (topic = null) => {
    setCreating(true)
    setShowTopics(false)
    try {
      const conv = await createConversation(topic)
      navigate(`/conversation/${conv.id}`)
    } catch { setCreating(false) }
  }

  const level      = LEVEL_INFO[user?.level] || LEVEL_INFO.debutant
  const xp         = stats?.xp_total || (stats?.total_messages ? stats.total_messages * 10 : 0)
  const xpPct      = Math.min(100, Math.round((xp / level.xpNeeded) * 100))
  const streak     = stats?.streak_days        || 0
  const wordsCount = stats?.total_words_learned || 0
  const convCount  = stats?.total_conversations || 0

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-duo-gray font-duo">
      <Loader2 size={32} className="animate-spin text-duo-green" />
    </div>
  )

  const TOTAL_SLOTS = Math.max(conversations.length + 3, 6)
  const lessonSlots = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
    const conv = conversations[conversations.length - 1 - i]
    if (conv) return { type: 'done', conv }
    if (i === conversations.length) return { type: 'active' }
    return { type: 'locked' }
  })

  return (
    <div className="min-h-screen bg-duo-gray font-duo pb-24">

      {/* Streak alert */}
      {streakAlert && streak > 0 && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-lg mx-auto">
          <div className="bg-duo-orange text-white rounded-2xl p-4 flex items-center gap-3 shadow-xl">
            <Flame size={28} className="shrink-0" />
            <div className="flex-1">
              <div className="font-extrabold text-base">
                {streak === 1 ? '🎉 Bienvenue !' : `🔥 ${streak} jours de suite !`}
              </div>
              <div className="text-sm opacity-90 font-semibold">
                {streak === 1 ? "C'est parti, bonne session !" : "Continue comme ça, tu es en feu !"}
              </div>
            </div>
            <button onClick={() => setStreakAlert(false)} className="p-1 hover:opacity-70">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="bg-white border-b-2 border-duo-border sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-duo-blue uppercase tracking-wide">
              <Globe16 />
              {LANG_NAMES[user?.native_language]} → {LANG_NAMES[user?.target_language]}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-extrabold text-duo-muted">{level.label}</span>
            <div className="flex-1 duo-progress">
              <div className="duo-progress-fill" style={{ width: `${xpPct}%` }} />
            </div>
            <span className="text-xs font-extrabold text-duo-green">{xp} XP</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <StatPill icon={Flame}    value={streak}     label="Streak" color="text-duo-orange" />
            <div className="w-px h-5 bg-duo-border" />
            <StatPill icon={Zap}      value={xp}         label="XP"     color="text-duo-purple" />
            <div className="w-px h-5 bg-duo-border" />
            <StatPill icon={BookOpen} value={wordsCount}  label="Mots"   color="text-duo-blue"   />
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 mt-4">

        {/* Due flashcards alert */}
        {dueCount > 0 && (
          <button onClick={() => navigate('/flashcards')}
            className="w-full duo-card border-2 border-duo-orange bg-orange-50 flex items-center gap-3 mb-4 hover:border-orange-400 transition-colors">
            <div className="w-10 h-10 bg-duo-orange rounded-xl flex items-center justify-center shrink-0">
              <Layers size={18} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-extrabold text-duo-text text-sm">
                {dueCount} carte{dueCount > 1 ? 's' : ''} à réviser
              </div>
              <div className="text-duo-muted text-xs font-semibold">Flashcards SRS · Réviser maintenant →</div>
            </div>
            <div className="duo-badge bg-duo-orange text-white">{dueCount}</div>
          </button>
        )}

        {/* Unit banner */}
        <div className="bg-duo-green rounded-duo p-4 text-white mb-4">
          <div className="text-xs font-extrabold uppercase opacity-80 tracking-wider mb-1">
            Section 1 • Conversation IA
          </div>
          <div className="font-black text-lg">
            Parler en {LANG_NAMES[user?.target_language]}
          </div>
          <div className="text-sm opacity-80 font-semibold mt-0.5">
            {convCount} leçon{convCount !== 1 ? 's' : ''} complétée{convCount !== 1 ? 's' : ''} avec votre coach IA
          </div>
        </div>

        {/* Guided topics modal */}
        {showTopics && (
          <div className="fixed inset-0 bg-black/50 z-40 flex items-end justify-center p-4"
            onClick={() => setShowTopics(false)}>
            <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-duo-text text-lg">Choisir un thème</h3>
                <button onClick={() => setShowTopics(false)} className="p-1 text-duo-muted hover:text-duo-text">
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {TOPICS.map(t => (
                  <button key={t.value} onClick={() => startLesson(t.value)} disabled={creating}
                    className="flex items-center gap-2 p-3 rounded-xl border-2 border-duo-border hover:border-duo-green hover:bg-duo-green-bg transition-all text-left">
                    <span className="text-2xl">{t.emoji}</span>
                    <span className="font-bold text-duo-text text-sm leading-tight">{t.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => startLesson(null)} disabled={creating}
                className="w-full duo-btn bg-white border-2 border-duo-border text-duo-muted py-3 text-sm">
                Conversation libre (sans thème)
              </button>
            </div>
          </div>
        )}

        {/* Lesson path */}
        <div className="flex flex-col items-center gap-3 mb-6">
          {lessonSlots.map((slot, i) => {
            const col = i % 3 === 0 ? 'self-start ml-6'
                      : i % 3 === 2 ? 'self-end mr-6'
                      : 'self-center'

            if (slot.type === 'active') return (
              <div key={i} className={col}>
                <button onClick={() => setShowTopics(true)} disabled={creating}
                  className="relative w-20 h-20 bg-duo-yellow rounded-full border-b-4 border-duo-yellow-d flex flex-col items-center justify-center shadow-lg animate-pulse-green transition-all active:translate-y-1 active:border-b-0">
                  {creating
                    ? <Loader2 size={28} className="animate-spin text-white" />
                    : <Star size={28} fill="white" className="text-white" />}
                  <span className="text-white text-xs font-extrabold mt-0.5">START</span>
                </button>
              </div>
            )

            if (slot.type === 'done') return (
              <div key={i} className={col}>
                <button onClick={() => navigate(`/conversation/${slot.conv.id}`)}
                  className="relative w-20 h-20 bg-duo-green rounded-full border-b-4 border-duo-green-d flex flex-col items-center justify-center shadow-md transition-all active:translate-y-1 active:border-b-0">
                  <CheckCircle size={28} className="text-white" />
                  <span className="text-white text-xs font-extrabold mt-0.5">FAIT</span>
                </button>
              </div>
            )

            return (
              <div key={i} className={col}>
                <div className="w-20 h-20 bg-white rounded-full border-4 border-duo-border flex flex-col items-center justify-center opacity-50">
                  <Lock size={24} className="text-duo-muted" />
                  <span className="text-duo-muted text-xs font-extrabold mt-0.5">BLOQUÉ</span>
                </div>
              </div>
            )
          })}

          <div className="self-center mt-2">
            <button onClick={() => setShowTopics(true)} disabled={creating}
              className="duo-btn duo-btn-green text-sm px-8 py-3">
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              NOUVELLE LEÇON IA
            </button>
          </div>
        </div>

        {/* Recent conversations */}
        {conversations.length > 0 && (
          <div className="mb-6">
            <h3 className="font-extrabold text-duo-muted uppercase text-xs tracking-wider mb-3 px-1">
              Mes sessions IA récentes
            </h3>
            <div className="space-y-2">
              {conversations.slice(0, 4).map(conv => (
                <button key={conv.id} onClick={() => navigate(`/conversation/${conv.id}`)}
                  className="duo-card w-full flex items-center gap-3 text-left hover:border-duo-green transition-colors">
                  <div className="w-10 h-10 bg-duo-green-bg rounded-duo-sm flex items-center justify-center shrink-0">
                    <MessageCircle size={18} className="text-duo-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-sm text-duo-text truncate">
                      {conv.title || 'Session de conversation'}
                    </div>
                    <div className="text-duo-muted text-xs font-semibold">
                      {new Date(conv.created_at).toLocaleDateString('fr-FR', {
                        day:'numeric', month:'short', year:'numeric'
                      })}
                    </div>
                  </div>
                  <div className="duo-badge bg-duo-green-bg text-duo-green text-xs">+10 XP</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => navigate('/flashcards')}
            className="duo-card flex flex-col items-center gap-2 py-5 hover:border-duo-orange transition-colors">
            <Layers size={24} className="text-duo-orange" />
            <span className="font-extrabold text-duo-text text-sm">Flashcards</span>
            {dueCount > 0 && (
              <span className="text-xs text-duo-orange font-bold">{dueCount} à réviser</span>
            )}
          </button>
          <button onClick={() => navigate('/dictation')}
            className="duo-card flex flex-col items-center gap-2 py-5 hover:border-duo-blue transition-colors">
            <span className="text-2xl">✍️</span>
            <span className="font-extrabold text-duo-text text-sm">Dictée</span>
            <span className="text-xs text-duo-muted font-semibold">Nouveau !</span>
          </button>
        </div>

        {/* AI promo */}
        <div className="duo-card border-duo-purple border-2 bg-duo-purple-bg mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
              <Zap size={20} className="text-duo-purple" />
            </div>
            <div>
              <div className="font-extrabold text-duo-text mb-1">L'IA accélère votre apprentissage</div>
              <div className="text-duo-muted text-sm font-semibold">
                Niveau adaptatif, SRS, dictée et corrections automatiques à chaque session.
              </div>
              <Link to="/progress" className="inline-block mt-2 text-duo-purple font-extrabold text-sm hover:underline">
                Voir ma progression →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="learn" />
    </div>
  )
}

function StatPill({ icon: Icon, value, label, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={16} className={color} />
      <div>
        <div className={`text-sm font-extrabold leading-none ${color}`}>{value}</div>
        <div className="text-duo-light text-xs font-bold">{label}</div>
      </div>
    </div>
  )
}

function Globe16() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}
