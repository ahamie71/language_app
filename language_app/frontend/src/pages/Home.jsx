import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, Eye, EyeOff, Loader2, CheckCircle, AlertCircle,
  Bot, Wand2, BookMarked, Mic2, Trophy, Rocket,
  Github, Twitter, Youtube, Facebook, Instagram,
  MessageSquare, Sparkles, Globe, Users, ChevronRight,
  UserPlus, LogIn, Brain, Zap, BarChart3, Volume2,
  ArrowRight, Shield, Star, Play
} from 'lucide-react'
import { login, register, getProfile } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const LANGUAGES = [
  { value: 'en', label: 'Anglais',   flag: 'gb' },
  { value: 'es', label: 'Espagnol',  flag: 'es' },
  { value: 'de', label: 'Allemand',  flag: 'de' },
  { value: 'ar', label: 'Arabe',     flag: 'sa' },
  { value: 'it', label: 'Italien',   flag: 'it' },
  { value: 'pt', label: 'Portugais', flag: 'br' },
  { value: 'zh', label: 'Chinois',   flag: 'cn' },
  { value: 'ja', label: 'Japonais',  flag: 'jp' },
  { value: 'fr', label: 'Français',  flag: 'fr' },
]

const FEATURES = [
  {
    Icon: Bot,
    title: 'Coach IA Personnel',
    desc: "Un tuteur IA qui s'adapte à votre niveau, corrige vos erreurs et répond dans la langue que vous apprenez.",
    grad: 'from-violet-500 to-purple-600',
    light: 'bg-violet-50',
    color: 'text-violet-600',
  },
  {
    Icon: Wand2,
    title: 'Corrections Instantanées',
    desc: "Chaque message est analysé : grammaire, conjugaison, style. Explications claires dans votre langue.",
    grad: 'from-blue-500 to-cyan-500',
    light: 'bg-blue-50',
    color: 'text-blue-600',
  },
  {
    Icon: BookMarked,
    title: 'Vocabulaire Intelligent',
    desc: "L'IA extrait chaque nouveau mot de vos conversations et l'enregistre dans votre carnet personnel.",
    grad: 'from-emerald-500 to-teal-500',
    light: 'bg-emerald-50',
    color: 'text-emerald-600',
  },
  {
    Icon: Mic2,
    title: 'Voix en Temps Réel',
    desc: "Parlez à voix haute. L'IA transcrit, traduit et analyse votre expression orale en quelques secondes.",
    grad: 'from-amber-500 to-orange-500',
    light: 'bg-amber-50',
    color: 'text-amber-600',
  },
  {
    Icon: Trophy,
    title: 'Progression Gamifiée',
    desc: "Streak quotidien, XP, badges et niveaux — chaque session vous maintient motivé et engagé.",
    grad: 'from-rose-500 to-pink-600',
    light: 'bg-rose-50',
    color: 'text-rose-600',
  },
  {
    Icon: Rocket,
    title: 'Immersion Accélérée',
    desc: "L'apprentissage par immersion avec l'IA est 3× plus rapide que les méthodes classiques.",
    grad: 'from-indigo-500 to-blue-700',
    light: 'bg-indigo-50',
    color: 'text-indigo-600',
  },
]

const STEPS = [
  {
    Icon: UserPlus,
    title: 'Créez votre profil',
    desc: 'Choisissez votre langue cible et votre niveau. Inscription en 30 secondes, sans carte bancaire.',
    color: 'bg-blue-500',
  },
  {
    Icon: MessageSquare,
    title: 'Conversez avec l\'IA',
    desc: 'Écrivez ou parlez dans votre langue. L\'IA répond, traduit et explique en temps réel.',
    color: 'bg-purple-500',
  },
  {
    Icon: BarChart3,
    title: 'Mesurez vos progrès',
    desc: 'Streak, XP, vocabulaire automatique — chaque session est tracée et valorisée.',
    color: 'bg-emerald-500',
  },
]

export default function Home() {
  const navigate      = useNavigate()
  const { loginUser } = useAuth()

  const [modal,   setModal]   = useState(null)
  const [showPwd, setShowPwd] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm,   setRegForm]   = useState({
    username: '', email: '', password: '',
    native_language: 'fr', target_language: 'en', level: 'debutant',
  })

  const openLogin    = () => { setModal('login');    setError(''); setSuccess(''); setShowPwd(false) }
  const openRegister = () => { setModal('register'); setError(''); setSuccess(''); setShowPwd(false) }
  const closeModal   = () => { setModal(null); setError(''); setSuccess('') }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
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

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const data = await register(regForm)
      if (data.user_id) {
        setSuccess('Compte créé ! Redirection vers la connexion…')
        setTimeout(openLogin, 1800)
      } else {
        setError(data.detail || "Erreur lors de l'inscription")
      }
    } catch {
      setError('Impossible de joindre le serveur')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen font-duo bg-white">

      {/* ════ NAVBAR ═══════════════════════════════════════════════════════ */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#58cc02,#3fa801)' }}>
              <Brain size={20} className="text-white" />
            </div>
            <span className="text-xl font-black text-gray-800 tracking-tight">Lingua<span className="text-green-500">AI</span></span>
          </div>

          {/* Nav links — desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {['Fonctionnalités', 'Comment ça marche', 'Langues'].map(l => (
              <a key={l} href="#" className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">{l}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={openLogin}
              className="px-5 py-2.5 rounded-xl font-extrabold text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              Connexion
            </button>
            <button onClick={openRegister}
              className="px-5 py-2.5 rounded-xl font-extrabold text-sm text-white shadow-md hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg,#58cc02,#3fa801)' }}>
              S'inscrire
            </button>
          </div>
        </div>
      </header>

      {/* ════ HERO ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#f0fdf4 0%,#faf5ff 50%,#eff6ff 100%)' }}>

        {/* Background blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle,#86efac,transparent)' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle,#c4b5fd,transparent)' }} />

        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 relative">
          <div className="flex flex-col lg:flex-row items-center gap-16">

            {/* Left — text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white border border-green-200 text-green-700 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6 shadow-sm">
                <Sparkles size={11} />
                Propulsé par l'Intelligence Artificielle
              </div>

              <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-[1.1] mb-6">
                Apprenez une langue<br />
                <span className="text-transparent bg-clip-text"
                  style={{ backgroundImage: 'linear-gradient(135deg,#58cc02,#3fa801)' }}>
                  3× plus vite
                </span>{' '}
                avec l'IA
              </h1>

              <p className="text-gray-500 text-lg font-semibold mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Conversations immersives, corrections instantanées et vocabulaire automatique — tout ce dont vous avez besoin pour progresser vraiment.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
                <button onClick={openRegister}
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-black text-white text-base shadow-lg hover:opacity-90 active:scale-95 transition-all"
                  style={{ background: 'linear-gradient(135deg,#58cc02,#3fa801)' }}>
                  Commencer gratuitement <ArrowRight size={18} />
                </button>
                <button onClick={openLogin}
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-extrabold text-gray-600 bg-white border-2 border-gray-200 text-base hover:border-gray-300 transition-all">
                  <LogIn size={17} /> J'ai déjà un compte
                </button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {['bg-blue-400','bg-purple-400','bg-green-400','bg-amber-400'].map((c,i) => (
                    <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-white flex items-center justify-center`}>
                      <Users size={12} className="text-white" />
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-500 font-semibold">
                  <span className="font-black text-gray-800">10 000+</span> apprenants actifs
                </div>
              </div>
            </div>

            {/* Right — chat preview */}
            <div className="flex-1 flex justify-center lg:justify-end w-full max-w-sm lg:max-w-none">
              <div className="w-full max-w-[360px]">
                {/* App window chrome */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                  {/* Window bar */}
                  <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 bg-white rounded-lg px-3 py-1.5 flex items-center gap-2 border border-gray-200">
                      <Brain size={12} className="text-green-500" />
                      <span className="text-xs text-gray-400 font-semibold">Lingua AI — Coach Espagnol</span>
                    </div>
                  </div>

                  {/* Chat messages */}
                  <div className="p-4 space-y-3 bg-gray-50/50">
                    {/* AI message */}
                    <div className="flex items-end gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
                        <Brain size={14} className="text-white" />
                      </div>
                      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100 max-w-[220px]">
                        <p className="text-sm font-semibold text-gray-700">¡Hola! ¿Cómo estás hoy?</p>
                        <div className="mt-1.5 flex items-center gap-1 text-xs text-purple-500 font-bold">
                          <Sparkles size={9} /> Traduction : "Bonjour ! Comment vas-tu ?"
                        </div>
                      </div>
                    </div>

                    {/* User message */}
                    <div className="flex items-end gap-2 flex-row-reverse">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                        <Users size={14} className="text-gray-500" />
                      </div>
                      <div className="rounded-2xl rounded-br-sm px-4 py-3 max-w-[200px] text-white text-sm font-semibold"
                        style={{ background: 'linear-gradient(135deg,#1cb0f6,#0e8fcf)' }}>
                        Estoy bien, gracias !
                      </div>
                    </div>

                    {/* AI correction */}
                    <div className="flex items-end gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
                        <Brain size={14} className="text-white" />
                      </div>
                      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100 max-w-[220px]">
                        <p className="text-sm font-semibold text-gray-700">¡Muy bien! Perfect sentence.</p>
                        <div className="mt-2 bg-green-50 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                          <CheckCircle size={11} className="text-green-500 shrink-0" />
                          <span className="text-xs text-green-700 font-semibold">+15 XP gagnés</span>
                        </div>
                      </div>
                    </div>

                    {/* Input bar */}
                    <div className="bg-white rounded-xl border border-gray-200 px-3 py-2.5 flex items-center gap-2 mt-2">
                      <div className="flex-1 text-xs text-gray-300 font-semibold">Écrivez en français…</div>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#58cc02,#3fa801)' }}>
                        <ArrowRight size={13} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="flex justify-center mt-4">
                  <div className="bg-white border border-gray-100 shadow-md rounded-full px-4 py-2 flex items-center gap-2">
                    <Shield size={13} className="text-green-500" />
                    <span className="text-xs font-bold text-gray-500">100% gratuit · Sans carte bancaire</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════ STATS BAR ═════════════════════════════════════════════════════ */}
      <section className="border-y border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 gap-4 text-center">
          {[
            { n: '10K+',  l: 'Apprenants actifs',   Icon: Users     },
            { n: '500K+', l: 'Leçons complétées',   Icon: CheckCircle },
            { n: '9',     l: 'Langues disponibles', Icon: Globe     },
          ].map(({ n, l, Icon }) => (
            <div key={l} className="flex flex-col items-center gap-1">
              <Icon size={18} className="text-green-500 mb-1" />
              <div className="text-2xl md:text-3xl font-black text-gray-800">{n}</div>
              <div className="text-xs font-bold text-gray-400">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════ FEATURES ══════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-white" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-5">
              <Sparkles size={11} /> Intelligence Artificielle
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              L'IA{' '}
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
                réinvente
              </span>{' '}
              l'apprentissage
            </h2>
            <p className="text-gray-400 font-semibold max-w-xl mx-auto text-lg">
              Six fonctionnalités propulsées par l'IA pour que vous progressiez plus vite et plus longtemps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i}
                className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <div className={`w-12 h-12 rounded-xl ${f.light} flex items-center justify-center mb-5`}>
                  <f.Icon size={24} className={f.color} />
                </div>
                <h3 className="font-extrabold text-gray-800 text-base mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm font-semibold leading-relaxed">{f.desc}</p>
                <div className={`mt-4 h-1 w-12 rounded-full bg-gradient-to-r ${f.grad} group-hover:w-full transition-all duration-300`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ HOW IT WORKS ══════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-gray-50" id="how">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Comment ça marche ?</h2>
            <p className="text-gray-400 font-semibold text-lg">Trois étapes pour commencer à progresser aujourd'hui.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[calc(16.5%+24px)] right-[calc(16.5%+24px)] h-px bg-gradient-to-r from-blue-200 via-purple-200 to-emerald-200" />

            {STEPS.map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-2xl ${s.color} flex items-center justify-center mb-6 shadow-lg relative z-10`}>
                  <s.Icon size={32} className="text-white" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full border-2 border-gray-100 flex items-center justify-center">
                    <span className="text-xs font-black text-gray-600">{i + 1}</span>
                  </div>
                </div>
                <h3 className="font-extrabold text-gray-800 text-lg mb-2">{s.title}</h3>
                <p className="text-gray-400 font-semibold text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ CTA ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#58cc02 0%,#3fa801 50%,#2d7a01 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%,white 1px,transparent 1px), radial-gradient(circle at 80% 50%,white 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="max-w-2xl mx-auto text-center relative">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap size={32} className="text-white" fill="white" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Prêt à commencer ?</h2>
          <p className="text-green-100 font-semibold text-lg mb-8">
            Rejoignez des milliers d'apprenants. Gratuit, sans engagement, pour toujours.
          </p>
          <button onClick={openRegister}
            className="inline-flex items-center gap-2 bg-white text-green-700 font-black px-10 py-4 rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all text-base">
            Créer mon compte gratuit <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ════ FOOTER ════════════════════════════════════════════════════════ */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#58cc02,#3fa801)' }}>
                  <Brain size={16} className="text-white" />
                </div>
                <span className="text-lg font-black">Lingua<span className="text-green-400">AI</span></span>
              </div>
              <p className="text-gray-400 text-sm font-semibold leading-relaxed mb-5">
                Apprenez les langues gratuitement avec l'IA. Conversations immersives et suivi personnalisé.
              </p>
              <div className="flex gap-2">
                {[Twitter, Facebook, Instagram, Youtube, Github].map((Icon, i) => (
                  <a key={i} href="#"
                    className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                    <Icon size={14} className="text-gray-400" />
                  </a>
                ))}
              </div>
            </div>

            {/* Langues */}
            <div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-widest mb-4">Langues</h4>
              <ul className="space-y-2.5">
                {['Anglais','Espagnol','Allemand','Arabe','Italien','Portugais','Chinois','Japonais'].map(l => (
                  <li key={l}>
                    <a href="#" onClick={e => { e.preventDefault(); openRegister() }}
                      className="text-gray-400 hover:text-white text-sm font-semibold transition-colors flex items-center gap-1.5">
                      <ChevronRight size={12} className="text-gray-600" /> {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Fonctionnalités */}
            <div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-widest mb-4">Fonctionnalités</h4>
              <ul className="space-y-2.5">
                {['Conversation IA','Traduction auto','Explications IA','Vocabulaire auto','Reconnaissance vocale','Streak & XP','Flashcards','Dictée'].map(f => (
                  <li key={f}>
                    <a href="#" className="text-gray-400 hover:text-white text-sm font-semibold transition-colors flex items-center gap-1.5">
                      <ChevronRight size={12} className="text-gray-600" /> {f}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-widest mb-4">Ressources</h4>
              <ul className="space-y-2.5">
                {[
                  { l: 'Blog',                     h: '#'    },
                  { l: 'Guide de démarrage',        h: '#'    },
                  { l: 'FAQ',                       h: '/faq' },
                  { l: "Conseils d'apprentissage",  h: '#'    },
                  { l: 'Méthode Lingua',            h: '#'    },
                  { l: 'IA & éducation',            h: '#'    },
                ].map(r => (
                  <li key={r.l}>
                    <a href={r.h} className="text-gray-400 hover:text-white text-sm font-semibold transition-colors flex items-center gap-1.5">
                      <ChevronRight size={12} className="text-gray-600" /> {r.l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Entreprise */}
            <div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-widest mb-4">Entreprise</h4>
              <ul className="space-y-2.5 mb-6">
                {[
                  { l: 'À propos',      h: '/about' },
                  { l: 'Notre mission', h: '/about' },
                  { l: "L'équipe",      h: '/about' },
                  { l: 'Carrières',     h: '#'      },
                  { l: 'Presse',        h: '#'      },
                  { l: 'Contact',       h: '#'      },
                ].map(e => (
                  <li key={e.l}>
                    <a href={e.h} className="text-gray-400 hover:text-white text-sm font-semibold transition-colors flex items-center gap-1.5">
                      <ChevronRight size={12} className="text-gray-600" /> {e.l}
                    </a>
                  </li>
                ))}
              </ul>

              {/* App buttons */}
              <div className="space-y-2">
                {[
                  { label: 'App Store',    sub: 'Disponible sur' },
                  { label: 'Google Play',  sub: 'Disponible sur' },
                ].map(app => (
                  <a key={app.label} href="#"
                    className="flex items-center gap-2.5 bg-gray-800 hover:bg-gray-700 px-3 py-2.5 rounded-xl transition-colors w-fit">
                    <Play size={16} className="text-gray-400" />
                    <div>
                      <div className="text-gray-500 text-xs leading-none">{app.sub}</div>
                      <div className="text-white font-extrabold text-sm leading-tight">{app.label}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-gray-500 text-xs font-bold">© 2026 LinguaAI. Tous droits réservés.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              {['Confidentialité','Conditions','Cookies','Mentions légales'].map(l => (
                <a key={l} href="#" className="text-gray-500 hover:text-gray-300 text-xs font-bold transition-colors">{l}</a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Globe size={13} className="text-gray-500" />
              <select className="bg-transparent text-xs font-bold text-gray-500 focus:outline-none cursor-pointer">
                <option>Français</option>
                <option>English</option>
                <option>Español</option>
              </select>
            </div>
          </div>
        </div>
      </footer>

      {/* ════ MODAL AUTH ════════════════════════════════════════════════════ */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>

            {/* Modal top gradient */}
            <div className="h-1.5 w-full"
              style={{ background: 'linear-gradient(90deg,#58cc02,#a855f7,#1cb0f6)' }} />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-800">
                    {modal === 'login' ? 'Connexion' : 'Créer un compte'}
                  </h2>
                  <p className="text-gray-400 font-semibold text-sm mt-1">
                    {modal === 'login'
                      ? 'Reprenez votre apprentissage là où vous vous êtes arrêté'
                      : 'Commencez à apprendre gratuitement aujourd\'hui'}
                  </p>
                </div>
                <button onClick={closeModal}
                  className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-colors shrink-0">
                  <X size={16} />
                </button>
              </div>

              {/* Alerts */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl mb-4">
                  <AlertCircle size={15} className="shrink-0" /> {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold px-4 py-3 rounded-xl mb-4">
                  <CheckCircle size={15} className="shrink-0" /> {success}
                </div>
              )}

              {/* Login form */}
              {modal === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <FieldLabel label="Adresse email">
                    <input type="email" placeholder="votre@email.com" required
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:border-green-400 transition-colors"
                      value={loginForm.email}
                      onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} />
                  </FieldLabel>
                  <FieldLabel label="Mot de passe">
                    <PwdInput value={loginForm.password} show={showPwd}
                      onChange={v => setLoginForm({ ...loginForm, password: v })}
                      toggle={() => setShowPwd(!showPwd)} />
                  </FieldLabel>
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl font-black text-white text-sm shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#58cc02,#3fa801)' }}>
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                    {loading ? 'Connexion…' : 'Se connecter'}
                  </button>
                </form>
              )}

              {/* Register form */}
              {modal === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3">
                  <FieldLabel label="Nom d'utilisateur">
                    <input type="text" placeholder="jean_dupont" required
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:border-green-400 transition-colors"
                      value={regForm.username}
                      onChange={e => setRegForm({ ...regForm, username: e.target.value })} />
                  </FieldLabel>
                  <FieldLabel label="Adresse email">
                    <input type="email" placeholder="votre@email.com" required
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:border-green-400 transition-colors"
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
                      <select className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:border-green-400 transition-colors"
                        value={regForm.native_language}
                        onChange={e => setRegForm({ ...regForm, native_language: e.target.value })}>
                        {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </FieldLabel>
                    <FieldLabel label="Langue cible">
                      <select className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:border-green-400 transition-colors"
                        value={regForm.target_language}
                        onChange={e => setRegForm({ ...regForm, target_language: e.target.value })}>
                        {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </FieldLabel>
                  </div>
                  <FieldLabel label="Niveau actuel">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { v: 'debutant',       l: 'Débutant',      color: 'border-green-400 bg-green-50 text-green-700'  },
                        { v: 'intermediaire',  l: 'Intermédiaire', color: 'border-amber-400 bg-amber-50 text-amber-700'  },
                        { v: 'avance',         l: 'Avancé',        color: 'border-red-400 bg-red-50 text-red-700'        },
                      ].map(opt => (
                        <button key={opt.v} type="button"
                          onClick={() => setRegForm({ ...regForm, level: opt.v })}
                          className={`py-2.5 rounded-xl border-2 font-extrabold text-xs transition-all ${
                            regForm.level === opt.v ? opt.color : 'border-gray-200 text-gray-400 hover:border-gray-300'
                          }`}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </FieldLabel>
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl font-black text-white text-sm shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#58cc02,#3fa801)' }}>
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                    {loading ? 'Création…' : 'Créer mon compte'}
                  </button>
                </form>
              )}

              {/* Switch */}
              <p className="text-center text-gray-400 font-semibold text-sm mt-4">
                {modal === 'login' ? "Pas encore de compte ? " : "Déjà inscrit ? "}
                <button onClick={modal === 'login' ? openRegister : openLogin}
                  className="text-green-600 hover:text-green-700 font-extrabold transition-colors">
                  {modal === 'login' ? "S'inscrire" : "Se connecter"}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FieldLabel({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wide mb-1.5">
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
        className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm font-semibold text-gray-700 focus:outline-none focus:border-green-400 transition-colors"
        value={value} onChange={e => onChange(e.target.value)} />
      <button type="button" onClick={toggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  )
}
