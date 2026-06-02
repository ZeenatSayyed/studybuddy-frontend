import { useState } from 'react'
import { useApp } from '../context/AppContext'

const AVATARS = ['🎓','🦁','🐯','🦊','🐺','🦅','🐉','🌟','⚡','🔥','💎','🚀']

export default function Profile() {
  const { user, token, apiFetch, toast, login } = useApp()

  const [editing, setEditing]   = useState(false)
  const [name, setName]         = useState(user?.name || '')
  const [bio, setBio]           = useState(user?.bio || '')
  const [college, setCollege]   = useState(user?.college || '')
  const [branch, setBranch]     = useState(user?.branch || '')
  const [year, setYear]         = useState(user?.year || '')
  const [avatar, setAvatar]     = useState(user?.avatar || '🎓')
  const [saving, setSaving]     = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })
    : 'N/A'

  const totalNotes    = user?.totalNotes    ?? parseInt(localStorage.getItem('sb_notes_count') || '0')
  const totalQuizzes  = user?.totalQuizzes  ?? parseInt(localStorage.getItem('sb_quizzes') || '0')
  const totalSessions = user?.totalSessions ?? parseInt(localStorage.getItem('sb_sessions') || '0')
  const totalAI       = user?.totalAI       ?? parseInt(localStorage.getItem('sb_ai') || '0')

  const xp    = totalQuizzes * 10 + totalSessions * 15 + totalNotes * 5
  const level = Math.floor(xp / 100) + 1
  const pct   = xp % 100
  const titles = ['Beginner','Explorer','Focused','Scholar','Achiever','Expert','Master','Legend']
  const title  = titles[Math.min(level - 1, titles.length - 1)]

  async function saveProfile() {
    setSaving(true)
    try {
      const res  = await apiFetch('/profile', 'PUT', { name, bio, college, branch, year, avatar })
      const data = await res.json()
      if (res.ok) {
        login(token, { ...user, ...data.user })
        toast('Profile updated! ✅')
        setEditing(false)
        setShowPicker(false)
      } else {
        toast(data.message || 'Update failed', 'error')
      }
    } catch {
      toast('Server error', 'error')
    } finally {
      setSaving(false)
    }
  }

  const stats = [
    { icon: '📝', label: 'Notes',    val: totalNotes    },
    { icon: '🎯', label: 'Quizzes',  val: totalQuizzes  },
    { icon: '⏱️', label: 'Sessions', val: totalSessions },
    { icon: '🤖', label: 'AI Chats', val: totalAI       },
    { icon: '🔥', label: 'Streak',   val: user?.loginStreak ?? 0 },
    { icon: '⭐', label: 'Level',    val: level         },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">👤 My Profile</div>
        <div className="page-sub">Your study identity and achievements</div>
      </div>

      {/* ── Profile Card ── */}
      <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--grad)' }} />

        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap', paddingTop: 8 }}>

          {/* Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div
              onClick={() => editing && setShowPicker(v => !v)}
              style={{
                width: 96, height: 96, borderRadius: 24,
                background: 'var(--surface2)', border: '2px solid var(--border)',
                fontSize: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: editing ? 'pointer' : 'default',
                boxShadow: '0 0 24px var(--glow)', position: 'relative'
              }}
            >
              {avatar}
              {editing && (
                <div style={{
                  position: 'absolute', bottom: -6, right: -6,
                  background: 'var(--accent)', borderRadius: '50%',
                  width: 22, height: 22, fontSize: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>✏️</div>
              )}
            </div>

            {/* Avatar Picker */}
            {showPicker && editing && (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 6, background: 'var(--surface2)',
                border: '1px solid var(--border)', borderRadius: 14,
                padding: 10
              }}>
                {AVATARS.map(a => (
                  <button key={a} onClick={() => { setAvatar(a); setShowPicker(false) }}
                    style={{
                      width: 38, height: 38, borderRadius: 9,
                      background: a === avatar ? 'var(--glow)' : 'none',
                      border: a === avatar ? '1.5px solid var(--accent)' : '1.5px solid transparent',
                      fontSize: 20, cursor: 'pointer'
                    }}>
                    {a}
                  </button>
                ))}
              </div>
            )}

            <div style={{
              background: 'rgba(247,162,106,0.15)', border: '1px solid rgba(247,162,106,0.3)',
              color: 'var(--accent2)', borderRadius: 20,
              padding: '4px 12px', fontSize: 12, fontWeight: 700
            }}>
              🔥 {user?.loginStreak || 0} day streak
            </div>
          </div>

          {/* Info / Form */}
          <div style={{ flex: 1, minWidth: 200 }}>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Full Name</label>
                    <input value={name} onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                      style={{ width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '8px 12px', color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>College</label>
                    <input value={college} onChange={e => setCollege(e.target.value)}
                      placeholder="e.g. Mumbai University"
                      style={{ width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '8px 12px', color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Branch / Major</label>
                    <input value={branch} onChange={e => setBranch(e.target.value)}
                      placeholder="e.g. Computer Science"
                      style={{ width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '8px 12px', color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Year</label>
                    <select value={year} onChange={e => setYear(e.target.value)}
                      style={{ width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '8px 12px', color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}>
                      <option value="">Select year</option>
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year (Final)</option>
                      <option>Postgraduate</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)}
                    placeholder="Tell something about yourself..."
                    rows={3}
                    style={{ width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '8px 12px', color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={saveProfile} disabled={saving}
                    style={{ background: 'var(--grad)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                    {saving ? '⏳ Saving...' : '✅ Save'}
                  </button>
                  <button onClick={() => { setEditing(false); setShowPicker(false) }}
                    style={{ background: 'var(--surface2)', border: '1.5px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '9px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Cancel
                  </button>
                </div>
              </div>

            ) : (
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{user?.name || 'Student'}</div>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 6 }}>📧 {user?.email}</div>

                {(user?.college || user?.branch || user?.year) && (
                  <div style={{ color: 'var(--accent3)', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    🏫 {[user?.college, user?.branch, user?.year].filter(Boolean).join(' · ')}
                  </div>
                )}

                {user?.bio && (
                  <div style={{
                    fontStyle: 'italic', background: 'var(--surface2)',
                    borderLeft: '3px solid var(--accent)', padding: '8px 12px',
                    borderRadius: '0 10px 10px 0', margin: '10px 0',
                    fontSize: 13, opacity: 0.85
                  }}>
                    "{user.bio}"
                  </div>
                )}

                <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 14 }}>📅 Joined {joinedDate}</div>

                <button onClick={() => setEditing(true)}
                  style={{ background: 'var(--grad)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✏️ Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">📊 My Study Stats</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 14 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '16px 12px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5
            }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{s.val}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textAlign: 'center' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Level / XP ── */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">🏆 Study Level</div>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ background: 'var(--grad)', color: '#fff', borderRadius: 20, padding: '3px 14px', fontSize: 13, fontWeight: 800 }}>
              Level {level}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
            <div style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 12 }}>{xp} XP</div>
          </div>

          <div style={{ height: 10, borderRadius: 10, background: 'var(--surface2)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 10, background: 'var(--grad)', width: `${pct}%`, transition: 'width 0.8s ease' }} />
          </div>

          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
            {100 - pct} XP to next level — keep studying! 🚀
          </div>
        </div>
      </div>
    </div>
  )
}