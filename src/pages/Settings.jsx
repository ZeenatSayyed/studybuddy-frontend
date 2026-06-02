import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'

const THEMES = [
  { id:'cosmos',   name:'Cosmos',   sub:'Deep space dark',    preview:'tp-cosmos'   },
  { id:'solar',    name:'Solar',    sub:'Warm & bright',      preview:'tp-solar'    },
  { id:'forest',   name:'Forest',   sub:'Nature green dark',  preview:'tp-forest'   },
  { id:'blossom',  name:'Blossom',  sub:'Light pastel pink 🌸', preview:'tp-blossom' },
]

export default function Settings() {
  const { user, theme, setTheme, toast, notes, sessionsToday, totalQuiz } = useApp()
  const [name, setName]   = useState(user?.name || '')
  const [modal, setModal] = useState(null)

  function saveProfile() {
    if (!name.trim()) return toast("Name can't be empty.", 'error')
    toast('Profile saved ✅')
  }

  function clearCache() {
    setModal({
      title: 'Clear Cache',
      body: 'This resets local stats (sessions, quiz counts). Notes won\'t be deleted.',
      buttons: [
        { label: 'Cancel', cls: 'btn-outline', fn: () => setModal(null) },
        { label: 'Clear',  cls: 'btn-danger',  fn: () => {
          setModal(null)
          ;['sb_sessions','sb_quizzes','sb_ai'].forEach(k => localStorage.removeItem(k))
          toast('Cache cleared.', 'success')
        }}
      ]
    })
  }

  return (
    <div>
      {modal && <Modal {...modal} onClose={() => setModal(null)} />}
      <div className="page-header">
        <div className="page-title">⚙️ Settings</div>
        <div className="page-sub">Customise your StudyBuddy experience.</div>
      </div>

      <div className="settings-grid">
        <div className="settings-section">
          <h3>🎨 Theme</h3>
          <div className="theme-options">
            {THEMES.map(t => (
              <div key={t.id} className={`theme-card ${theme===t.id?'selected':''}`} onClick={() => { setTheme(t.id); toast(`Theme: ${t.name} 🎨`) }}>
                <div className={`theme-preview ${t.preview}`}/>
                <div className="theme-card-name">{t.name}</div>
                <div className="theme-card-sub">{t.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h3>👤 Profile</h3>
          <label className="settings-label">Display Name</label>
          <input className="input-base" value={name} onChange={e => setName(e.target.value)} placeholder="Your name"/>
          <label className="settings-label" style={{marginTop:14}}>Email</label>
          <input className="input-base" value={user?.email || ''} disabled style={{opacity:.5}}/>
          <div style={{marginTop:20}}>
            <button className="btn-sm btn-accent" onClick={saveProfile}>Save Profile</button>
          </div>
        </div>

        <div className="settings-section">
          <h3>🔔 Your Stats</h3>
          {[
            { label:'🔥 Current Streak', val: user?.loginStreak || 0, color:'var(--accent2)' },
            { label:'🏆 Max Streak',     val: user?.maxStreak   || 0, color:'var(--accent)'  },
            { label:'📝 Notes Saved',    val: notes.length,            color:'var(--accent3)' },
            { label:'🎯 Quizzes Done',   val: totalQuiz,               color:'var(--accent)'  },
            { label:'⏱️ Sessions',      val: sessionsToday,            color:'var(--accent2)' },
          ].map(s => (
            <div key={s.label} className="stat-row">
              <span style={{fontSize:14,fontWeight:600}}>{s.label}</span>
              <span className="stat-row-val" style={{color:s.color}}>{s.val}</span>
            </div>
          ))}
        </div>

        <div className="settings-section">
          <h3>⚠️ Danger Zone</h3>
          <p style={{color:'var(--muted)',fontSize:14,marginBottom:20,lineHeight:1.6}}>
            These actions are irreversible. Be careful.
          </p>
          <button className="btn-sm btn-danger" onClick={clearCache}>🗑️ Clear Local Cache</button>
        </div>
      </div>
    </div>
  )
}