import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageCircle,
  Trophy,
  Flame,
  Target,
  Plus,
  LogOut
} from 'lucide-react'

import {
  getProfile,
  getStats,
  createConversation
} from '../services/api'

import styles from './Dashboard.module.css'

export default function Dashboard() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const [tab, setTab] = useState('home')

  const LEVEL = {
    debutant: { color: 'var(--level-beginner)', icon: '🟢', label: 'Débutant' },
    intermediaire: { color: 'var(--level-intermediate)', icon: '🟡', label: 'Intermédiaire' },
    avance: { color: 'var(--level-advanced)', icon: '🔴', label: 'Avancé' }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [p, s] = await Promise.all([
          getProfile(),
          getStats()
        ])

        setUser(p)
        setStats(s)
      } catch (e) {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const newLesson = async () => {
    const conv = await createConversation()
    navigate(`/conversation/${conv.id}`)
  }

  if (loading) {
    return (
      <div className={styles.loading}>Chargement...</div>
    )
  }

  return (
    <div className={styles.app}>

      {/* HEADER */}
      <header className={styles.header}>
        <div>
          <h1>Salut {user?.username}! 👋</h1>
          <p>Continue ton apprentissage</p>
        </div>

        <button className={styles.primaryBtn} onClick={newLesson}>
          <Plus size={20} /> Nouvelle leçon
        </button>
      </header>

      {/* STATS */}
      <section className={styles.stats}>
        <div className={styles.card}>
          <Flame />
          <p>{stats?.streak_days || 0}</p>
          <span>Streak</span>
        </div>
        <div className={styles.card}>
          <Trophy />
          <p>{stats?.total_words_learned || 0}</p>
          <span>Mots appris</span>
        </div>
        <div className={styles.card}>
          <MessageCircle />
          <p>{stats?.total_conversations || 0}</p>
          <span>Conversations</span>
        </div>
      </section>

      {/* NAV */}
      <nav className={styles.nav}>
        <button 
          className={tab === 'home' ? 'active' : ''} 
          onClick={() => setTab('home')}
        >
          🏠 Accueil
        </button>
        <button 
          className={tab === 'profile' ? 'active' : ''} 
          onClick={() => setTab('profile')}
        >
          👤 Profil
        </button>
      </nav>

      {/* HOME */}
      {tab === 'home' && (
        <section className={styles.section}>
          <div className={styles.bigCard}>
            <h2>Niveau actuel</h2>
            <div style={{ color: LEVEL[user?.level]?.color }}>
              {LEVEL[user?.level]?.icon} {LEVEL[user?.level]?.label}
            </div>
            <Target />
          </div>
        </section>
      )}

      {/* PROFILE */}
      {tab === 'profile' && (
        <section className={styles.section}>
          <div className={styles.profileCard}>
            <h2>{user?.username}</h2>
            <p>{user?.email}</p>
            <span>{LEVEL[user?.level]?.icon} {LEVEL[user?.level]?.label}</span>

            <button onClick={() => {
              localStorage.clear()
              navigate('/')
            }}>
              <LogOut /> Déconnexion
            </button>
          </div>
        </section>
      )}

    </div>
  )
}
