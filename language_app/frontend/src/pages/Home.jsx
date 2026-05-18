import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, Eye, EyeOff, Loader2, CheckCircle,
  Sparkles, Bot, Wand2, BookMarked, Mic2, Trophy, Rocket,
  Github, Twitter, Youtube, Facebook, Instagram
} from 'lucide-react'
import { login, register, getProfile } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

/* ── Language options ──────────────────────────────────────────────────── */
const LANGUAGES = [
  { value: 'en', label: '🇬🇧 Anglais' },
  { value: 'es', label: '🇪🇸 Espagnol' },
  { value: 'de', label: '🇩🇪 Allemand' },
  { value: 'ar', label: '🇸🇦 Arabe' },
  { value: 'it', label: '🇮🇹 Italien' },
  { value: 'pt', label: '🇧🇷 Portugais' },
  { value: 'zh', label: '🇨🇳 Chinois' },
  { value: 'ja', label: '🇯🇵 Japonais' },
  { value: 'fr', label: '🇫🇷 Français' },
]

/* ── Features highlighting AI impact ─────────────────────────────────── */
const FEATURES = [
  {
    icon: Bot,
    title: 'Coach IA Personnel',
    desc: "Conversez avec un tuteur IA qui parle votre langue cible, s'adapte à votre niveau et vous corrige avec bienveillance.",
    accent: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    tag: 'IA',
  },
  {
    icon: Wand2,
    title: 'Corrections Instantanées',
    desc: "Chaque message est analysé : grammaire, conjugaison, style. Explications claires en français.",
    accent: 'from-blue-500 to-cyan-500',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    tag: 'Smart',
  },
  {
    icon: BookMarked,
    title: 'Vocabulaire Intelligent',
    desc: "L'IA extrait chaque nouveau mot, l'enregistre dans votre carnet personnel avec contexte et traduction.",
    accent: 'from-emerald-500 to-teal-500',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    tag: 'Mémoire',
  },
  {
    icon: Mic2,
    title: 'Voix en Temps Réel',
    desc: "Parlez à voix haute. L'IA transcrit, traduit et analyse votre expression orale en quelques secondes.",
    accent: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    tag: 'Oral',
  },
  {
    icon: Trophy,
    title: 'Progression Gamifiée',
    desc: "Streak quotidien, XP, badges et niveaux — chaque session compte et vous maintient motivé.",
    accent: 'from-rose-500 to-pink-600',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    tag: 'Niveau',
  },
  {
    icon: Rocket,
    title: 'Immersion Accélérée',
    desc: "L'apprentissage par immersion avec l'IA est 3× plus rapide que les méthodes classiques.",
    accent: 'from-indigo-500 to-blue-700',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    tag: '3× Rapide',
  },
]

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate       = useNavigate()
  const { loginUser }  = useAuth()

  const [modal,   setModal]   = useState(null)   // 'login' | 'register'
  const [showPwd, setShowPwd] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm,   setRegForm]   = useState({
    username: '', email: '', password: '',
    native_language: 'fr', target_language: 'en', level: 'debutant',
  })

  const openLogin    = () => { setModal('login');    resetAlerts(); setShowPwd(false) }
  const openRegister = () => { setModal('register'); resetAlerts(); setShowPwd(false) }
  const closeModal   = () => { setModal(null);       resetAlerts() }
  const resetAlerts  = () => { setError(''); setSuccess('') }

  /* ── Login ── */
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); resetAlerts()
    try {
      const data = await login(loginForm.email, loginForm.password)
      if (data.access_token) {
        const profile = await getProfile()
        loginUser(profile)
        closeModal()
        navigate('/dashboard')
      } else {
        setError(data.detail || 'Email ou mot de passe incorrect')
      }
    } catch {
      setError('Impossible de joindre le serveur')
    }
    setLoading(false)
  }

  /* ── Register ── */
  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true); resetAlerts()
    try {
      const data = await register(regForm)
      if (data.user_id) {
        setSuccess('Compte créé avec succès ! Connectez-vous maintenant.')
        setTimeout(openLogin, 1800)
      } else {
        setError(data.detail || "Erreur lors de l'inscription")
      }
    } catch {
      setError('Impossible de joindre le serveur')
    }
    setLoading(false)
  }

  /* ── Render ── */
  return (
    <div className="min-h-screen font-duo">

      {/* ════ NAVBAR ════════════════════════════════════════════════════ */}
      <header className="bg-white border-b-2 border-duo-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-4xl">🦉</span>
            <span className="text-2xl font-black text-duo-green tracking-tight">Lingua</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={openLogin}
              className="duo-btn duo-btn-ghost text-xs px-5 py-2.5">
              CONNEXION
            </button>
            <button onClick={openRegister}
              className="duo-btn duo-btn-green text-xs px-5 py-2.5">
              S'INSCRIRE
            </button>
          </div>
        </div>
      </header>

      {/* ════ HERO ══════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12">
          {/* Text side */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black text-duo-text leading-tight mb-4">
              Apprenez une langue<br />
              <span className="text-duo-green">gratuitement</span> avec l'IA
            </h1>
            <p className="text-duo-muted text-lg font-semibold mb-8 max-w-md mx-auto md:mx-0">
              L'IA vous aide à progresser 3× plus vite grâce à des conversations immersives, des corrections instantanées et un suivi personnalisé.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <button onClick={openRegister}
                className="duo-btn duo-btn-green text-base px-10 py-4">
                COMMENCER GRATUITEMENT
              </button>
              <button onClick={openLogin}
                className="duo-btn duo-btn-ghost text-base px-10 py-4">
                J'AI DÉJÀ UN COMPTE
              </button>
            </div>
          </div>

          {/* Mascot + chat preview */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-72">
              {/* Owl mascot */}
              <div className="text-center mb-4">
                <span className="text-9xl animate-float inline-block">🦉</span>
              </div>
              {/* Fake chat preview */}
              <div className="duo-card space-y-3">
                <div className="flex items-end gap-2">
                  <span className="text-2xl">🦉</span>
                  <div className="bg-duo-gray rounded-duo-lg rounded-bl-sm px-4 py-2.5 text-sm font-semibold text-duo-text max-w-[180px]">
                    Bonjour ! Parlez-moi en français, je vous répondrai en anglais 😊
                  </div>
                </div>
                <div className="flex items-end gap-2 flex-row-reverse">
                  <span className="text-2xl">🧑‍🎓</span>
                  <div className="bg-duo-blue text-white rounded-duo-lg rounded-br-sm px-4 py-2.5 text-sm font-semibold max-w-[180px]">
                    J'aime apprendre les langues !
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl">🦉</span>
                  <div className="bg-duo-gray rounded-duo-lg rounded-bl-sm px-4 py-2.5 text-sm font-semibold text-duo-text max-w-[180px]">
                    I love learning languages! Great sentence 🎉
                  </div>
                </div>
                {/* AI badge */}
                <div className="flex justify-center pt-1">
                  <span className="duo-badge bg-duo-purple-bg text-duo-purple border border-purple-200 text-xs">
                    <Sparkles size={11} /> Propulsé par l'IA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ STATS ══════════════════════════════════════════════════════ */}
      <section className="bg-duo-green py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-3 gap-4 text-center text-white">
          {[['10K+', 'Apprenants actifs'], ['500K+', 'Leçons complétées'], ['9', 'Langues disponibles']].map(([n, l]) => (
            <div key={l}>
              <div className="text-3xl md:text-4xl font-black">{n}</div>
              <div className="text-sm font-bold opacity-80 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════ FEATURES (AI impact) ══════════════════════════════════════ */}
      <section className="py-20 px-4 bg-gradient-to-b from-white via-slate-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-5">
              <Sparkles size={12} />
              Intelligence Artificielle
            </div>
            <h2 className="text-4xl font-black text-duo-text mb-3">
              L'IA{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                réinvente
              </span>{' '}
              l'apprentissage
            </h2>
            <p className="text-duo-muted font-semibold max-w-xl mx-auto text-lg">
              Six fonctionnalités propulsées par l'IA pour que vous progressiez plus vite et plus longtemps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group">
                {/* Gradient top bar */}
                <div className={`h-1.5 bg-gradient-to-r ${f.accent}`} />
                <div className="p-6">
                  <h3 className="font-extrabold text-duo-text text-base mb-2">{f.title}</h3>
                  <p className="text-duo-muted text-sm font-semibold leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ HOW IT WORKS ══════════════════════════════════════════════ */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center text-duo-text mb-12">Comment ça marche ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: '👤', title: 'Créez votre profil', desc: 'Choisissez votre langue cible et votre niveau. Inscription en 30 secondes.' },
              { step: '2', icon: '💬', title: 'Parlez avec l\'IA', desc: 'Écrivez ou parlez en français. L\'IA répond, traduit et explique en temps réel.' },
              { step: '3', icon: '📈', title: 'Progressez', desc: 'Streak, XP, vocabulaire auto — chaque session mesure votre progression.' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-duo-green flex items-center justify-center text-white text-2xl font-black mx-auto mb-4 shadow-lg">
                  {item.step}
                </div>
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-extrabold text-duo-text text-lg mb-2">{item.title}</h3>
                <p className="text-duo-muted font-semibold text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ CTA ════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <span className="text-6xl block mb-4 animate-bounce-in">🦉</span>
          <h2 className="text-3xl font-black text-duo-text mb-3">Prêt à commencer ?</h2>
          <p className="text-duo-muted font-semibold mb-8">Rejoignez des milliers d'apprenants et voyez l'impact de l'IA sur votre progression.</p>
          <button onClick={openRegister}
            className="duo-btn duo-btn-green text-base px-12 py-4">
            C'EST PARTI !
          </button>
        </div>
      </section>

      {/* ════ FOOTER ═════════════════════════════════════════════════════ */}
      <footer className="bg-white border-t-2 border-duo-border font-duo">

        {/* Main grid */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">

            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl">🦉</span>
                <span className="text-2xl font-black text-duo-green">Lingua</span>
              </div>
              <p className="text-duo-muted text-sm font-semibold leading-relaxed mb-4">
                Apprenez les langues gratuitement avec l'IA. Conversations immersives, corrections instantanées et suivi personnalisé.
              </p>
              {/* Social links */}
              <div className="flex items-center gap-2">
                {[
                  { icon: Twitter,   href: '#', label: 'Twitter'   },
                  { icon: Facebook,  href: '#', label: 'Facebook'  },
                  { icon: Instagram, href: '#', label: 'Instagram' },
                  { icon: Youtube,   href: '#', label: 'YouTube'   },
                  { icon: Github,    href: '#', label: 'GitHub'    },
                ].map(({ icon: Icon, href, label }) => (
                  <a key={label} href={href} title={label}
                    className="w-8 h-8 rounded-full border-2 border-duo-border text-duo-muted hover:text-duo-green hover:border-duo-green flex items-center justify-center transition-colors">
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            {/* Langues */}
            <div>
              <h4 className="font-extrabold text-duo-text uppercase text-xs tracking-wider mb-4">Langues</h4>
              <ul className="space-y-2.5">
                {[
                  { flag:'🇬🇧', name:'Anglais' },
                  { flag:'🇪🇸', name:'Espagnol' },
                  { flag:'🇩🇪', name:'Allemand' },
                  { flag:'🇸🇦', name:'Arabe' },
                  { flag:'🇮🇹', name:'Italien' },
                  { flag:'🇧🇷', name:'Portugais' },
                  { flag:'🇨🇳', name:'Chinois' },
                  { flag:'🇯🇵', name:'Japonais' },
                ].map(l => (
                  <li key={l.name}>
                    <a href="#" onClick={openRegister}
                      className="flex items-center gap-2 text-duo-muted hover:text-duo-green font-semibold text-sm transition-colors">
                      <span>{l.flag}</span> {l.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Fonctionnalités */}
            <div>
              <h4 className="font-extrabold text-duo-text uppercase text-xs tracking-wider mb-4">Fonctionnalités</h4>
              <ul className="space-y-2.5">
                {[
                  'Conversation IA',
                  'Traduction auto',
                  'Explications IA',
                  'Vocabulaire auto',
                  'Reconnaissance vocale',
                  'Streak & XP',
                  'Badges',
                  'Suivi progrès',
                ].map(f => (
                  <li key={f}>
                    <a href="#" onClick={openRegister}
                      className="text-duo-muted hover:text-duo-green font-semibold text-sm transition-colors">
                      {f}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <h4 className="font-extrabold text-duo-text uppercase text-xs tracking-wider mb-4">Ressources</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Blog',                  href: '#'     },
                  { label: 'Guide de démarrage',    href: '#'     },
                  { label: 'FAQ',                   href: '/faq'  },
                  { label: "Conseils d'apprentissage", href: '#'  },
                  { label: 'Méthode Lingua',        href: '#'     },
                  { label: 'IA & éducation',        href: '#'     },
                ].map(r => (
                  <li key={r.label}>
                    <a href={r.href} className="text-duo-muted hover:text-duo-green font-semibold text-sm transition-colors">{r.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Entreprise */}
            <div>
              <h4 className="font-extrabold text-duo-text uppercase text-xs tracking-wider mb-4">Entreprise</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'À propos',       href: '/about' },
                  { label: 'Notre mission',  href: '/about' },
                  { label: "L'équipe",       href: '/about' },
                  { label: 'Carrières',      href: '#'      },
                  { label: 'Presse',         href: '#'      },
                  { label: 'Contact',        href: '#'      },
                ].map(e => (
                  <li key={e.label}>
                    <a href={e.href} className="text-duo-muted hover:text-duo-green font-semibold text-sm transition-colors">{e.label}</a>
                  </li>
                ))}
              </ul>

              {/* App badges */}
              <div className="mt-6 space-y-2">
                <a href="#"
                  className="flex items-center gap-2 bg-duo-text text-white px-3 py-2 rounded-duo-sm hover:bg-gray-700 transition-colors w-fit">
                  <span className="text-lg">🍎</span>
                  <div className="text-left">
                    <div className="text-xs opacity-70 leading-none">Disponible sur</div>
                    <div className="text-sm font-extrabold leading-tight">App Store</div>
                  </div>
                </a>
                <a href="#"
                  className="flex items-center gap-2 bg-duo-text text-white px-3 py-2 rounded-duo-sm hover:bg-gray-700 transition-colors w-fit">
                  <span className="text-lg">🤖</span>
                  <div className="text-left">
                    <div className="text-xs opacity-70 leading-none">Disponible sur</div>
                    <div className="text-sm font-extrabold leading-tight">Google Play</div>
                  </div>
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t-2 border-duo-border bg-duo-gray">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-duo-muted text-xs font-bold">
              © 2025 Lingua. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {[
                'Politique de confidentialité',
                'Conditions d\'utilisation',
                'Cookies',
                'Mentions légales',
                'Accessibilité',
              ].map(l => (
                <a key={l} href="#" className="text-duo-muted hover:text-duo-green text-xs font-bold transition-colors">
                  {l}
                </a>
              ))}
            </div>
            {/* Language switcher */}
            <div className="flex items-center gap-1.5 text-duo-muted text-xs font-bold">
              <span>🌍</span>
              <select className="bg-transparent text-xs font-bold text-duo-muted focus:outline-none cursor-pointer">
                <option>Français</option>
                <option>English</option>
                <option>Español</option>
                <option>Deutsch</option>
              </select>
            </div>
          </div>
        </div>
      </footer>

      {/* ════ MODAL AUTH ═════════════════════════════════════════════════ */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}>
          <div className="bg-white rounded-duo-lg w-full max-w-md shadow-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="p-6 pb-0 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-duo-text">
                  {modal === 'login' ? 'Connexion' : 'Créer un compte'}
                </h2>
                <p className="text-duo-muted font-semibold text-sm mt-0.5">
                  {modal === 'login' ? 'Reprenez votre apprentissage' : 'Commencez à apprendre gratuitement'}
                </p>
              </div>
              <button onClick={closeModal}
                className="p-2 hover:bg-duo-gray rounded-full transition-colors text-duo-muted hover:text-duo-text">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Alerts */}
              {error && (
                <div className="bg-duo-red-bg border-2 border-red-200 text-duo-red text-sm font-bold px-4 py-3 rounded-duo">
                  ⚠️ {error}
                </div>
              )}
              {success && (
                <div className="bg-duo-green-bg border-2 border-green-200 text-duo-green text-sm font-bold px-4 py-3 rounded-duo flex items-center gap-2">
                  <CheckCircle size={15} /> {success}
                </div>
              )}

              {/* ── Login form ── */}
              {modal === 'login' && (
                <form onSubmit={handleLogin} className="space-y-3">
                  <FieldLabel label="Email">
                    <input type="email" placeholder="votre@email.com" required className="duo-input"
                      value={loginForm.email}
                      onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} />
                  </FieldLabel>
                  <FieldLabel label="Mot de passe">
                    <PwdInput value={loginForm.password} show={showPwd}
                      onChange={v => setLoginForm({ ...loginForm, password: v })}
                      toggle={() => setShowPwd(!showPwd)} />
                  </FieldLabel>
                  <button type="submit" disabled={loading}
                    className="duo-btn duo-btn-green w-full text-sm py-3.5 mt-2">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                    {loading ? 'CHARGEMENT...' : 'SE CONNECTER'}
                  </button>
                </form>
              )}

              {/* ── Register form ── */}
              {modal === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3">
                  <FieldLabel label="Nom d'utilisateur">
                    <input type="text" placeholder="jean_dupont" required className="duo-input"
                      value={regForm.username}
                      onChange={e => setRegForm({ ...regForm, username: e.target.value })} />
                  </FieldLabel>
                  <FieldLabel label="Email">
                    <input type="email" placeholder="votre@email.com" required className="duo-input"
                      value={regForm.email}
                      onChange={e => setRegForm({ ...regForm, email: e.target.value })} />
                  </FieldLabel>
                  <FieldLabel label="Mot de passe">
                    <PwdInput value={regForm.password} show={showPwd}
                      onChange={v => setRegForm({ ...regForm, password: v })}
                      toggle={() => setShowPwd(!showPwd)} />
                  </FieldLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <FieldLabel label="Langue maternelle">
                      <select className="duo-select" value={regForm.native_language}
                        onChange={e => setRegForm({ ...regForm, native_language: e.target.value })}>
                        {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </FieldLabel>
                    <FieldLabel label="Langue cible">
                      <select className="duo-select" value={regForm.target_language}
                        onChange={e => setRegForm({ ...regForm, target_language: e.target.value })}>
                        {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </FieldLabel>
                  </div>
                  <FieldLabel label="Niveau actuel">
                    <select className="duo-select" value={regForm.level}
                      onChange={e => setRegForm({ ...regForm, level: e.target.value })}>
                      <option value="debutant">🟢 Débutant</option>
                      <option value="intermediaire">🟡 Intermédiaire</option>
                      <option value="avance">🔴 Avancé</option>
                    </select>
                  </FieldLabel>
                  <button type="submit" disabled={loading}
                    className="duo-btn duo-btn-green w-full text-sm py-3.5 mt-2">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                    {loading ? 'CHARGEMENT...' : 'CRÉER MON COMPTE'}
                  </button>
                </form>
              )}

              {/* Switch link */}
              <p className="text-center text-duo-muted font-bold text-sm pt-1">
                {modal === 'login' ? "Pas de compte ? " : "Déjà inscrit ? "}
                <button onClick={modal === 'login' ? openRegister : openLogin}
                  className="text-duo-blue hover:underline font-extrabold">
                  {modal === 'login' ? "S'INSCRIRE" : "SE CONNECTER"}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Shared mini-components ────────────────────────────────────────────── */
function FieldLabel({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-extrabold text-duo-muted uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function PwdInput({ value, onChange, show, toggle }) {
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} placeholder="••••••••" required
        className="duo-input pr-11"
        value={value} onChange={e => onChange(e.target.value)} />
      <button type="button" onClick={toggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-duo-muted hover:text-duo-text transition-colors">
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  )
}
