import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Trash2, CheckCircle, Circle, Loader2, Plus, Layers, Download, BookOpen, FileQuestion } from 'lucide-react'
import { getVocabulary, deleteWord, getDueVocabulary, exportVocabulary } from '../services/api'
import BottomNav from '../components/BottomNav'
import TopNav from '../components/TopNav'
import { scoreColorClass, scoreBarClass } from '../utils/stats'

const DIFF = {
  easy:   { cls:'bg-duo-green-bg text-duo-green border-green-200' },
  medium: { cls:'bg-duo-yellow-bg text-duo-orange border-yellow-200' },
  hard:   { cls:'bg-duo-red-bg text-duo-red border-red-200' },
}

export default function Vocabulary() {
  const navigate     = useNavigate()
  const { t }        = useTranslation('vocabulary')
  const [words,      setWords]      = useState([])
  const [dueCount,   setDueCount]   = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [exporting,  setExporting]  = useState(false)
  const [search,     setSearch]     = useState('')
  const [filter,     setFilter]     = useState('all')

  useEffect(() => {
    Promise.all([getVocabulary(), getDueVocabulary()])
      .then(([d, due]) => {
        setWords(Array.isArray(d) ? d : [])
        setDueCount(Array.isArray(due) ? due.length : 0)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try { await exportVocabulary() } finally { setExporting(false) }
  }

  const handleDelete = async (id) => {
    await deleteWord(id)
    setWords(prev => prev.filter(w => w.id !== id))
  }

  const filtered = words.filter(w => {
    const q  = search.toLowerCase()
    const ok = w.word?.toLowerCase().includes(q) || w.translation?.toLowerCase().includes(q)
    if (filter === 'mastered') return ok && w.mastered
    if (filter === 'learning') return ok && !w.mastered
    return ok
  })

  const mastered = words.filter(w => w.mastered).length
  const pct      = words.length > 0 ? Math.round((mastered / words.length) * 100) : 0

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-duo-gray font-duo">
      <div className="text-center">
        <BookOpen size={48} className="text-duo-green mx-auto mb-4 animate-float" />
        <p className="text-duo-muted font-bold">{t('loading')}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-duo-gray font-duo pb-24 md:pb-8">

      <TopNav active="vocabulary" />

      {/* ── Header ── */}
      <header className="bg-white border-b-2 border-duo-border sticky top-0 z-20">
        <div className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-black text-duo-text flex items-center gap-2">
              <BookOpen size={20} className="text-duo-green" /> {t('header.title')}
            </h1>
            <button onClick={handleExport} disabled={exporting || words.length === 0}
              className="flex items-center gap-1 text-duo-muted hover:text-duo-green font-extrabold text-xs transition-colors disabled:opacity-40">
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {t('header.exportButton')}
            </button>
          </div>
          <p className="text-duo-muted text-sm font-semibold">
            {t('header.subtitle')}
          </p>
        </div>
      </header>

      <div className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto px-4 py-4 space-y-4">

        {/* ── Flashcard CTA ── */}
        {dueCount > 0 && (
          <button onClick={() => navigate('/flashcards')}
            className="w-full duo-card border-2 border-duo-orange bg-orange-50 flex items-center gap-3 hover:border-orange-400 transition-colors">
            <div className="w-10 h-10 bg-duo-orange rounded-xl flex items-center justify-center shrink-0">
              <Layers size={18} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-extrabold text-duo-text text-sm">{t('cta.dueCards', { count: dueCount })}</div>
              <div className="text-duo-muted text-xs font-semibold">{t('cta.launchSession')}</div>
            </div>
          </button>
        )}

        {/* ── Mastery summary ── */}
        {words.length > 0 && (
          <div className="duo-card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-extrabold text-duo-text">{t('mastery.heading')}</div>
                <div className="text-duo-muted text-sm font-semibold">{t('mastery.summary', { mastered, total: words.length })}</div>
              </div>
              <div className="text-3xl font-black text-duo-green">{pct}%</div>
            </div>
            <div className="duo-progress">
              <div className="duo-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <div className="w-3 h-3 rounded-full bg-duo-green" /> {t('mastery.masteredLabel', { count: mastered })}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <div className="w-3 h-3 rounded-full bg-duo-border" /> {t('mastery.inProgressLabel', { count: words.length - mastered })}
              </div>
            </div>
          </div>
        )}

        {/* ── Search ── */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-duo-muted" />
          <input type="text" placeholder={t('search.placeholder')} value={search}
            onChange={e => setSearch(e.target.value)}
            className="duo-input pl-10" />
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex gap-2">
          {['all', 'learning', 'mastered'].map(v => (
            <button key={v} onClick={() => setFilter(v)}
              className={`flex-1 py-2.5 rounded-duo text-xs font-extrabold uppercase tracking-wide border-b-4 transition-all ${
                filter === v
                  ? 'bg-duo-green text-duo-black border-duo-green-d'
                  : 'bg-white text-duo-muted border-duo-border'
              }`}>
              {t(`filters.${v}`)}
            </button>
          ))}
        </div>

        {/* ── Empty ── */}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <FileQuestion size={48} className="text-duo-border mx-auto mb-4" />
            <p className="font-extrabold text-duo-text mb-1">
              {words.length === 0 ? t('empty.noWordsYet') : t('empty.noResults')}
            </p>
            <p className="text-duo-muted text-sm font-semibold mb-4">
              {words.length === 0
                ? t('empty.noWordsSubtitle')
                : t('empty.noResultsSubtitle')}
            </p>
            {words.length === 0 && (
              <button onClick={() => navigate('/dashboard')}
                className="duo-btn duo-btn-green text-sm px-8 py-3">
                <Plus size={15} /> {t('empty.startLessonButton')}
              </button>
            )}
          </div>
        )}

        {/* ── Word cards ── */}
        {filtered.map(word => {
          const diff     = DIFF[word.difficulty_level]
          const accuracy = word.times_practiced > 0
            ? Math.round((word.times_correct / word.times_practiced) * 100) : null

          return (
            <div key={word.id}
              className={`duo-card ${word.mastered ? 'border-duo-green' : ''}`}>
              <div className="flex items-start gap-3">
                {/* Mastery icon */}
                <div className="mt-0.5 shrink-0">
                  {word.mastered
                    ? <CheckCircle size={22} className="text-duo-green" />
                    : <Circle      size={22} className="text-duo-border" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-extrabold text-duo-text text-base">{word.word}</span>
                    {diff && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-extrabold ${diff.cls}`}>
                        {t(`difficulty.${word.difficulty_level}`)}
                      </span>
                    )}
                    {word.mastered && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-duo-green text-duo-black font-extrabold">
                        <CheckCircle size={12} /> {t('word.masteredBadge')}
                      </span>
                    )}
                  </div>

                  {word.translation && (
                    <p className="text-duo-muted font-semibold text-sm">{word.translation}</p>
                  )}

                  {/* Accuracy bar */}
                  {word.times_practiced > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-duo-muted">
                          {t('word.correctCount', { correct: word.times_correct, total: word.times_practiced })}
                        </span>
                        <span className={`text-xs font-extrabold ${scoreColorClass(accuracy)}`}>
                          {accuracy}%
                        </span>
                      </div>
                      <div className="h-2 bg-duo-border rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${scoreBarClass(accuracy)}`}
                          style={{ width: `${accuracy}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Delete */}
                <button onClick={() => handleDelete(word.id)}
                  className="p-2 text-duo-muted hover:text-duo-red hover:bg-duo-red-bg rounded-duo-sm transition-all shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <BottomNav active="vocabulary" />
    </div>
  )
}
