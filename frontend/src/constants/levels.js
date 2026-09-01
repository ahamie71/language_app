import { Sprout, Zap, Flame } from 'lucide-react'

// Niveaux d'apprentissage : label, icône, XP requis pour le niveau suivant,
// et classes Tailwind pour les badges/sélecteurs à travers l'app.
export const LEVELS = [
  {
    value: 'debutant',
    label: 'Débutant',
    icon: Sprout,
    xpNeeded: 500,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    selectedClass: 'border-green-400 bg-green-50 text-green-700',
  },
  {
    value: 'intermediaire',
    label: 'Intermédiaire',
    icon: Zap,
    xpNeeded: 2000,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    selectedClass: 'border-amber-400 bg-amber-50 text-amber-700',
  },
  {
    value: 'avance',
    label: 'Avancé',
    icon: Flame,
    xpNeeded: 5000,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    selectedClass: 'border-red-400 bg-red-50 text-red-700',
  },
]

export const LEVEL_INFO = Object.fromEntries(LEVELS.map(l => [l.value, l]))
