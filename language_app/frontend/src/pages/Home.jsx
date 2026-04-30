import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, BookOpen, Brain, Lightbulb, BarChart3, Globe, Zap, Shield, ArrowRight, Languages, Play, Star, Users, TrendingUp, Mail, Phone, MapPin, X, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react'
import { login, register } from '../services/api'
import styles from './Home.module.css'

export default function Home() {
  const navigate = useNavigate()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [visibleSections, setVisibleSections] = useState(new Set())
  
  // Login form state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  
  // Register form state
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    native_language: 'fr',
    target_language: 'en',
    level: 'debutant',
  })
  const [registerError, setRegisterError] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]))
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const handleLoginClick = () => {
    setShowLoginModal(true)
    setShowRegisterModal(false)
    setShowLoginPassword(false)
    setShowRegisterPassword(false)
  }

  const handleRegisterClick = () => {
    setShowRegisterModal(true)
    setShowLoginModal(false)
    setShowLoginPassword(false)
    setShowRegisterPassword(false)
  }

  const closeModals = () => {
    setShowLoginModal(false)
    setShowRegisterModal(false)
    setShowForgotPassword(false)
    setLoginError('')
    setRegisterError('')
    setForgotPasswordMessage('')
    setForgotPasswordEmail('')
    setShowLoginPassword(false)
    setShowRegisterPassword(false)
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    
    try {
      const data = await login(loginForm.email, loginForm.password)
      setLoginLoading(false)
      
      if (data.access_token) {
        closeModals()
        navigate('/dashboard')
      } else {
        setLoginError(data.detail || 'Erreur de connexion')
      }
    } catch (err) {
      setLoginLoading(false)
      setLoginError('Erreur de connexion au serveur')
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setRegisterLoading(true)
    setRegisterError('')
    
    const data = await register(registerForm)
    setRegisterLoading(false)
    
    if (data.user_id) {
      setShowRegisterModal(false)
      setShowLoginModal(true)
      setRegisterError('')
    } else {
      setRegisterError(data.detail || 'Erreur lors de l\'inscription')
    }
  }

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault()
    setForgotPasswordMessage('')
    
    // TODO: Implement forgot password API call
    // For now, show a message
    setForgotPasswordMessage(`Un email de réinitialisation a été envoyé à ${forgotPasswordEmail}`)
    
    // Auto close after 3 seconds
    setTimeout(() => {
      setShowForgotPassword(false)
      setShowLoginModal(true)
      setForgotPasswordMessage('')
      setForgotPasswordEmail('')
    }, 3000)
  }

  const features = [
    {
      icon: Mic,
      title: 'Reconnaissance vocale',
      description: 'Enregistrez votre voix et obtenez une traduction instantanée',
      delay: '0s'
    },
    {
      icon: Lightbulb,
      title: 'Explications IA',
      description: 'Comprenez la grammaire et le contexte avec nos explications IA',
      delay: '0.1s'
    },
    {
      icon: BarChart3,
      title: 'Progression suivie',
      description: 'Suivez votre apprentissage avec des statistiques détaillées',
      delay: '0.2s'
    },
    {
      icon: Languages,
      title: 'Plusieurs langues',
      description: 'Apprenez l\'anglais, l\'espagnol, l\'arabe, le chinois et plus',
      delay: '0.3s'
    },
    {
      icon: Zap,
      title: 'Apprentissage rapide',
      description: 'Sessions de 10 minutes seulement - apprenez à votre rythme',
      delay: '0.4s'
    },
    {
      icon: Shield,
      title: '100% Sécurisé',
      description: 'Vos données sont protégées et jamais partagées',
      delay: '0.5s'
    }
  ]

  const languages = [
    { code: 'fr', name: 'Français' },
    { code: 'us', name: 'Américain' },
    { code: 'es', name: 'Espagnol' },
    { code: 'de', name: 'Allemand' }
  ]

  const testimonials = [
    {
      id: 1,
      name: 'Marie Dupont',
      role: 'Étudiante en médecine',
      avatar: 'MD',
      countryCode: 'fr',
      rating: 5,
      text: 'Grâce à Lingua, j\'ai pu améliorer mon anglais médical en seulement 3 mois. Les conversations immersives sont incroyablement réalistes !',
      language: 'Français',
      progress: '+85%'
    },
    {
      id: 2,
      name: 'Ahmed Benali',
      role: 'Ingénieur logiciel',
      avatar: 'AB',
      countryCode: 'dz',
      rating: 5,
      text: 'L\'IA comprend parfaitement le contexte technique. J\'ai appris le vocabulaire spécialisé en programmation très rapidement.',
      language: 'Français',
      progress: '+92%'
    },
    {
      id: 3,
      name: 'Sofia Rodriguez',
      role: 'Professeure d\'espagnol',
      avatar: 'SR',
      countryCode: 'es',
      rating: 5,
      text: 'Je recommande à tous mes élèves. La correction instantanée et les explications grammaticales sont exceptionnelles.',
      language: 'Espagnol',
      progress: '+78%'
    },
    {
      id: 4,
      name: 'Thomas Mueller',
      role: 'Entrepreneur',
      avatar: 'TM',
      countryCode: 'de',
      rating: 4,
      text: 'Parfait pour les voyages d\'affaires. J\'ai appris l\'arabe commercial en quelques semaines. L\'approche est vraiment innovante.',
      language: 'Arabe',
      progress: '+65%'
    },
    {
      id: 5,
      name: 'Emma Chen',
      role: 'Étudiante internationale',
      avatar: 'EC',
      countryCode: 'cn',
      rating: 5,
      text: 'Passer du chinois au français n\'a jamais été aussi facile. Les sessions de 10 minutes sont parfaites pour mon emploi du temps chargé.',
      language: 'Français',
      progress: '+88%'
    },
    {
      id: 6,
      name: 'Lucas Silva',
      role: 'Designer UX/UI',
      avatar: 'LS',
      countryCode: 'br',
      rating: 5,
      text: 'L\'interface est intuitive et l\'IA s\'adapte à mon niveau. J\'ai enfin confiance pour parler en italien !',
      language: 'Italien',
      progress: '+73%'
    }
  ]

  return (
    <div className={styles.container}>
      {/* Animated Background */}
      <div className={styles.animatedBg}>
        <div className={styles.bgCircle1}></div>
        <div className={styles.bgCircle2}></div>
        <div className={styles.bgCircle3}></div>
      </div>

      {/* Navigation Header */}
      <header className={`${styles.header} ${scrollY > 50 ? styles.headerScrolled : ''}`}>
        <div className={styles.logo}>
          <span>Lingua</span>
        </div>
        <nav className={styles.nav}>
          <button className={styles.navBtn} onClick={handleLoginClick}>
            Connexion
          </button>
          <button className={`${styles.navBtn} ${styles.primary}`} onClick={handleRegisterClick}>
            S'inscrire
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Apprenez une langue{' '}
            <span className={styles.highlight}>intelligemment</span>
          </h1>
          
          <p className={styles.subtitle}>
            Converser en immersion, traduire au vol, et progresser rapidement avec l'IA
          </p>

          <div className={styles.ctaButtons}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleRegisterClick}>
              Commencer gratuitement <ArrowRight size={18} />
            </button>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleLoginClick}>
              Se connecter
            </button>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <div className={styles.heroStatNumber}>10K+</div>
              <div className={styles.heroStatLabel}>Utilisateurs</div>
            </div>
            <div className={styles.heroStatDivider}></div>
            <div className={styles.heroStat}>
              <div className={styles.heroStatNumber}>4.9★</div>
              <div className={styles.heroStatLabel}>Rating</div>
            </div>
            <div className={styles.heroStatDivider}></div>
            <div className={styles.heroStat}>
              <div className={styles.heroStatNumber}>8</div>
              <div className={styles.heroStatLabel}>Langues</div>
            </div>
          </div>

          <div className={styles.heroLanguages}>
            <p className={styles.heroLanguagesLabel}>Apprenez avec nous :</p>
            <div className={styles.heroLanguageFlags}>
              {languages.map((lang) => (
                <div key={lang.code} className={styles.heroLanguageItem}>
                  <span className={`fi fi-${lang.code}`}></span>
                  <span className={styles.heroLanguageName}>{lang.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hero Illustration */}
        <div className={styles.heroIllustration}>
          <div className={`${styles.illustrationCard} ${styles.illustrationCard1}`}>
            <div className={styles.illustrationCircle}>
              <Mic size={40} color="#FF7A1A" />
            </div>
            <p className={styles.illustrationText}>Conversation</p>
          </div>
          <div className={`${styles.illustrationCard} ${styles.illustrationCard2}`}>
            <div className={styles.illustrationCircle}>
              <BookOpen size={40} color="#FF7A1A" />
            </div>
            <p className={styles.illustrationText}>Traduction</p>
          </div>
          <div className={`${styles.illustrationCard} ${styles.illustrationCard3}`}>
            <div className={styles.illustrationCircle}>
              <Brain size={40} color="#FF7A1A" />
            </div>
            <p className={styles.illustrationText}>Intelligence</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features} id="features" data-animate>
        <h2 className={visibleSections.has('features') ? styles.animateIn : ''}>
          Pourquoi choisir Lingua ?
        </h2>
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div 
                key={index} 
                className={`${styles.featureCard} ${visibleSections.has('features') ? styles.animateIn : ''}`}
                style={{ animationDelay: feature.delay }}
              >
                <div className={styles.featureIcon}>
                  <Icon size={40} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={styles.testimonials} id="testimonials" data-animate>
        <h2 className={visibleSections.has('testimonials') ? styles.animateIn : ''}>
          Ce que disent nos utilisateurs
        </h2>
        <div className={styles.testimonialsGrid}>
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.id} 
              className={`${styles.testimonialCard} ${visibleSections.has('testimonials') ? styles.animateIn : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={styles.testimonialHeader}>
                <div className={styles.testimonialAvatar}>
                  {testimonial.avatar}
                </div>
                <div className={styles.testimonialInfo}>
                  <h3>{testimonial.name}</h3>
                  <p className={styles.testimonialRole}>{testimonial.role}</p>
                </div>
              </div>
                            
              <div className={styles.testimonialRating}>
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={16} 
                    fill={i < testimonial.rating ? '#FF7A1A' : 'none'} 
                    color={i < testimonial.rating ? '#FF7A1A' : '#334155'} 
                  />
                ))}
              </div>
                            
              <p className={styles.testimonialText}>"{testimonial.text}"</p>
                            
              <div className={styles.testimonialFooter}>
                <span className={styles.testimonialLanguage}>
                  <span className={`fi fi-${testimonial.countryCode}`} style={{ fontSize: '18px', marginRight: '6px' }}></span>
                  {testimonial.language}
                </span>
                <span className={styles.testimonialProgress}>
                  <TrendingUp size={14} />
                  {testimonial.progress}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.finalCta} id="cta" data-animate>
        <div className={visibleSections.has('cta') ? styles.animateIn : ''}>
          <h2>Prêt à commencer votre voyage linguistique ?</h2>
          <button className={`${styles.btn} ${styles.btnLarge}`} onClick={handleRegisterClick}>
            Créer un compte gratuitement
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerGrid}>
            {/* Company Info */}
            <div className={styles.footerColumn}>
              <div className={styles.footerLogo}>
                <Globe size={24} />
                <span>Lingua</span>
              </div>
              <p className={styles.footerDescription}>
                Apprenez les langues intelligemment avec l'IA. Conversation en immersion, traduction au vol, et progression rapide.
              </p>
              <div className={styles.footerSocial}>
                <a href="#" className={styles.socialLink}>FB</a>
                <a href="#" className={styles.socialLink}>TW</a>
                <a href="#" className={styles.socialLink}>IG</a>
                <a href="#" className={styles.socialLink}>LI</a>
                <a href="#" className={styles.socialLink}>GH</a>
              </div>
            </div>

            {/* Quick Links */}
            <div className={styles.footerColumn}>
              <h3 className={styles.footerTitle}>Liens rapides</h3>
              <ul className={styles.footerLinks}>
                <li><a href="#" className={styles.footerLink}>Accueil</a></li>
                <li><a href="#features" className={styles.footerLink}>Fonctionnalités</a></li>
                <li><a href="#testimonials" className={styles.footerLink}>Témoignages</a></li>
                <li><a href="#" className={styles.footerLink}>Tarifs</a></li>
                <li><a href="#" className={styles.footerLink}>Blog</a></li>
              </ul>
            </div>

            {/* Languages */}
            <div className={styles.footerColumn}>
              <h3 className={styles.footerTitle}>Langues</h3>
              <ul className={styles.footerLinks}>
                <li><a href="#" className={styles.footerLink}>Anglais</a></li>
                <li><a href="#" className={styles.footerLink}>Espagnol</a></li>
                <li><a href="#" className={styles.footerLink}>Arabe</a></li>
                <li><a href="#" className={styles.footerLink}>Chinois</a></li>
                <li><a href="#" className={styles.footerLink}>Français</a></li>
              </ul>
            </div>

            {/* Support */}
            <div className={styles.footerColumn}>
              <h3 className={styles.footerTitle}>Support</h3>
              <ul className={styles.footerLinks}>
                <li><a href="#" className={styles.footerLink}>Centre d'aide</a></li>
                <li><a href="#" className={styles.footerLink}>Documentation</a></li>
                <li><a href="#" className={styles.footerLink}>Contact</a></li>
                <li><a href="#" className={styles.footerLink}>FAQ</a></li>
                <li><a href="#" className={styles.footerLink}>Communauté</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div className={styles.footerColumn}>
              <h3 className={styles.footerTitle}>Contact</h3>
              <div className={styles.footerContact}>
                <div className={styles.contactItem}>
                  <Mail size={16} />
                  <span>contact@linguaai.com</span>
                </div>
                <div className={styles.contactItem}>
                  <Phone size={16} />
                  <span>+33 1 23 45 67 89</span>
                </div>
                <div className={styles.contactItem}>
                  <MapPin size={16} />
                  <span>Paris, France</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className={styles.footerBottom}>
            <div className={styles.footerBottomContent}>
              <p className={styles.copyright}>
                &copy; 2024 Lingua. Tous droits réservés.
              </p>
              <div className={styles.footerBottomLinks}>
                <a href="#" className={styles.bottomLink}>Politique de confidentialité</a>
                <a href="#" className={styles.bottomLink}>Conditions d'utilisation</a>
                <a href="#" className={styles.bottomLink}>Mentions légales</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className={styles.modalOverlay} onClick={closeModals}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={closeModals}>
              <X size={24} />
            </button>
            
            <div className={styles.modalLogo}>
              <LogIn size={40} />
              <span>Lingua</span>
            </div>
            <h2 className={styles.modalTitle}>Connexion</h2>
            <p className={styles.modalSubtitle}>Reprenez votre apprentissage</p>

            {loginError && <div className={styles.modalError}>{loginError}</div>}

            <form onSubmit={handleLoginSubmit} className={styles.modalForm}>
              <div className={styles.modalField}>
                <label>Email</label>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={loginForm.email}
                  onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </div>
              <div className={styles.modalField}>
                <label>Mot de passe</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleButton}
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    aria-label={showLoginPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className={styles.forgotPasswordLink}>
                <button type="button" onClick={() => { setShowLoginModal(false); setShowForgotPassword(true); }} className={styles.forgotPasswordBtn}>
                  Mot de passe oublié ?
                </button>
              </div>
              <button type="submit" className={styles.modalBtn} disabled={loginLoading}>
                {loginLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <p className={styles.modalLink}>
              Pas encore de compte ?{' '}
              <button onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }} className={styles.modalLinkBtn}>
                S'inscrire
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className={styles.modalOverlay} onClick={closeModals}>
          <div className={`${styles.modal} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={closeModals}>
              <X size={24} />
            </button>
            
            <div className={styles.modalLogo}>
              <UserPlus size={40} />
              <span>Lingua</span>
            </div>
            <h2 className={styles.modalTitle}>Créer un compte</h2>
            <p className={styles.modalSubtitle}>Commencez votre aventure linguistique</p>

            {registerError && <div className={styles.modalError}>{registerError}</div>}

            <form onSubmit={handleRegisterSubmit} className={styles.modalForm}>
              <div className={styles.modalField}>
                <label>Nom d'utilisateur</label>
                <input
                  type="text"
                  placeholder="john_doe"
                  value={registerForm.username}
                  onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })}
                  required
                />
              </div>
              <div className={styles.modalField}>
                <label>Email</label>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={registerForm.email}
                  onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                  required
                />
              </div>
              <div className={styles.modalField}>
                <label>Mot de passe</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={registerForm.password}
                    onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleButton}
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    aria-label={showRegisterPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showRegisterPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className={styles.modalRow}>
                <div className={styles.modalField}>
                  <label>Langue maternelle</label>
                  <select value={registerForm.native_language} onChange={e => setRegisterForm({ ...registerForm, native_language: e.target.value })}>
                    <option value="fr">🇫🇷 Français</option>
                    <option value="us">🇺🇸 Américain</option>
                    <option value="es">🇪🇸 Espagnol</option>
                    <option value="de">🇩🇪 Allemand</option>
                  </select>
                </div>
                <div className={styles.modalField}>
                  <label>Langue cible</label>
                  <select value={registerForm.target_language} onChange={e => setRegisterForm({ ...registerForm, target_language: e.target.value })}>
                    <option value="fr">🇫🇷 Français</option>
                    <option value="us">🇺🇸 Américain</option>
                    <option value="es">🇪🇸 Espagnol</option>
                    <option value="de">🇩🇪 Allemand</option>
                  </select>
                </div>
              </div>
              <div className={styles.modalField}>
                <label>Niveau actuel</label>
                <select value={registerForm.level} onChange={e => setRegisterForm({ ...registerForm, level: e.target.value })}>
                  <option value="debutant">Débutant</option>
                  <option value="intermediaire">Intermédiaire</option>
                  <option value="avance">Avancé</option>
                </select>
              </div>
              <button type="submit" className={styles.modalBtn} disabled={registerLoading}>
                {registerLoading ? 'Création...' : 'Créer mon compte'}
              </button>
            </form>

            <p className={styles.modalLink}>
              Déjà un compte ?{' '}
              <button onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }} className={styles.modalLinkBtn}>
                Se connecter
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className={styles.modalOverlay} onClick={closeModals}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={closeModals}>
              <X size={24} />
            </button>
            
            <div className={styles.modalLogo}>
              <Mail size={40} />
              <span>Lingua</span>
            </div>
            <h2 className={styles.modalTitle}>Mot de passe oublié ?</h2>
            <p className={styles.modalSubtitle}>
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>

            {forgotPasswordMessage && (
              <div className={styles.modalSuccess}>{forgotPasswordMessage}</div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className={styles.modalForm}>
              <div className={styles.modalField}>
                <label>Email</label>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={forgotPasswordEmail}
                  onChange={e => setForgotPasswordEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className={styles.modalBtn}>
                Envoyer le lien de réinitialisation
              </button>
            </form>

            <p className={styles.modalLink}>
              Vous vous en souvenez ?{' '}
              <button onClick={() => { setShowForgotPassword(false); setShowLoginModal(true); }} className={styles.modalLinkBtn}>
                Se connecter
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}


