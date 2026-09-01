import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, KeyRound, Languages } from 'lucide-react'
import { resetPassword } from '../services/api'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate   = useNavigate()
  const { t }      = useTranslation('resetPassword')

  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword]  = useState('')
  const [showPwd,         setShowPwd]          = useState(false)
  const [loading,         setLoading]          = useState(false)
  const [error,           setError]            = useState('')
  const [success,         setSuccess]          = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(t('errorMismatch'))
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password)
      setSuccess(true)
    } catch (err) {
      setError(err.message || t('errorGeneric'))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-duo-gray font-duo flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-2xl bg-duo-green flex items-center justify-center">
            <Languages size={19} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-black text-duo-green tracking-tight">duolingua</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="h-1.5 w-full bg-duo-green" />

          <div className="p-6">
            {success ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-duo-green-bg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-duo-green" />
                </div>
                <h2 className="text-xl font-black text-duo-text mb-2">{t('successTitle')}</h2>
                <p className="text-duo-muted font-semibold text-sm mb-6">{t('successSubtitle')}</p>
                <button onClick={() => navigate('/', { state: { openLogin: true } })}
                  className="duo-btn duo-btn-green w-full py-3.5">
                  {t('goToLogin')}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-duo-green-bg flex items-center justify-center shrink-0">
                    <KeyRound size={20} className="text-duo-green" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-duo-text">{t('title')}</h2>
                    <p className="text-duo-muted font-semibold text-sm mt-0.5">{t('subtitle')}</p>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-duo-red-bg border-2 border-duo-red text-duo-red-d text-sm font-semibold px-4 py-3 rounded-xl mb-4">
                    <AlertCircle size={15} className="shrink-0" /> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-duo-muted uppercase tracking-wide mb-1.5">
                      {t('fieldNewPassword')}
                    </label>
                    <div className="relative">
                      <input type={showPwd ? 'text' : 'password'} required minLength={6}
                        placeholder="••••••••"
                        className="duo-input pr-11"
                        value={password}
                        onChange={e => setPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-duo-muted hover:text-duo-text transition-colors">
                        {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-duo-muted uppercase tracking-wide mb-1.5">
                      {t('fieldConfirmPassword')}
                    </label>
                    <input type={showPwd ? 'text' : 'password'} required minLength={6}
                      placeholder="••••••••"
                      className="duo-input"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)} />
                  </div>

                  <button type="submit" disabled={loading}
                    className="duo-btn duo-btn-green w-full py-3.5 mt-2 disabled:opacity-60">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                    {loading ? t('submitting') : t('submit')}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
