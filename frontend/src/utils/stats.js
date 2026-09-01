// Calculs dérivés des statistiques utilisateur, partagés entre Dashboard,
// Profile et Progress pour éviter les fallbacks divergents.

export function getXp(stats) {
  return stats?.xp_total || (stats?.total_messages ? stats.total_messages * 10 : 0)
}

export function getMasteredCount(stats, vocab = []) {
  return stats?.mastered_words ?? vocab.filter(w => w.mastered).length
}

export function scoreColorClass(score) {
  if (score >= 80) return 'text-duo-green'
  if (score >= 50) return 'text-duo-orange'
  return 'text-duo-red'
}

export function scoreBgClass(score) {
  if (score >= 80) return 'bg-duo-green-bg border-duo-green'
  if (score >= 50) return 'bg-duo-yellow-bg border-duo-orange'
  return 'bg-duo-red-bg border-duo-red'
}

export function scoreBarClass(score) {
  if (score >= 80) return 'bg-duo-green'
  if (score >= 50) return 'bg-duo-orange'
  return 'bg-duo-red'
}
