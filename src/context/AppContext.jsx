import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [token, setToken]       = useState(() => localStorage.getItem('sb_token'))
  const [user, setUser]         = useState(() => JSON.parse(localStorage.getItem('sb_user') || 'null'))
  const [notes, setNotes]       = useState([])
  const [theme, setTheme]       = useState(() => localStorage.getItem('sb_theme') || 'cosmos')
  const [toasts, setToasts]     = useState([])
  const [sessionsToday, setSessions] = useState(() => parseInt(localStorage.getItem('sb_sessions') || '0'))
  const [totalQuiz, setTotalQuiz]   = useState(() => parseInt(localStorage.getItem('sb_quizzes') || '0'))
  const [totalAI, setTotalAI]       = useState(() => parseInt(localStorage.getItem('sb_ai') || '0'))

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('sb_theme', theme)
  }, [theme])

  const API = "https://studybuddy-backend-1-yhda.onrender.com"
  

  const apiFetch = (path, method = 'GET', body = null) => {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }
    if (body) opts.body = JSON.stringify(body)
    return fetch(API + path, opts)
  }

  const toast = (msg, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200)
  }

  const login = (tok, userData) => {
    setToken(tok); setUser(userData)
    localStorage.setItem('sb_token', tok)
    localStorage.setItem('sb_user', JSON.stringify(userData))
  }

  const logout = () => {
    setToken(null); setUser(null); setNotes([])
    localStorage.removeItem('sb_token')
    localStorage.removeItem('sb_user')
  }

  const loadNotes = async () => {
    try {
      const res = await apiFetch('/notes')
      const data = await res.json()
      setNotes(data)
    } catch {}
  }

  const incSession = () => {
    setSessions(s => { const n = s + 1; localStorage.setItem('sb_sessions', n); return n })
  }
  const incQuiz = () => {
    setTotalQuiz(q => { const n = q + 1; localStorage.setItem('sb_quizzes', n); return n })
  }
  const incAI = () => {
    setTotalAI(a => { const n = a + 1; localStorage.setItem('sb_ai', n); return n })
  }

  return (
    <AppContext.Provider value={{
      token, user, notes, setNotes, theme, setTheme,
      toasts, toast, login, logout, apiFetch, loadNotes,
      sessionsToday, totalQuiz, totalAI, incSession, incQuiz, incAI
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
