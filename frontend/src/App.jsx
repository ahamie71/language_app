import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Landing      from './pages/Home'
import Dashboard    from './pages/Dashboard'
import Conversation from './pages/Conversation'
import Vocabulary   from './pages/Vocabulary'
import Profile      from './pages/Profile'
import EditProfile  from './pages/EditProfile'
import About        from './pages/About'
import FAQ          from './pages/FAQ'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail   from './pages/VerifyEmail'
import Exercises    from './pages/Exercises'
import Flashcards   from './pages/Flashcards'
import Dictation    from './pages/Dictation'
import Progress     from './pages/Progress'

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-duo-gray font-duo gap-4">
      <Loader2 size={40} className="animate-spin text-duo-green" />
      <p className="text-duo-muted font-bold text-sm">Chargement...</p>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? children : <Navigate to="/" replace />
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return (
    <Routes>
      <Route path="/"                   element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/dashboard"          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/conversation/:id"   element={<ProtectedRoute><Conversation /></ProtectedRoute>} />
      <Route path="/vocabulary"         element={<ProtectedRoute><Vocabulary /></ProtectedRoute>} />
      <Route path="/profile"            element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/profile/edit"       element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
      <Route path="/about"              element={<About />} />
      <Route path="/faq"                element={<FAQ />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email/:token"   element={<VerifyEmail />} />
      <Route path="/exercises"          element={<ProtectedRoute><Exercises /></ProtectedRoute>} />
      <Route path="/flashcards"         element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
      <Route path="/dictation"          element={<ProtectedRoute><Dictation /></ProtectedRoute>} />
      <Route path="/progress"           element={<ProtectedRoute><Progress /></ProtectedRoute>} />
      <Route path="*"                   element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
