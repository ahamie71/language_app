import { createContext, useContext, useState, useEffect } from 'react'
import { getProfile } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      getProfile()
        .then(data => {
          if (data && data.id) setUser(data)
          else localStorage.removeItem('token')
        })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const loginUser = (userData) => setUser(userData)

  const logoutUser = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

