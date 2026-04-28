import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  MessageCircle, BarChart3, BookOpen, LogOut, Plus, Globe, TrendingUp, 
  Clock, Award, Target, Zap, Star, ChevronRight, Calendar, Activity,
  Trophy, Flame, CheckCircle, ArrowUpRight, BookMarked, User, Save
} from 'lucide-react'
import { getProfile, getStats, getConversations, createConversation, getVocabulary, updateWordProgress, updateProfile } from '../services/api'
import { logout } from '../services/api'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [conversations, setConversations] = useState([])
  const [wordsLearned, setWordsLearned] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview') // overview, stats, words, profile
  const [selectedWordFilter, setSelectedWordFilter] = useState('all')
  const [practiceMode, setPracticeMode] = useState(false)
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    native_language: 'fr',
    target_language: 'en',
    level: 'debutant',
  })
  const [profileMessage, setProfileMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token')
        
        const [profile, statsData, conversationsData, vocabularyData] = await Promise.all([
          getProfile(),
          getStats(),
          getConversations(),
          getVocabulary()
        ])
        
        console.log('Vocabulary data:', vocabularyData)
        setUser(profile)
        setStats(statsData)
        setConversations(conversationsData)
        setWordsLearned(Array.isArray(vocabularyData) ? vocabularyData : [])
        setProfileForm({
          username: profile.username || '',
          email: profile.email || '',
          native_language: profile.native_language || 'fr',
          target_language: profile.target_language || 'en',
          level: profile.level || 'debutant',
        })
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [navigate])

  const handleNewConversation = async () => {
    try {
      const newConv = await createConversation()
      navigate(`/conversation/${newConv.id}`)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleProfileUpdate = async () => {
    try {
      setProfileMessage('')
      const updatedUser = await updateProfile(profileForm)
      if (updatedUser.error) {
        setProfileMessage(updatedUser.error)
        return
      }
      setUser(updatedUser)
      setEditMode(false)
      setProfileMessage('Profile mis à jour avec succès !')
      setTimeout(() => setProfileMessage(''), 3000)
    } catch (error) {
      console.error('Profile update error:', error)
      setProfileMessage('Échec de la mise à jour du profil')
    }
  }

  const handleProfileChange = (field, value) => {
    setProfileForm(prev => ({ ...prev, [field]: value }))
  }

  const startPractice = () => {
    const wordsToPractice = wordsLearned.filter(word => !word.mastered)
    if (wordsToPractice.length === 0) {
      alert('Vous n\'avez pas de mots à pratiquer !')
      return
    }
    setPracticeMode(true)
    setCurrentPracticeIndex(0)
    setShowAnswer(false)
  }

  const handlePracticeAnswer = async (correct) => {
    const currentWord = wordsLearned.filter(word => !word.mastered)[currentPracticeIndex]
    if (!currentWord) return

    try {
      await updateWordProgress(currentWord.id, correct)
      
      // Reload vocabulary to get updated data
      const vocabularyData = await getVocabulary()
      setWordsLearned(Array.isArray(vocabularyData) ? vocabularyData : [])
      
      // Move to next word or finish
      const remainingWords = wordsLearned.filter(word => !word.mastered)
      if (currentPracticeIndex < remainingWords.length - 1) {
        setCurrentPracticeIndex(currentPracticeIndex + 1)
        setShowAnswer(false)
      } else {
        setPracticeMode(false)
        setCurrentPracticeIndex(0)
        setShowAnswer(false)
        alert('Pratique terminée ! 🎉')
      }
    } catch (error) {
      console.error('Failed to update word progress:', error)
    }
  }

  const exitPractice = () => {
    setPracticeMode(false)
    setCurrentPracticeIndex(0)
    setShowAnswer(false)
  }

  const LEVEL_LABELS = {
    debutant: 'Débutant',
    intermediaire: 'Intermédiaire',
    avance: 'Avancé',
  }

  const LEVEL_COLORS = {
    debutant: '#10B981',
    intermediaire: '#F59E0B',
    avance: '#EF4444',
  }

  const LANG_FLAGS = {
    fr: '🇫🇷', us: '🇺🇸', es: '🇪🇸', de: '🇩🇪',
  }

  const weeklyActivity = [
    { day: 'Lun', minutes: 15 },
    { day: 'Mar', minutes: 25 },
    { day: 'Mer', minutes: 10 },
    { day: 'Jeu', minutes: 30 },
    { day: 'Ven', minutes: 20 },
    { day: 'Sam', minutes: 45 },
    { day: 'Dim', minutes: 0 },
  ]

  if (loading) return <div className={styles.loading}>Chargement...</div>

  const maxActivity = Math.max(...weeklyActivity.map(a => a.minutes))

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span>LinguaAI</span>
        </div>

        <div className={styles.userCard}>
          <div className={styles.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
          <div className={styles.userInfo}>
            <div className={styles.username}>{user?.username}</div>
            <div className={styles.levelBadge} style={{ backgroundColor: LEVEL_COLORS[user?.level] }}>
              {LEVEL_LABELS[user?.level]}
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          <button 
            className={`${styles.navBtn} ${activeTab === 'overview' ? styles.navActive : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Globe size={20} />
            <span>Vue d'ensemble</span>
          </button>
          <button 
            className={`${styles.navBtn} ${activeTab === 'stats' ? styles.navActive : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <BarChart3 size={20} />
            <span>Statistiques</span>
          </button>
          <button 
            className={`${styles.navBtn} ${activeTab === 'words' ? styles.navActive : ''}`}
            onClick={() => setActiveTab('words')}
          >
            <BookMarked size={20} />
            <span>Mots appris</span>
          </button>
          <button 
            className={`${styles.navBtn} ${activeTab === 'profile' ? styles.navActive : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} />
            <span>Profil</span>
          </button>
          <div className={styles.navDivider}></div>
          <button onClick={handleLogout} className={styles.navBtn}>
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.greeting}>Bonjour, {user?.username} 👋</h1>
            <p className={styles.subtext}>Continuons votre apprentissage !</p>
          </div>
          <button className={styles.newBtn} onClick={handleNewConversation}>
            <Plus size={20} />
            <span>Nouvelle conversation</span>
          </button>
        </header>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className={styles.content}>
            {/* Quick Stats */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={styles.statIcon} style={{ backgroundColor: '#3B82F6' }}>
                    <MessageCircle size={24} color="white" />
                  </div>
                  <TrendingUp size={16} color="#10B981" />
                </div>
                <div className={styles.statValue}>{stats?.total_conversations || 0}</div>
                <div className={styles.statLabel}>Conversations</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={styles.statIcon} style={{ backgroundColor: '#8B5CF6' }}>
                    <BookOpen size={24} color="white" />
                  </div>
                  <ArrowUpRight size={16} color="#10B981" />
                </div>
                <div className={styles.statValue}>{stats?.total_messages || 0}</div>
                <div className={styles.statLabel}>Messages</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={styles.statIcon} style={{ backgroundColor: '#F59E0B' }}>
                    <Award size={24} color="white" />
                  </div>
                  <Star size={16} color="#F59E0B" />
                </div>
                <div className={styles.statValue}>{stats?.total_words_learned || 0}</div>
                <div className={styles.statLabel}>Mots appris</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={styles.statIcon} style={{ backgroundColor: '#EF4444' }}>
                    <Flame size={24} color="white" />
                  </div>
                  <Zap size={16} color="#EF4444" />
                </div>
                <div className={styles.statValue}>{stats?.streak_days || 0}</div>
                <div className={styles.statLabel}>Jours consécutifs</div>
              </div>
            </div>

            {/* Activity & Progress */}
            <div className={styles.grid2Col}>
              {/* Weekly Activity */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <Activity size={20} />
                    Activité de la semaine
                  </h2>
                </div>
                <div className={styles.activityChart}>
                  {weeklyActivity.map((activity, index) => (
                    <div key={index} className={styles.activityBar}>
                      <div 
                        className={styles.activityFill} 
                        style={{ 
                          height: `${(activity.minutes / maxActivity) * 100}%`,
                          backgroundColor: activity.minutes > 0 ? '#3B82F6' : '#E5E7EB'
                        }}
                      />
                      <span className={styles.activityDay}>{activity.day}</span>
                      <span className={styles.activityMinutes}>{activity.minutes}m</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Language Progress */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <Target size={20} />
                    Progression
                  </h2>
                </div>
                <div className={styles.progressList}>
                  <div className={styles.progressItem}>
                    <div className={styles.progressInfo}>
                      <span className={styles.progressFlag}>{LANG_FLAGS[user?.target_language]}</span>
                      <span className={styles.progressLabel}>Objectif quotidien</span>
                    </div>
                    <div className={styles.progressValue}>75%</div>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '75%' }} />
                  </div>
                  
                  <div className={styles.progressItem}>
                    <div className={styles.progressInfo}>
                      <span className={styles.progressFlag}>{LANG_FLAGS[user?.native_language]}</span>
                      <span className={styles.progressLabel}>Niveau actuel</span>
                    </div>
                    <div className={styles.progressValue} style={{ color: LEVEL_COLORS[user?.level] }}>
                      {LEVEL_LABELS[user?.level]}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Conversations */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <Clock size={20} />
                  Conversations récentes
                </h2>
                <button className={styles.viewAll}>
                  Voir tout
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className={styles.convList}>
                {conversations.length === 0 ? (
                  <div className={styles.empty}>
                    <MessageCircle size={48} color="#9CA3AF" />
                    <p>Aucune conversation pour l'instant</p>
                    <button className={styles.startBtn} onClick={handleNewConversation}>
                      Commencer une conversation
                    </button>
                  </div>
                ) : (
                  conversations.slice(0, 5).map(conv => (
                    <div
                      key={conv.id}
                      className={styles.convItem}
                      onClick={() => navigate(`/conversation/${conv.id}`)}
                    >
                      <div className={styles.convIcon}>
                        <MessageCircle size={20} />
                      </div>
                      <div className={styles.convContent}>
                        <div className={styles.convTitle}>{conv.title}</div>
                        <div className={styles.convDate}>
                          {new Date(conv.created_at).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                      <ChevronRight size={20} color="#9CA3AF" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* STATISTICS TAB */}
        {activeTab === 'stats' && (
          <div className={styles.content}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={styles.statIcon} style={{ backgroundColor: '#3B82F6' }}>
                    <Calendar size={24} color="white" />
                  </div>
                </div>
                <div className={styles.statValue}>{stats?.total_conversations || 0}</div>
                <div className={styles.statLabel}>Total conversations</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={styles.statIcon} style={{ backgroundColor: '#10B981' }}>
                    <MessageCircle size={24} color="white" />
                  </div>
                </div>
                <div className={styles.statValue}>{stats?.total_messages || 0}</div>
                <div className={styles.statLabel}>Total messages</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={styles.statIcon} style={{ backgroundColor: '#F59E0B' }}>
                    <BookMarked size={24} color="white" />
                  </div>
                </div>
                <div className={styles.statValue}>{stats?.total_words_learned || 0}</div>
                <div className={styles.statLabel}>Vocabulaire maîtrisé</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={styles.statIcon} style={{ backgroundColor: '#EF4444' }}>
                    <Flame size={24} color="white" />
                  </div>
                </div>
                <div className={styles.statValue}>{stats?.streak_days || 0}</div>
                <div className={styles.statLabel}>Meilleure série</div>
              </div>
            </div>

            <div className={styles.grid2Col}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <Trophy size={20} />
                    Récompenses
                  </h2>
                </div>
                <div className={styles.achievements}>
                  <div className={styles.achievement}>
                    <CheckCircle size={24} color="#10B981" />
                    <div className={styles.achievementInfo}>
                      <div className={styles.achievementName}>Première conversation</div>
                      <div className={styles.achievementDesc}>Complétée</div>
                    </div>
                  </div>
                  <div className={styles.achievement}>
                    <Star size={24} color="#F59E0B" />
                    <div className={styles.achievementInfo}>
                      <div className={styles.achievementName}>7 jours consécutifs</div>
                      <div className={styles.achievementDesc}>{stats?.streak_days >= 7 ? 'Débloqué' : 'En cours'}</div>
                    </div>
                  </div>
                  <div className={styles.achievement}>
                    <Award size={24} color="#8B5CF6" />
                    <div className={styles.achievementInfo}>
                      <div className={styles.achievementName}>100 mots appris</div>
                      <div className={styles.achievementDesc}>{stats?.total_words_learned >= 100 ? 'Débloqué' : `${stats?.total_words_learned || 0}/100`}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <Activity size={20} />
                    Activité hebdomadaire
                  </h2>
                </div>
                <div className={styles.activityChart}>
                  {weeklyActivity.map((activity, index) => (
                    <div key={index} className={styles.activityBar}>
                      <div 
                        className={styles.activityFill} 
                        style={{ 
                          height: `${(activity.minutes / maxActivity) * 100}%`,
                          backgroundColor: activity.minutes > 0 ? '#3B82F6' : '#E5E7EB'
                        }}
                      />
                      <span className={styles.activityDay}>{activity.day}</span>
                      <span className={styles.activityMinutes}>{activity.minutes}m</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WORDS LEARNED TAB */}
        {activeTab === 'words' && (
          <div className={styles.content}>
            {practiceMode ? (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <BookMarked size={20} />
                    Mode Pratique
                  </h2>
                  <button className={styles.cancelBtn} onClick={exitPractice}>
                    Quitter
                  </button>
                </div>
                
                {(() => {
                  const wordsToPractice = wordsLearned.filter(word => !word.mastered)
                  const currentWord = wordsToPractice[currentPracticeIndex]
                  
                  if (!currentWord) {
                    return (
                      <div className={styles.empty}>
                        <CheckCircle size={48} color="#10B981" />
                        <p>Excellent ! Vous avez maîtrisé tous vos mots !</p>
                      </div>
                    )
                  }
                  
                  return (
                    <div className={styles.practiceContainer}>
                      <div className={styles.practiceProgress}>
                        <span>{currentPracticeIndex + 1} / {wordsToPractice.length}</span>
                      </div>
                      
                      <div className={styles.flashcard}>
                        <div className={styles.flashcardWord}>
                          {currentWord.word}
                        </div>
                        
                        {showAnswer ? (
                          <div className={styles.flashcardAnswer}>
                            <div className={styles.answerLabel}>Traduction:</div>
                            <div className={styles.answerText}>{currentWord.translation}</div>
                            <div className={styles.answerActions}>
                              <button 
                                className={styles.incorrectBtn}
                                onClick={() => handlePracticeAnswer(false)}
                              >
                                ❌ Je ne savais pas
                              </button>
                              <button 
                                className={styles.correctBtn}
                                onClick={() => handlePracticeAnswer(true)}
                              >
                                ✅ Je savais
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            className={styles.showAnswerBtn}
                            onClick={() => setShowAnswer(true)}
                          >
                            Voir la réponse
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <BookMarked size={20} />
                    Mots appris ({wordsLearned.length})
                  </h2>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button className={styles.practiceBtn} onClick={startPractice}>
                      <Zap size={16} />
                      <span>Pratiquer</span>
                    </button>
                    <div className={styles.filterGroup}>
                      <button 
                        className={`${styles.filterBtn} ${selectedWordFilter === 'all' ? styles.filterActive : ''}`}
                        onClick={() => setSelectedWordFilter('all')}
                      >
                        Tous
                      </button>
                      <button 
                        className={`${styles.filterBtn} ${selectedWordFilter === 'mastered' ? styles.filterActive : ''}`}
                        onClick={() => setSelectedWordFilter('mastered')}
                      >
                        Maîtrisés
                      </button>
                      <button 
                        className={`${styles.filterBtn} ${selectedWordFilter === 'learning' ? styles.filterActive : ''}`}
                        onClick={() => setSelectedWordFilter('learning')}
                      >
                        En cours
                      </button>
                    </div>
                  </div>
                </div>
              
              <div className={styles.wordsGrid}>
                {wordsLearned.length === 0 ? (
                  <div className={styles.empty}>
                    <BookMarked size={48} color="#9CA3AF" />
                    <p>Aucun mot appris pour le moment</p>
                    <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '8px' }}>
                      Commencez une conversation pour apprendre de nouveaux mots !
                    </p>
                  </div>
                ) : (
                  (() => {
                    const filteredWords = wordsLearned.filter(word => {
                      if (selectedWordFilter === 'mastered') return word.mastered
                      if (selectedWordFilter === 'learning') return !word.mastered
                      return true
                    })
                    
                    if (filteredWords.length === 0) {
                      return (
                        <div className={styles.empty}>
                          <BookMarked size={48} color="#9CA3AF" />
                          <p>Aucun mot {selectedWordFilter === 'mastered' ? 'maîtrisé' : 'en cours'}</p>
                        </div>
                      )
                    }
                    
                    return filteredWords.map(word => (
                      <div key={word.id} className={styles.wordCard}>
                        <div className={styles.wordHeader}>
                          <span className={styles.wordFlag}>{LANG_FLAGS[word.language]}</span>
                          <span className={`${styles.wordBadge} ${word.mastered ? styles.mastered : styles.learning}`}>
                            {word.mastered ? 'Maîtrisé' : 'En cours'}
                          </span>
                        </div>
                        <div className={styles.wordContent}>
                          <div className={styles.wordText}>{word.word}</div>
                          <div className={styles.wordTranslation}>{word.translation}</div>
                        </div>
                        <div className={styles.wordFooter}>
                          <span className={styles.wordCategory}>{word.category}</span>
                          <span className={styles.wordPracticed}>
                            {word.last_practiced ? new Date(word.last_practiced).toLocaleDateString('fr-FR', { 
                              day: 'numeric', 
                              month: 'short'
                            }) : 'Jamais'}
                          </span>
                        </div>
                      </div>
                    ))
                  })()
                )}
              </div>
            </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className={styles.content}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <User size={20} />
                  Profil utilisateur
                </h2>
                {!editMode ? (
                  <button className={styles.editBtn} onClick={() => setEditMode(true)}>
                    Modifier
                  </button>
                ) : (
                  <div className={styles.profileActions}>
                    <button className={styles.cancelBtn} onClick={() => {
                      setEditMode(false)
                      setProfileForm({
                        username: user?.username || '',
                        email: user?.email || '',
                        native_language: user?.native_language || 'fr',
                        target_language: user?.target_language || 'en',
                        level: user?.level || 'debutant',
                      })
                    }}>
                      Annuler
                    </button>
                    <button className={styles.saveBtn} onClick={handleProfileUpdate}>
                      <Save size={16} />
                      <span>Enregistrer</span>
                    </button>
                  </div>
                )}
              </div>

              {profileMessage && (
                <div className={`${styles.message} ${profileMessage.includes('success') ? styles.success : styles.error}`}>
                  {profileMessage}
                </div>
              )}

              <div className={styles.profileGrid}>
                <div className={styles.profileSection}>
                  <h3 className={styles.profileSectionTitle}>Informations personnelles</h3>
                  <div className={styles.profileField}>
                    <label className={styles.profileLabel}>Nom d'utilisateur</label>
                    {editMode ? (
                      <input
                        type="text"
                        className={styles.profileInput}
                        value={profileForm.username}
                        onChange={(e) => handleProfileChange('username', e.target.value)}
                      />
                    ) : (
                      <div className={styles.profileValue}>{user?.username}</div>
                    )}
                  </div>

                  <div className={styles.profileField}>
                    <label className={styles.profileLabel}>Email</label>
                    {editMode ? (
                      <input
                        type="email"
                        className={styles.profileInput}
                        value={profileForm.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                      />
                    ) : (
                      <div className={styles.profileValue}>{user?.email}</div>
                    )}
                  </div>
                </div>

                <div className={styles.profileSection}>
                  <h3 className={styles.profileSectionTitle}>Préférences linguistiques</h3>
                  <div className={styles.profileField}>
                    <label className={styles.profileLabel}>Langue maternelle</label>
                    {editMode ? (
                      <select
                        className={styles.profileSelect}
                        value={profileForm.native_language}
                        onChange={(e) => handleProfileChange('native_language', e.target.value)}
                      >
                        <option value="fr">🇫🇷 Français</option>
                        <option value="en">🇺🇸 English</option>
                        <option value="es">🇪🇸 Español</option>
                        <option value="de">🇩🇪 Deutsch</option>
                      </select>
                    ) : (
                      <div className={styles.profileValue}>
                        <span className={styles.languageFlag}>{LANG_FLAGS[user?.native_language]}</span>
                        {user?.native_language === 'fr' ? 'Français' : 
                         user?.native_language === 'en' ? 'English' : 
                         user?.native_language === 'es' ? 'Español' : 'Deutsch'}
                      </div>
                    )}
                  </div>

                  <div className={styles.profileField}>
                    <label className={styles.profileLabel}>Langue cible</label>
                    {editMode ? (
                      <select
                        className={styles.profileSelect}
                        value={profileForm.target_language}
                        onChange={(e) => handleProfileChange('target_language', e.target.value)}
                      >
                        <option value="fr">🇫🇷 Français</option>
                        <option value="en">🇺🇸 English</option>
                        <option value="es">🇪🇸 Español</option>
                        <option value="de">🇩🇪 Deutsch</option>
                      </select>
                    ) : (
                      <div className={styles.profileValue}>
                        <span className={styles.languageFlag}>{LANG_FLAGS[user?.target_language]}</span>
                        {user?.target_language === 'fr' ? 'Français' : 
                         user?.target_language === 'en' ? 'English' : 
                         user?.target_language === 'es' ? 'Español' : 'Deutsch'}
                      </div>
                    )}
                  </div>

                  <div className={styles.profileField}>
                    <label className={styles.profileLabel}>Niveau</label>
                    {editMode ? (
                      <select
                        className={styles.profileSelect}
                        value={profileForm.level}
                        onChange={(e) => handleProfileChange('level', e.target.value)}
                      >
                        <option value="debutant">Débutant</option>
                        <option value="intermediaire">Intermédiaire</option>
                        <option value="avance">Avancé</option>
                      </select>
                    ) : (
                      <div className={styles.profileValue}>
                        <span 
                          className={styles.levelBadgeInline} 
                          style={{ backgroundColor: LEVEL_COLORS[user?.level] }}
                        >
                          {LEVEL_LABELS[user?.level]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
