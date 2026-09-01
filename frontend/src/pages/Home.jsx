import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  X, Eye, EyeOff, Loader2, CheckCircle, CheckCircle2, AlertCircle,
  Languages, Wand2, BookMarked, Mic2, Trophy, Volume2,
  MessageSquare, ChevronRight, ChevronLeft,
  UserPlus, LogIn, Flame, Star, Smartphone, Play
} from 'lucide-react'
import { FaXTwitter, FaFacebookF, FaInstagram, FaYoutube, FaGithub } from 'react-icons/fa6'
import { login, register, getProfile, forgotPassword, resendVerification } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { LANGUAGES, translatedLanguageName } from '../constants/languages'
import { LEVELS, translatedLevelLabel } from '../constants/levels'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Home() {
  const navigate      = useNavigate()
  const location       = useLocation()
  const { loginUser } = useAuth()
  const { t }         = useTranslation('home')
  const chipRef        = useRef(null)

  const [modal,   setModal]   = useState(null)
  const [showPwd, setShowPwd] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)

  const [loginForm,   setLoginForm]   = useState({ email: '', password: '' })
  const [forgotEmail, setForgotEmail] = useState('')
  const [regForm,     setRegForm]     = useState({
    username: '', email: '', password: '',
    native_language: 'fr', target_language: 'en', level: 'debutant',
  })

  const openLogin    = () => { setModal('login');    setError(''); setSuccess(''); setShowPwd(false); setNeedsVerification(false) }
  const openRegister = () => { setModal('register'); setError(''); setSuccess(''); setShowPwd(false); setNeedsVerification(false) }
  const openForgot   = () => { setModal('forgot');   setError(''); setSuccess(''); setForgotEmail('') }
  const closeModal   = () => { setModal(null); setError(''); setSuccess('') }
  const scrollChips  = (dir) => chipRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' })

  useEffect(() => {
    if (location.state?.openLogin) openLogin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setNeedsVerification(false)
    try {
      const data = await login(loginForm.email, loginForm.password)
      if (data.access_token) {
        const profile = await getProfile()
        loginUser(profile)
        closeModal()
        navigate('/dashboard')
      } else if (data.code === 'EMAIL_NOT_VERIFIED') {
        setError(data.error || t('modal.errorEmailNotVerified'))
        setNeedsVerification(true)
      } else {
        setError(data.detail || data.error || t('modal.errorLoginFailed'))
      }
    } catch {
      setError(t('modal.errorServerUnreachable'))
    }
    setLoading(false)
  }

  const handleResendVerification = async () => {
    setLoading(true); setError('')
    try {
      const data = await resendVerification(loginForm.email)
      setSuccess(data.message || t('modal.resendSuccess'))
      setNeedsVerification(false)
    } catch {
      setError(t('modal.errorServerUnreachable'))
    }
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const data = await register(regForm)
      if (data.user_id) {
        setSuccess(data.message || t('modal.registerSuccess'))
        setTimeout(openLogin, 3000)
      } else {
        setError(data.detail || t('modal.errorRegisterFailed'))
      }
    } catch {
      setError(t('modal.errorServerUnreachable'))
    }
    setLoading(false)
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      const data = await forgotPassword(forgotEmail)
      setSuccess(data.message || t('modal.forgotSuccess'))
    } catch {
      setError(t('modal.errorServerUnreachable'))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen font-duo bg-white">

      {/* ════ HEADER — minimal, comme duolingo.com ═══════════════════════════ */}
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-duo-green flex items-center justify-center">
            <Languages size={19} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-black text-duo-green tracking-tight">duolingua</span>
        </div>
        <LanguageSwitcher />
      </header>

      {/* ════ HERO ══════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 pt-6 pb-16">
        <div className="flex flex-col lg:flex-row items-center gap-12">

          {/* Illustration */}
          <div className="flex-1 flex justify-center order-1">
            <HeroIllustration />
          </div>

          {/* Text + CTAs */}
          <div className="flex-1 max-w-md order-2 text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl font-black text-duo-text leading-[1.15] mb-8">
              {t('hero.headline')}
            </h1>
            <div className="flex flex-col gap-3 max-w-xs mx-auto lg:mx-0">
              <button onClick={openRegister} className="duo-btn duo-btn-green w-full py-4 text-base">
                {t('hero.start')}
              </button>
              <button onClick={openLogin} className="duo-btn duo-btn-ghost w-full py-4 text-base">
                {t('hero.haveAccount')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ════ LANGUAGE CHIPS ═══════════════════════════════════════════════ */}
      <section className="border-y-2 border-duo-border bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
          <button onClick={() => scrollChips(-1)}
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-duo-muted hover:bg-duo-gray transition-colors hidden sm:flex">
            <ChevronLeft size={18} />
          </button>
          <div ref={chipRef} className="flex-1 flex items-center gap-2 overflow-x-auto scroll-smooth"
            style={{ scrollbarWidth: 'none' }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={openRegister}
                className="shrink-0 flex items-center gap-2 border-2 border-duo-border hover:border-duo-text/30 rounded-2xl px-4 py-2 transition-colors">
                <span className={`fi fi-${l.flagCode} rounded-[2px]`} style={{ fontSize: '1.1em' }} />
                <span className="text-xs font-black uppercase tracking-wide text-duo-text whitespace-nowrap">{translatedLanguageName(t, l.code)}</span>
              </button>
            ))}
          </div>
          <button onClick={() => scrollChips(1)}
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-duo-muted hover:bg-duo-gray transition-colors hidden sm:flex">
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* ════ FEATURE SECTIONS — alternées, comme duolingo.com ═══════════════ */}
      <FeatureSection
        heading={t('sections.free.heading')}
        text={<>{t('sections.free.text1')}<button onClick={openRegister} className="text-duo-blue font-black hover:underline">{t('sections.free.link')}</button>{t('sections.free.text2')}</>}
        illustration={<PhoneAppIllustration />}
        side="right"
      />

      <FeatureSection
        heading={t('sections.coach.heading')}
        text={t('sections.coach.text')}
        illustration={<ChatIllustration />}
        side="left"
        bg="bg-duo-gray/40"
      />

      <FeatureSection
        heading={t('sections.motivation.heading')}
        text={t('sections.motivation.text')}
        illustration={<StreakIllustration />}
        side="right"
      />

      <FeatureSection
        heading={t('sections.voice.heading')}
        text={t('sections.voice.text')}
        illustration={<VoiceIllustration />}
        side="left"
        bg="bg-duo-gray/40"
      />

      {/* ════ CTA FINALE ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-duo-blue-bg py-20 px-6">
        <FloatingShapes />
        <div className="max-w-4xl mx-auto relative text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-10" style={{ color: '#0F3A5F' }}>
            {t('cta.heading1')}<br />{t('cta.heading2')}
          </h2>

          <div className="flex justify-center mb-10">
            <PhonesIllustration />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <a href="#" className="flex items-center gap-2.5 bg-white hover:bg-duo-gray px-4 py-2.5 rounded-2xl transition-colors border-2 border-duo-border">
              <Smartphone size={20} style={{ color: '#0F3A5F' }} />
              <div className="text-left">
                <div className="text-[10px] font-bold leading-none" style={{ color: '#0F3A5F', opacity: 0.6 }}>{t('cta.appStoreSub')}</div>
                <div className="font-black text-sm leading-tight" style={{ color: '#0F3A5F' }}>{t('cta.appStore')}</div>
              </div>
            </a>
            <a href="#" className="flex items-center gap-2.5 bg-white hover:bg-duo-gray px-4 py-2.5 rounded-2xl transition-colors border-2 border-duo-border">
              <Play size={18} style={{ color: '#0F3A5F' }} />
              <div className="text-left">
                <div className="text-[10px] font-bold leading-none" style={{ color: '#0F3A5F', opacity: 0.6 }}>{t('cta.googlePlaySub')}</div>
                <div className="font-black text-sm leading-tight" style={{ color: '#0F3A5F' }}>{t('cta.googlePlay')}</div>
              </div>
            </a>
          </div>

          <button onClick={openRegister} className="duo-btn duo-btn-green px-10 py-4 text-base">
            {t('cta.button')}
          </button>
        </div>
      </section>

      {/* ════ FOOTER ════════════════════════════════════════════════════════ */}
      <footer className="bg-white border-t-2 border-duo-border">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10">

            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-duo-green flex items-center justify-center">
                  <Languages size={16} className="text-white" />
                </div>
                <span className="text-lg font-black text-duo-green">duolingua</span>
              </div>
              <p className="text-duo-muted text-sm font-semibold leading-relaxed mb-5">
                {t('footer.tagline')}
              </p>
              <div className="flex gap-2">
                {[FaXTwitter, FaFacebookF, FaInstagram, FaYoutube, FaGithub].map((Icon, i) => (
                  <a key={i} href="#"
                    className="w-8 h-8 rounded-lg bg-duo-gray hover:bg-duo-border flex items-center justify-center transition-colors">
                    <Icon size={14} className="text-duo-muted" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-extrabold text-duo-text text-xs uppercase tracking-widest mb-4">{t('footer.languagesHeading')}</h4>
              <ul className="space-y-2.5">
                {LANGUAGES.filter(l => l.code !== 'fr').map(l => (
                  <li key={l.code}>
                    <a href="#" onClick={e => { e.preventDefault(); openRegister() }}
                      className="text-duo-muted hover:text-duo-green text-sm font-semibold transition-colors flex items-center gap-1.5">
                      <span className={`fi fi-${l.flagCode} rounded-[2px]`} style={{ fontSize: '1.1em' }} /> {translatedLanguageName(t, l.code)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-extrabold text-duo-text text-xs uppercase tracking-widest mb-4">{t('footer.featuresHeading')}</h4>
              <ul className="space-y-2.5">
                {['conversation','translation','explanations','vocabulary','voice','streak','flashcards','dictation'].map(key => (
                  <li key={key}>
                    <a href="#" className="text-duo-muted hover:text-duo-green text-sm font-semibold transition-colors flex items-center gap-1.5">
                      <ChevronRight size={12} className="text-duo-border" /> {t(`footer.features.${key}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-extrabold text-duo-text text-xs uppercase tracking-widest mb-4">{t('footer.resourcesHeading')}</h4>
              <ul className="space-y-2.5">
                {[
                  { key: 'blog',           h: '#'    },
                  { key: 'gettingStarted', h: '#'    },
                  { key: 'faq',            h: '/faq' },
                  { key: 'tips',           h: '#'    },
                ].map(r => (
                  <li key={r.key}>
                    <a href={r.h} className="text-duo-muted hover:text-duo-green text-sm font-semibold transition-colors flex items-center gap-1.5">
                      <ChevronRight size={12} className="text-duo-border" /> {t(`footer.resources.${r.key}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-extrabold text-duo-text text-xs uppercase tracking-widest mb-4">{t('footer.companyHeading')}</h4>
              <ul className="space-y-2.5">
                {[
                  { key: 'about',   h: '/about' },
                  { key: 'mission', h: '/about' },
                  { key: 'team',    h: '/about' },
                  { key: 'contact', h: '#'      },
                ].map(e => (
                  <li key={e.key}>
                    <a href={e.h} className="text-duo-muted hover:text-duo-green text-sm font-semibold transition-colors flex items-center gap-1.5">
                      <ChevronRight size={12} className="text-duo-border" /> {t(`footer.company.${e.key}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-duo-border">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-duo-muted text-xs font-bold">{t('footer.copyright')}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              {['privacy','terms','cookies','legal'].map(key => (
                <a key={key} href="#" className="text-duo-muted hover:text-duo-text text-xs font-bold transition-colors">{t(`footer.${key}`)}</a>
              ))}
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </footer>

      {/* ════ MODAL AUTH ════════════════════════════════════════════════════ */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>

            <div className="h-1.5 w-full bg-duo-green" />

            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-duo-text">
                    {modal === 'login' ? t('modal.loginTitle')
                      : modal === 'forgot' ? t('modal.forgotTitle')
                      : t('modal.registerTitle')}
                  </h2>
                  <p className="text-duo-muted font-semibold text-sm mt-1">
                    {modal === 'login' ? t('modal.loginSubtitle')
                      : modal === 'forgot' ? t('modal.forgotSubtitle')
                      : t('modal.registerSubtitle')}
                  </p>
                </div>
                <button onClick={closeModal}
                  className="w-8 h-8 rounded-xl bg-duo-gray hover:bg-duo-border flex items-center justify-center text-duo-muted transition-colors shrink-0">
                  <X size={16} />
                </button>
              </div>

              {error && (
                <div className="bg-duo-red-bg border-2 border-duo-red text-duo-red-d text-sm font-semibold px-4 py-3 rounded-xl mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" /> {error}
                  </div>
                  {needsVerification && (
                    <button type="button" onClick={handleResendVerification} disabled={loading}
                      className="mt-2 text-duo-red-d underline font-extrabold text-xs hover:opacity-80 disabled:opacity-50">
                      {t('modal.resendLink')}
                    </button>
                  )}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 bg-duo-green-bg border-2 border-duo-green text-duo-green-d text-sm font-semibold px-4 py-3 rounded-xl mb-4">
                  <CheckCircle size={15} className="shrink-0" /> {success}
                </div>
              )}

              {modal === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <FieldLabel label={t('modal.fieldEmail')}>
                    <input type="email" placeholder={t('modal.placeholderEmail')} required
                      className="duo-input"
                      value={loginForm.email}
                      onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} />
                  </FieldLabel>
                  <FieldLabel label={t('modal.fieldPassword')}>
                    <PwdInput value={loginForm.password} show={showPwd}
                      onChange={v => setLoginForm({ ...loginForm, password: v })}
                      toggle={() => setShowPwd(!showPwd)} />
                  </FieldLabel>
                  <div className="text-right -mt-1">
                    <button type="button" onClick={openForgot}
                      className="text-duo-blue hover:text-duo-blue-d font-bold text-xs transition-colors">
                      {t('modal.forgotLink')}
                    </button>
                  </div>
                  <button type="submit" disabled={loading}
                    className="duo-btn duo-btn-green w-full py-3.5 mt-2">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                    {loading ? t('modal.loginSubmitting') : t('modal.loginSubmit')}
                  </button>
                </form>
              )}

              {modal === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <FieldLabel label={t('modal.fieldEmail')}>
                    <input type="email" placeholder={t('modal.placeholderEmail')} required
                      className="duo-input"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)} />
                  </FieldLabel>
                  <button type="submit" disabled={loading || !!success}
                    className="duo-btn duo-btn-green w-full py-3.5 mt-2 disabled:opacity-60">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                    {loading ? t('modal.forgotSubmitting') : t('modal.forgotSubmit')}
                  </button>
                </form>
              )}

              {modal === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3">
                  <FieldLabel label={t('modal.fieldUsername')}>
                    <input type="text" placeholder={t('modal.placeholderUsername')} required
                      className="duo-input"
                      value={regForm.username}
                      onChange={e => setRegForm({ ...regForm, username: e.target.value })} />
                  </FieldLabel>
                  <FieldLabel label={t('modal.fieldEmail')}>
                    <input type="email" placeholder={t('modal.placeholderEmail')} required
                      className="duo-input"
                      value={regForm.email}
                      onChange={e => setRegForm({ ...regForm, email: e.target.value })} />
                  </FieldLabel>
                  <FieldLabel label={t('modal.fieldPassword')}>
                    <PwdInput value={regForm.password} show={showPwd}
                      onChange={v => setRegForm({ ...regForm, password: v })}
                      toggle={() => setShowPwd(!showPwd)} />
                  </FieldLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <FieldLabel label={t('modal.fieldNativeLanguage')}>
                      <select className="duo-select"
                        value={regForm.native_language}
                        onChange={e => setRegForm({ ...regForm, native_language: e.target.value })}>
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{translatedLanguageName(t, l.code)}</option>)}
                      </select>
                    </FieldLabel>
                    <FieldLabel label={t('modal.fieldTargetLanguage')}>
                      <select className="duo-select"
                        value={regForm.target_language}
                        onChange={e => setRegForm({ ...regForm, target_language: e.target.value })}>
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{translatedLanguageName(t, l.code)}</option>)}
                      </select>
                    </FieldLabel>
                  </div>
                  <FieldLabel label={t('modal.fieldLevel')}>
                    <div className="grid grid-cols-3 gap-2">
                      {LEVELS.map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => setRegForm({ ...regForm, level: opt.value })}
                          className={`py-2.5 rounded-xl border-2 font-extrabold text-xs transition-all ${
                            regForm.level === opt.value ? opt.selectedClass : 'border-duo-border text-duo-muted hover:border-duo-text/30'
                          }`}>
                          {translatedLevelLabel(t, opt.value)}
                        </button>
                      ))}
                    </div>
                  </FieldLabel>
                  <button type="submit" disabled={loading}
                    className="duo-btn duo-btn-green w-full py-3.5 mt-1">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                    {loading ? t('modal.registerSubmitting') : t('modal.registerSubmit')}
                  </button>
                </form>
              )}

              {modal === 'forgot' ? (
                <p className="text-center text-duo-muted font-semibold text-sm mt-4">
                  <button onClick={openLogin}
                    className="text-duo-blue hover:text-duo-blue-d font-extrabold transition-colors">
                    {t('modal.backToLogin')}
                  </button>
                </p>
              ) : (
                <p className="text-center text-duo-muted font-semibold text-sm mt-4">
                  {modal === 'login' ? t('modal.switchToRegister') : t('modal.switchToLogin')}
                  <button onClick={modal === 'login' ? openRegister : openLogin}
                    className="text-duo-blue hover:text-duo-blue-d font-extrabold transition-colors">
                    {modal === 'login' ? t('modal.registerLink') : t('modal.loginLink')}
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION LAYOUT — texte + illustration en alternance
═══════════════════════════════════════════════════════════════════════ */
function FeatureSection({ heading, text, illustration, side, bg = '' }) {
  const textFirst = side === 'right'
  return (
    <section className={`py-16 md:py-20 px-6 ${bg}`}>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
        <div className={`flex-1 max-w-md text-center md:text-left ${textFirst ? 'order-1' : 'order-1 md:order-2'}`}>
          <h2 className="text-3xl md:text-4xl font-black text-duo-green mb-4 leading-tight">{heading}</h2>
          <p className="text-duo-muted font-semibold text-base leading-relaxed">{text}</p>
        </div>
        <div className={`flex-1 flex justify-center ${textFirst ? 'order-2' : 'order-2 md:order-1'}`}>
          {illustration}
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   ILLUSTRATIONS — formes géométriques originales, pas de mascotte copiée
═══════════════════════════════════════════════════════════════════════ */
function HeroIllustration() {
  return (
    <div className="relative w-72 h-72 md:w-80 md:h-80">
      <div className="absolute inset-4 rounded-[3rem] bg-duo-green-bg" />
      <div className="absolute top-2 left-6 w-16 h-16 rounded-3xl bg-duo-yellow rotate-12 flex items-center justify-center shadow-md">
        <Star size={28} className="text-white" fill="currentColor" />
      </div>
      <div className="absolute top-8 right-4 w-20 h-20 rounded-full bg-duo-blue flex items-center justify-center shadow-md">
        <MessageSquare size={30} className="text-white" />
      </div>
      <div className="absolute bottom-6 left-8 w-16 h-16 rounded-2xl bg-duo-red -rotate-6 flex items-center justify-center shadow-md">
        <Flame size={26} className="text-white" fill="currentColor" />
      </div>
      <div className="absolute bottom-2 right-10 w-14 h-14 rounded-full bg-duo-purple flex items-center justify-center shadow-md">
        <Trophy size={22} className="text-white" fill="currentColor" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-28 h-28 rounded-full bg-duo-green flex items-center justify-center shadow-xl border-4 border-white">
          <Languages size={48} className="text-white" strokeWidth={2} />
        </div>
      </div>
    </div>
  )
}

function PhoneAppIllustration() {
  return (
    <div className="w-56 rounded-[2rem] border-4 border-duo-yellow bg-white shadow-lg p-4">
      <div className="h-2.5 rounded-full bg-duo-border overflow-hidden mb-4">
        <div className="h-full w-2/3 rounded-full bg-duo-green" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { bg: 'bg-duo-blue',   Icon: MessageSquare },
          { bg: 'bg-duo-green',  Icon: Languages },
          { bg: 'bg-duo-orange', Icon: BookMarked },
          { bg: 'bg-duo-purple', Icon: Trophy },
        ].map(({ bg, Icon }, i) => (
          <div key={i} className={`aspect-square rounded-2xl ${bg} flex items-center justify-center`}>
            <Icon size={24} className="text-white" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ChatIllustration() {
  const { t } = useTranslation('home')
  return (
    <div className="w-64 space-y-3">
      <div className="bg-white border-2 border-duo-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm max-w-[220px]">
        <p className="text-sm font-bold text-duo-text">How are you today?</p>
      </div>
      <div className="bg-duo-blue rounded-2xl rounded-br-sm px-4 py-3 shadow-sm max-w-[200px] ml-auto">
        <p className="text-sm font-bold text-white">I are fine, thank !</p>
      </div>
      <div className="bg-white border-2 border-duo-green rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5 text-xs font-black text-duo-green-d mb-1">
          <Wand2 size={13} /> {t('illustration.correction')}
        </div>
        <p className="text-sm font-bold text-duo-text">"I <span className="line-through text-duo-red">are</span> <span className="text-duo-green-d">am</span> fine, thank you !"</p>
      </div>
    </div>
  )
}

function StreakIllustration() {
  const { t } = useTranslation('home')
  return (
    <div className="relative w-64 h-56">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 rounded-3xl bg-duo-orange rotate-6 flex flex-col items-center justify-center shadow-lg">
        <Flame size={30} className="text-white" fill="currentColor" />
        <span className="text-white font-black text-lg leading-none mt-1">12</span>
      </div>
      <div className="absolute bottom-4 left-2 w-24 h-32 rounded-2xl bg-white border-2 border-duo-border shadow-md -rotate-6 flex flex-col items-center justify-center gap-2 p-3">
        <BookMarked size={22} className="text-duo-blue" />
        <span className="text-xs font-black text-duo-muted text-center">{t('illustration.vocabulary')}</span>
      </div>
      <div className="absolute bottom-2 right-2 w-24 h-32 rounded-2xl bg-white border-2 border-duo-border shadow-md rotate-6 flex flex-col items-center justify-center gap-2 p-3">
        <Trophy size={22} className="text-duo-yellow-d" />
        <span className="text-xs font-black text-duo-muted text-center">+250 XP</span>
      </div>
      <div className="absolute top-6 right-6 w-9 h-9 rounded-full bg-duo-purple flex items-center justify-center shadow-md">
        <Star size={16} className="text-white" fill="currentColor" />
      </div>
    </div>
  )
}

function VoiceIllustration() {
  return (
    <div className="w-56 h-56 rounded-full bg-duo-blue-bg flex items-center justify-center relative">
      {[0, 1, 2].map(i => (
        <div key={i} className="absolute rounded-full border-2 border-duo-blue"
          style={{ width: `${140 + i * 34}px`, height: `${140 + i * 34}px`, opacity: 0.35 - i * 0.1 }} />
      ))}
      <div className="w-24 h-24 rounded-full bg-duo-blue flex items-center justify-center shadow-xl relative z-10">
        <Mic2 size={38} className="text-white" />
      </div>
      <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-white border-2 border-duo-border flex items-center justify-center shadow-md">
        <Volume2 size={16} className="text-duo-blue" />
      </div>
      <div className="absolute top-8 left-4 w-9 h-9 rounded-2xl bg-duo-green flex items-center justify-center shadow-md">
        <CheckCircle2 size={16} className="text-white" />
      </div>
    </div>
  )
}

function PhonesIllustration() {
  return (
    <div className="flex items-end gap-3">
      <div className="w-24 h-44 rounded-3xl bg-white border-4 border-duo-blue shadow-lg -rotate-6 p-2 flex flex-col gap-2">
        <div className="h-1.5 w-8 rounded-full bg-duo-border mx-auto" />
        <div className="flex-1 rounded-xl bg-duo-blue-bg" />
      </div>
      <div className="w-28 h-52 rounded-3xl bg-white border-4 border-duo-green shadow-xl p-2 flex flex-col gap-2">
        <div className="h-1.5 w-9 rounded-full bg-duo-border mx-auto" />
        <div className="flex-1 rounded-xl bg-duo-green-bg flex items-center justify-center">
          <Languages size={28} className="text-duo-green" />
        </div>
      </div>
      <div className="w-24 h-44 rounded-3xl bg-white border-4 border-duo-purple shadow-lg rotate-6 p-2 flex flex-col gap-2">
        <div className="h-1.5 w-8 rounded-full bg-duo-border mx-auto" />
        <div className="flex-1 rounded-xl bg-duo-purple-bg" />
      </div>
    </div>
  )
}

function FloatingShapes() {
  const shapes = [
    { c: 'bg-duo-orange',  s: 'w-8 h-8 rounded-lg',    p: 'top-8 left-10 rotate-12' },
    { c: 'bg-duo-purple',  s: 'w-10 h-10 rounded-2xl', p: 'top-16 right-16 -rotate-12' },
    { c: 'bg-duo-blue',    s: 'w-6 h-6 rounded-full',  p: 'bottom-24 left-16' },
    { c: 'bg-duo-yellow',  s: 'w-7 h-7 rounded-lg',    p: 'bottom-16 right-24 rotate-45' },
    { c: 'bg-duo-green',   s: 'w-9 h-9 rounded-full',  p: 'top-1/2 left-4' },
    { c: 'bg-duo-red',     s: 'w-6 h-6 rounded-lg',    p: 'top-1/3 right-6 rotate-12' },
  ]
  return (
    <>
      {shapes.map((sh, i) => (
        <div key={i} className={`hidden md:block absolute opacity-70 ${sh.c} ${sh.s} ${sh.p}`} />
      ))}
    </>
  )
}

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
