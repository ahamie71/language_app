import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { updateProfile } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { LANGUAGES, translatedLanguageName } from '../constants/languages'
import { LEVELS, translatedLevelLabel } from '../constants/levels'
import TopNav from '../components/TopNav'

export default function EditProfile() {
  const navigate        = useNavigate()
  const { user, setUser } = useAuth()
  const { t }            = useTranslation('editProfile')

  const [form, setForm] = useState({
    username:        user?.username        || '',
    email:           user?.email           || '',
    native_language: user?.native_language || 'fr',
    target_language: user?.target_language || 'en',
    level:           user?.level           || 'debutant',
  })
  const [saving,  setSaving]  = useState(false)
  const [status,  setStatus]  = useState(null) // 'success' | 'error'
  const [message, setMessage] = useState('')

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.native_language === form.target_language) {
      setStatus('error')
      setMessage(t('errors.sameLanguage'))
      return
    }
    setSaving(true)
    setStatus(null)
    try {
      const res = await updateProfile(form)
      if (res.user || res.username || res.id) {
        const updated = res.user ?? res
        setUser(u => ({ ...u, ...updated }))
        setStatus('success')
        setMessage(t('success.updated'))
        setTimeout(() => navigate('/profile'), 1400)
      } else {
        setStatus('error')
        setMessage(res.message || res.error || t('errors.generic'))
      }
    } catch {
      setStatus('error')
      setMessage(t('errors.serverUnreachable'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-duo-gray font-duo">

      <TopNav active="profile" />

      {/* ── Header ── */}
      <header className="bg-white border-b-2 border-duo-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/profile')}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-duo-gray transition-colors text-duo-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-duo-text">{t('header.title')}</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Avatar preview */}
        <div className="duo-card flex flex-col items-center py-6">
          <div className="w-20 h-20 rounded-full bg-duo-green flex items-center justify-center text-4xl font-black text-duo-black shadow-lg mb-3">
            {form.username?.[0]?.toUpperCase() || '?'}
          </div>
          <p className="text-duo-muted font-semibold text-sm">{t('avatar.caption')}</p>
        </div>

        {/* Feedback banner */}
        {status === 'success' && (
          <div className="flex items-center gap-2 bg-green-50 border-2 border-duo-green text-duo-green rounded-duo px-4 py-3 font-extrabold text-sm animate-slideUp">
            <CheckCircle size={18} /> {message}
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 bg-red-50 border-2 border-duo-red text-duo-red rounded-duo px-4 py-3 font-extrabold text-sm animate-slideUp">
            <AlertCircle size={18} /> {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="duo-card space-y-4">
            <h2 className="font-extrabold text-duo-text text-base border-b border-duo-border pb-2">
              {t('personalInfo.heading')}
            </h2>

            <div>
              <label className="block text-sm font-extrabold text-duo-muted mb-1.5">
                {t('personalInfo.usernameLabel')}
              </label>
              <input
                type="text"
                value={form.username}
                onChange={set('username')}
                required
                minLength={2}
                maxLength={30}
                className="duo-input"
                placeholder={t('personalInfo.usernamePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-extrabold text-duo-muted mb-1.5">
                {t('personalInfo.emailLabel')}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                className="duo-input"
                placeholder={t('personalInfo.emailPlaceholder')}
              />
            </div>
          </div>

          <div className="duo-card space-y-4">
            <h2 className="font-extrabold text-duo-text text-base border-b border-duo-border pb-2">
              {t('learning.heading')}
            </h2>

            <div>
              <label className="block text-sm font-extrabold text-duo-muted mb-1.5">
                {t('learning.nativeLanguageLabel')}
              </label>
              <select
                value={form.native_language}
                onChange={set('native_language')}
                className="duo-select"
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{translatedLanguageName(t, l.code)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-extrabold text-duo-muted mb-1.5">
                {t('learning.targetLanguageLabel')}
              </label>
              <select
                value={form.target_language}
                onChange={set('target_language')}
                className="duo-select"
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{translatedLanguageName(t, l.code)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-extrabold text-duo-muted mb-1.5">
                {t('learning.levelLabel')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {LEVELS.map(lv => (
                  <button
                    key={lv.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, level: lv.value }))}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-duo border-2 font-extrabold text-sm text-center transition-all ${
                      form.level === lv.value
                        ? 'border-duo-green bg-green-50 text-duo-green'
                        : 'border-duo-border bg-white text-duo-muted hover:border-duo-green'
                    }`}
                  >
                    <lv.icon size={16} />
                    {translatedLevelLabel(t, lv.value)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="duo-btn duo-btn-green w-full flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving
              ? <><Loader2 size={18} className="animate-spin" /> {t('actions.saving')}</>
              : <><Save size={18} /> {t('actions.save')}</>
            }
          </button>

          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="duo-btn duo-btn-ghost w-full"
          >
            {t('actions.cancel')}
          </button>

        </form>
      </div>
    </div>
  )
}
