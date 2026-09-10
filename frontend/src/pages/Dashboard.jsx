import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Plus, Loader2, MessageCircle, Flame, Zap, BookOpen, Layers, X, PenLine, Mic, TrendingUp, ChevronRight,
  Globe, PartyPopper, Utensils, Map, ShoppingCart, Briefcase, Palmtree, Handshake, Stethoscope, Drama,
} from 'lucide-react'
import { getStats, createConversation, getConversations, getDueVocabulary, getVocabulary } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import BottomNav from '../components/BottomNav'
import TopNav from '../components/TopNav'
import { translatedLanguageName } from '../constants/languages'
import { LEVEL_INFO, translatedLevelLabel } from '../constants/levels'
import { getXp, getMasteredCount } from '../utils/stats'

const TOPICS = [
  { icon: Utensils,     key: 'restaurant',   value: 'restaurant' },
  { icon: Map,          key: 'directions',   value: 'directions' },
  { icon: ShoppingCart, key: 'shopping',     value: 'shopping'   },
  { icon: Briefcase,    key: 'jobInterview', value: 'job interview' },
  { icon: Palmtree,     key: 'travel',       value: 'travel'     },
  { icon: Handshake,    key: 'introduction', value: 'introduction' },
  { icon: Stethoscope,  key: 'doctor',       value: 'doctor'     },
  { icon: Drama,        key: 'hobbies',      value: 'hobbies'    },
]

export default function Dashboard() {
  const navigate         = useNavigate()
  const { user }         = useAuth()
  const { t }            = useTranslation('dashboard')
  const [stats,          setStats]         = useState(null)
  const [conversations,  setConversations] = useState([])
  const [vocab,          setVocab]         = useState([])
  const [dueCount,       setDueCount]      = useState(0)
  const [loading,        setLoading]       = useState(true)
  const [creating,       setCreating]      = useState(false)
  const [showTopics,     setShowTopics]    = useState(false)
  const [streakAlert,    setStreakAlert]   = useState(false)

  useEffect(() => {
    Promise.all([getStats(), getConversations(), getDueVocabulary(), getVocabulary()])
      .then(([s, c, due, v]) => {
        setStats(s)
        setConversations(Array.isArray(c) ? c : [])
        setDueCount(Array.isArray(due) ? due.length : 0)
        setVocab(Array.isArray(v) ? v : [])
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

  const level         = LEVEL_INFO[user?.level] || LEVEL_INFO.debutant
  const xp            = getXp(stats)
  const xpPct         = Math.min(100, Math.round((xp / level.xpNeeded) * 100))
  const streak        = stats?.streak_days        || 0
  const wordsCount    = stats?.total_words_learned || 0
  const masteredCount = getMasteredCount(stats, vocab)
  const convCount     = stats?.total_conversations || 0
  const exercisesDone  = stats?.exercises_completed  || 0
  const dictationsDone = stats?.dictation_completed  || 0

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-duo-gray font-duo">
      <Loader2 size={32} className="animate-spin text-duo-green" />
    </div>
  )

  const quickActions = [
    {
      to: '/flashcards', icon: Layers, color: 'text-duo-orange', bg: 'bg-orange-50', label: t('quickActions.flashcards.label'),
      sub: dueCount > 0 ? t('quickActions.flashcards.toReview', { count: dueCount }) : t('quickActions.flashcards.reviewed', { count: stats?.flashcards_reviewed || 0 }),
      highlight: dueCount > 0,
    },
    {
      to: '/dictation', icon: Mic, color: 'text-duo-blue', bg: 'bg-blue-50', label: t('quickActions.dictation.label'),
      sub: t('quickActions.dictation.completed', { count: dictationsDone }),
    },
    {
      to: '/exercises', icon: PenLine, color: 'text-duo-purple', bg: 'bg-violet-50', label: t('quickActions.exercises.label'),
      sub: t('quickActions.exercises.completed', { count: exercisesDone }),
    },
    {
      to: '/vocabulary', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50', label: t('quickActions.vocabulary.label'),
      sub: t('quickActions.vocabulary.mastered', { mastered: masteredCount, total: wordsCount }),
    },
  ]

  return (
    <div className="min-h-screen bg-duo-gray font-duo pb-24 md:pb-8">

      <TopNav active="learn" />

      {/* Streak alert */}
      {streakAlert && streak > 0 && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto">
          <div className="bg-duo-orange text-white rounded-2xl p-4 flex items-center gap-3 shadow-xl">
            {streak === 1 ? <PartyPopper size={28} className="shrink-0" /> : <Flame size={28} className="shrink-0" />}
            <div className="flex-1">
              <div className="font-extrabold text-base">
                {streak === 1 ? t('streakAlert.welcomeTitle') : t('streakAlert.continueTitle', { count: streak })}
              </div>
              <div className="text-sm opacity-90 font-semibold">
                {streak === 1 ? t('streakAlert.welcomeSubtitle') : t('streakAlert.continueSubtitle')}
              </div>
            </div>
            <button onClick={() => setStreakAlert(false)} className="p-1 hover:opacity-70">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Stats bar — reste visible sur desktop, juste plus sticky (TopNav prend déjà le haut) */}
      <header className="bg-white border-b-2 border-duo-border sticky top-0 md:static z-30">
        <div className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-duo-blue uppercase tracking-wide">
              <Globe size={14} />
              {translatedLanguageName(t, user?.native_language)} → {translatedLanguageName(t, user?.target_language)}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-extrabold text-duo-muted">{translatedLevelLabel(t, user?.level || 'debutant')}</span>
            <div className="flex-1 duo-progress">
              <div className="duo-progress-fill" style={{ width: `${xpPct}%` }} />
            </div>
            <span className="text-xs font-extrabold text-duo-green">{xp} XP</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <StatPill icon={Flame}    value={streak}     label={t('stats.streak')} color="text-duo-orange" />
            <div className="w-px h-5 bg-duo-border" />
            <StatPill icon={Zap}      value={xp}         label={t('stats.xp')}     color="text-duo-purple" />
            <div className="w-px h-5 bg-duo-border" />
            <StatPill icon={BookOpen} value={wordsCount}  label={t('stats.words')}   color="text-duo-blue"   />
          </div>
        </div>
      </header>

      <div className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto px-4 mt-4">

        {/* Due flashcards alert */}
        {dueCount > 0 && (
          <button onClick={() => navigate('/flashcards')}
            className="w-full duo-card border-2 border-duo-orange bg-orange-50 flex items-center gap-3 mb-4 hover:border-orange-400 transition-colors">
            <div className="w-10 h-10 bg-duo-orange rounded-xl flex items-center justify-center shrink-0">
              <Layers size={18} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-extrabold text-duo-text text-sm">
                {t('dueFlashcards.title', { count: dueCount })}
              </div>
              <div className="text-duo-muted text-xs font-semibold">{t('dueFlashcards.subtitle')}</div>
            </div>
            <div className="duo-badge bg-duo-orange text-white">{dueCount}</div>
          </button>
        )}

        {/* Primary CTA — single entry point to start a conversation */}
        <div className="duo-card p-0 overflow-hidden mb-4 border-2 border-duo-green">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-duo-green-bg rounded-xl flex items-center justify-center shrink-0">
                <MessageCircle size={22} className="text-duo-green" />
              </div>
              <div>
                <div className="font-black text-duo-text">{t('coach.title')}</div>
                <div className="text-duo-muted text-xs font-semibold">
                  {t('coach.conversationsCount', { count: convCount })}
                </div>
              </div>
            </div>
            <button onClick={() => setShowTopics(true)} disabled={creating}
              className="duo-btn duo-btn-green w-full py-3 disabled:opacity-60">
              {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              {t('coach.newConversation')}
            </button>
          </div>
        </div>

        {/* Guided topics modal */}
        {showTopics && (
          <div className="fixed inset-0 bg-black/50 z-40 flex items-end justify-center p-4"
            onClick={() => setShowTopics(false)}>
            <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-duo-text text-lg">{t('topicsModal.heading')}</h3>
                <button onClick={() => setShowTopics(false)} className="p-1 text-duo-muted hover:text-duo-text">
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {TOPICS.map(topic => (
                  <button key={topic.value} onClick={() => startLesson(topic.value)} disabled={creating}
                    className="flex items-center gap-2 p-3 rounded-xl border-2 border-duo-border hover:border-duo-green hover:bg-duo-green-bg transition-all text-left">
                    <topic.icon size={20} className="text-duo-text shrink-0" />
                    <span className="font-bold text-duo-text text-sm leading-tight">{t(`topics.${topic.key}`)}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => startLesson(null)} disabled={creating}
                className="w-full duo-btn bg-white border-2 border-duo-border text-duo-muted py-3 text-sm">
                {t('topicsModal.freeConversation')}
              </button>
            </div>
          </div>
        )}

        {/* Quick actions — real counts from your account */}
        <div className="mb-6">
          <h3 className="font-extrabold text-duo-muted uppercase text-xs tracking-wider mb-3 px-1">
            {t('quickActions.heading')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map(a => (
              <button key={a.to} onClick={() => navigate(a.to)}
                className={`duo-card flex items-center gap-3 text-left transition-colors ${a.highlight ? 'border-duo-orange' : 'hover:border-duo-border'}`}>
                <div className={`w-10 h-10 ${a.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <a.icon size={19} className={a.color} />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-duo-text text-sm">{a.label}</div>
                  <div className={`text-xs font-semibold truncate ${a.highlight ? 'text-duo-orange' : 'text-duo-muted'}`}>{a.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Progress link */}
        <button onClick={() => navigate('/progress')}
          className="duo-card w-full flex items-center gap-3 mb-6 hover:border-duo-purple transition-colors">
          <div className="w-10 h-10 bg-duo-purple-bg rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp size={19} className="text-duo-purple" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-extrabold text-duo-text text-sm">{t('progress.title')}</div>
            <div className="text-duo-muted text-xs font-semibold">{t('progress.subtitle')}</div>
          </div>
          <ChevronRight size={18} className="text-duo-muted shrink-0" />
        </button>

        {/* Recent conversations */}
        {conversations.length > 0 && (
          <div className="mb-6">
            <h3 className="font-extrabold text-duo-muted uppercase text-xs tracking-wider mb-3 px-1">
              {t('recentSessions.heading')}
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
                      {conv.title || t('recentSessions.defaultTitle')}
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
