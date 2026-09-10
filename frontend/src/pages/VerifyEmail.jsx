import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, CheckCircle, AlertCircle, MailCheck, Languages } from 'lucide-react'
import { verifyEmail } from '../services/api'

export default function VerifyEmail() {
  const { token } = useParams()
  const navigate   = useNavigate()
  const { t }      = useTranslation('verifyEmail')

  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [error,  setError]  = useState('')
  // Le token est à usage unique côté backend : en dev, StrictMode monte cet
  // effet deux fois, et le 2e appel échouerait puisque le token est déjà
  // consommé par le 1er — ce verrou empêche le doublon.
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(err => { setError(err.message || t('errorGeneric')); setStatus('error') })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

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

          <div className="p-6 text-center py-10">
            {status === 'loading' && (
              <>
                <Loader2 size={40} className="animate-spin text-duo-green mx-auto mb-4" />
                <p className="text-duo-muted font-bold">{t('loading')}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 rounded-full bg-duo-green-bg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-duo-green" />
                </div>
                <h2 className="text-xl font-black text-duo-text mb-2">{t('successTitle')}</h2>
                <p className="text-duo-muted font-semibold text-sm mb-6">{t('successSubtitle')}</p>
                <button onClick={() => navigate('/', { state: { openLogin: true } })}
                  className="duo-btn duo-btn-green w-full py-3.5">
                  {t('goToLogin')}
                </button>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 rounded-full bg-duo-red-bg flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-duo-red" />
                </div>
                <h2 className="text-xl font-black text-duo-text mb-2">{t('errorTitle')}</h2>
                <p className="text-duo-muted font-semibold text-sm mb-6">{error}</p>
                <button onClick={() => navigate('/')}
                  className="duo-btn duo-btn-ghost w-full py-3.5">
                  <MailCheck size={17} /> {t('backHome')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
