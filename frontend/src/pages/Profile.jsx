import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LogOut, Loader2, Pencil,
  MessageCircle, BookOpen, Flame, Star,
  CheckCircle, Zap, BarChart2, Globe, User, Layers, PenLine, Mic
} from 'lucide-react'
import { getStats, getVocabulary } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import BottomNav from '../components/BottomNav'
import TopNav from '../components/TopNav'
import { translatedLanguageName } from '../constants/languages'
import { LEVEL_INFO, translatedLevelLabel } from '../constants/levels'
import { getXp, getMasteredCount } from '../utils/stats'

const BADGES = [
  { cond: c => c.convs    >= 1,  icon: MessageCircle, key: 'firstExchange',    color: 'text-blue-500'    },
  { cond: c => c.convs    >= 5,  icon: MessageCircle, key: 'conversations5',   color: 'text-blue-600'    },
  { cond: c => c.convs    >= 10, icon: MessageCircle, key: 'conversations10',  color: 'text-blue-700'    },
  { cond: c => c.words    >= 10, icon: BookOpen,      key: 'words10',         color: 'text-emerald-500' },
  { cond: c => c.words    >= 50, icon: BookOpen,      key: 'words50',         color: 'text-emerald-600' },
  { cond: c => c.words    >= 100,icon: BookOpen,      key: 'words100',        color: 'text-emerald-700' },
  { cond: c => c.streak   >= 3,  icon: Flame,         key: 'streak3',         color: 'text-orange-500'  },
  { cond: c => c.streak   >= 7,  icon: Flame,         key: 'streak7',         color: 'text-orange-600'  },
  { cond: c => c.streak   >= 30, icon: Flame,         key: 'streak30',        color: 'text-orange-700'  },
  { cond: c => c.mastered >= 5,  icon: CheckCircle,   key: 'mastered5',       color: 'text-violet-500'  },
  { cond: c => c.mastered >= 20, icon: CheckCircle,   key: 'mastered20',      color: 'text-violet-600'  },
  { cond: c => c.exercises >= 5, icon: PenLine,       key: 'exercises5',      color: 'text-amber-500'   },
  { cond: c => c.exercises >= 20,icon: PenLine,       key: 'exercises20',     color: 'text-amber-600'   },
  { cond: c => c.flashcards >= 10, icon: Layers,      key: 'flashcards10',    color: 'text-cyan-500'    },
  { cond: c => c.dictations >= 3,  icon: Mic,         key: 'dictations3',     color: 'text-rose-500'    },
]

export default function Profile() {
  const navigate             = useNavigate()
  const { user, logoutUser } = useAuth()
  const { t }                 = useTranslation('profile')

  const [stats,   setStats]   = useState(null)
  const [vocab,   setVocab]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getStats(), getVocabulary()])
      .then(([s, v]) => { setStats(s); setVocab(Array.isArray(v) ? v : []) })
      .finally(() => setLoading(false))
  }, [])

  const level     = LEVEL_INFO[user?.level] || LEVEL_INFO.debutant
  const xp        = getXp(stats)
  const mastered  = getMasteredCount(stats, vocab)
  const convs     = stats?.total_conversations  || 0
  const messages  = stats?.total_messages       || 0
  const words     = stats?.total_words_learned  || 0
  const streak    = stats?.streak_days          || 0
  const exercises = stats?.exercises_completed  || 0
  const dictations= stats?.dictation_completed  || 0
  const flashcards= stats?.flashcards_reviewed  || 0
  const ctx       = { convs, words, streak, mastered, exercises, dictations, flashcards }
  const earnedBadges = BADGES.filter(b => b.cond(ctx)).length

  const handleLogout = () => { logoutUser(); navigate('/') }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-duo-gray font-duo">
      <Loader2 size={32} className="animate-spin text-duo-green" />
    </div>
  )

  return (
    <div className="min-h-screen bg-duo-gray font-duo pb-24 md:pb-8">

      <TopNav active="profile" />

      {/* Header */}
      <header className="bg-white border-b-2 border-duo-border sticky top-0 md:static z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-black text-duo-text">{t('header.title')}</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/profile/edit')}
              className="flex items-center gap-2 text-duo-muted hover:text-duo-blue font-extrabold text-sm transition-colors">
              <Pencil size={16} /> {t('header.editProfile')}
            </button>
            <div className="w-px h-5 bg-duo-border" />
            <button onClick={handleLogout}
              className="flex items-center gap-2 text-duo-muted hover:text-duo-red font-extrabold text-sm transition-colors">
              <LogOut size={16} /> {t('header.logout')}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Colonne gauche ── */}
          <div className="lg:col-span-1 space-y-5">

            {/* Carte identité */}
            <div className="duo-card p-0 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-duo-green to-emerald-400" />
              <div className="p-6 text-center">
                <div className="w-24 h-24 rounded-2xl bg-duo-green flex items-center justify-center text-4xl font-black text-duo-black mx-auto mb-4 shadow-md">
                  {user?.username?.[0]?.toUpperCase() ?? <User size={36} />}
                </div>
                <h2 className="text-2xl font-black text-duo-text">{user?.username}</h2>
                <p className="text-duo-muted font-semibold text-sm mt-1 mb-4">{user?.email}</p>

                <span className={`inline-block text-sm font-extrabold px-4 py-1.5 rounded-full border ${level.bg} ${level.color} ${level.border} mb-4`}>
                  {translatedLevelLabel(t, user?.level || 'debutant')}
                </span>

                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-duo-muted font-semibold flex items-center gap-1.5">
                      <Globe size={14} /> {t('identity.nativeLanguage')}
                    </span>
                    <span className="font-extrabold text-duo-text">{translatedLanguageName(t, user?.native_language)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-duo-muted font-semibold flex items-center gap-1.5">
                      <Globe size={14} /> {t('identity.learning')}
                    </span>
                    <span className="font-extrabold text-duo-green">{translatedLanguageName(t, user?.target_language)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Streak + XP */}
            <div className="grid grid-cols-2 gap-4">
              <div className="duo-card text-center">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-3">
                  <Flame size={24} className="text-orange-500" />
                </div>
                <div className="text-3xl font-black text-duo-text">{streak}</div>
                <div className="text-xs font-bold text-duo-muted mt-1">{t('stats.streakDays')}</div>
              </div>
              <div className="duo-card text-center">
                <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
                  <Zap size={24} className="text-violet-500" />
                </div>
                <div className="text-3xl font-black text-duo-text">{xp}</div>
                <div className="text-xs font-bold text-duo-muted mt-1">{t('stats.totalXp')}</div>
              </div>
            </div>
          </div>

          {/* ── Colonne droite ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Statistiques */}
            <div className="duo-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart2 size={18} className="text-duo-muted" />
                <h3 className="font-extrabold text-duo-text uppercase text-xs tracking-widest">{t('stats.heading')}</h3>
                <button onClick={() => navigate('/progress')}
                  className="ml-auto text-xs font-extrabold text-duo-green hover:underline">
                  {t('stats.seeAll')}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: MessageCircle, label: t('stats.conversations'),       value: convs,     color: 'text-blue-500',    bg: 'bg-blue-50'    },
                  { icon: Star,          label: t('stats.messagesExchanged'),   value: messages,  color: 'text-violet-500',  bg: 'bg-violet-50'  },
                  { icon: BookOpen,      label: t('stats.wordsInNotebook'),     value: words,     color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { icon: CheckCircle,   label: t('stats.wordsMastered'),       value: mastered,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { icon: PenLine,       label: t('stats.exercisesDone'),       value: exercises, color: 'text-amber-500',   bg: 'bg-amber-50'   },
                  { icon: Layers,        label: t('stats.flashcardsReviewed'),  value: flashcards,color: 'text-cyan-500',    bg: 'bg-cyan-50'    },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl ${s.bg} p-5 flex items-center gap-4`}>
                    <s.icon size={22} className={s.color} />
                    <div>
                      <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                      <div className="text-xs font-bold text-duo-muted mt-0.5">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges */}
            <div className="duo-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <Star size={18} className="text-duo-muted" />
                <h3 className="font-extrabold text-duo-text uppercase text-xs tracking-widest">{t('badges.heading')}</h3>
                <span className="ml-auto text-sm font-bold text-duo-muted">
                  {t('badges.obtained', { earned: earnedBadges, total: BADGES.length })}
                </span>
              </div>

              {/* Progress */}
              <div className="mb-5">
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full bg-duo-green rounded-full transition-all duration-700"
                    style={{ width: `${Math.round((earnedBadges / BADGES.length) * 100)}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {BADGES.map((b, i) => {
                  const earned = b.cond(ctx)
                  const label = t(`badges.${b.key}`)
                  return (
                    <div key={i} title={label}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        earned
                          ? 'bg-white border-gray-200 shadow-sm'
                          : 'bg-gray-50 border-gray-100 opacity-30'
                      }`}>
                      <b.icon size={24} className={earned ? b.color : 'text-gray-300'} />
                      <span className="text-center text-xs font-bold text-duo-muted leading-tight">
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  )
}
