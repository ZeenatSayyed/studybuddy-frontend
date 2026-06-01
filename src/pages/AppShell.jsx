import Profile from './Profile'
import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import Dashboard from './Dashboard'
import Notes from './Notes'
import Quiz from './Quiz'
import Timer from './Timer'
import AIAssistant from './AIAssistant'
import Classroom from './Classroom'
import Calendar from './Calendar'
import GroupStudy from './GroupStudy'
import Settings from './Settings'

const DoodleIcons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}>
      <rect x="3" y="3" width="7" height="7" rx="2"/>
      <rect x="14" y="3" width="7" height="7" rx="2"/>
      <rect x="3" y="14" width="7" height="7" rx="2"/>
      <rect x="14" y="14" width="7" height="7" rx="2"/>
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="17" x2="13" y2="17"/>
    </svg>
  ),
  quiz: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  timer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}>
      <circle cx="12" cy="13" r="8"/>
      <polyline points="12 9 12 13 15 16"/>
      <path d="M9 2h6"/>
      <path d="M12 2v2"/>
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}>
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <circle cx="8.5" cy="16" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="15.5" cy="16" r="1.5" fill="currentColor" stroke="none"/>
      <path d="M8 11V6a4 4 0 0 1 8 0v5"/>
      <path d="M6 7l-2-2M18 7l2-2"/>
    </svg>
  ),
  classroom: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <line x1="9" y1="10" x2="9.01" y2="10"/>
      <line x1="12" y1="10" x2="12.01" y2="10"/>
      <line x1="15" y1="10" x2="15.01" y2="10"/>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}>
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <rect x="8" y="14" width="3" height="3" rx="1" fill="currentColor" stroke="none"/>
    </svg>
  ),
  group: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}>
      <circle cx="9" cy="7" r="3"/>
      <path d="M3 20v-1a5 5 0 0 1 5-5h2"/>
      <circle cx="17" cy="7" r="3"/>
      <path d="M13 20v-1a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5v1"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
}

const LogoDoodle = () => (
  <svg viewBox="0 0 32 32" fill="none" style={{width:32,height:32}}>
    <rect x="2" y="2" width="28" height="28" rx="8" fill="var(--accent)" opacity="0.15"/>
    <path d="M8 24 L8 10 Q8 8 10 8 L22 8 Q24 8 24 10 L24 20 Q24 22 22 22 L12 22 L8 26 Z"
      fill="var(--accent)" opacity="0.9"/>
    <line x1="12" y1="13" x2="20" y2="13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="12" y1="16.5" x2="18" y2="16.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="25" cy="9" r="4" fill="var(--accent3)"/>
    <text x="25" y="11.5" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">AI</text>
  </svg>
)

const NAV = [
  { id: 'profile', icon: '👤', label: 'Profile' },
  { id: 'dashboard', key: 'dashboard', label: 'Dashboard' },
  { id: 'notes',     key: 'notes',     label: 'Notes' },
  { id: 'quiz',      key: 'quiz',      label: 'AI Quiz' },
  { id: 'timer',     key: 'timer',     label: 'Focus Timer' },
  { id: 'ai',        key: 'ai',        label: 'AI Assistant' },
  { id: 'classroom', key: 'classroom', label: 'Classroom', badge: true },
  { id: 'calendar',  key: 'calendar',  label: 'Calendar' },
  { id: 'group',     key: 'group',     label: 'Group Study' },
  { id: 'settings',  key: 'settings',  label: 'Settings' },
  
]

const PAGES = {
  dashboard: Dashboard, notes: Notes, quiz: Quiz, timer: Timer,
  ai: AIAssistant, classroom: Classroom, calendar: Calendar,
  group: GroupStudy, settings: Settings
}

export default function AppShell() {
  const { user, logout, loadNotes } = useApp()
  const [active, setActive]       = useState('dashboard')
  const [chatBadge, setChatBadge] = useState(false)

  useEffect(() => { loadNotes() }, [])

  const Page = PAGES[active] || Dashboard

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon-wrap" style={{width:38,height:38,borderRadius:11,
            display:'flex',alignItems:'center',justifyContent:'center',
            animation:'logoBounce 2s ease-in-out infinite'}}>
            <LogoDoodle/>
          </div>
          <span className="brand">StudyBuddy</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(n => {
            const isActive = active === n.id
            return (
              <button key={n.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => { setActive(n.id); if (n.id==='classroom') setChatBadge(false) }}>
                <span className="nav-icon" style={{
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                  width:28, height:28, borderRadius:8, transition:'all .25s',
                  background: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--muted)',
                  transform: isActive ? 'scale(1.12) rotate(-4deg)' : 'scale(1)',
                  boxShadow: isActive ? '0 4px 12px var(--glow)' : 'none',
                  flexShrink: 0,
                }}>
                  {DoodleIcons[n.key]}
                </span>
                {n.label}
                {n.badge && chatBadge && <span className="nav-badge">!</span>}
              </button>
            )
          })}
        </nav>

        <div className="streak-widget">
          <div className="streak-flame">🔥</div>
          <div className="streak-number">{user?.loginStreak || 0}</div>
          <div className="streak-label">Day Streak</div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{(user?.name || 'S')[0].toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'Student'}</div>
            <div className="user-role">StudyBuddy Member</div>
          </div>
          <button className="logout-btn" onClick={logout} title="Logout">⏻</button>
        </div>
      </aside>

      <main className="main">
        <div className="page-enter" key={active}>
          <Page onNavigate={setActive} onChatMsg={() => active!=='classroom' && setChatBadge(true)}/>
        </div>
      </main>
    </div>
  )
}