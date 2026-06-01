import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {})
}

function timeAgo(d) {
  const diff = Math.floor((Date.now() - new Date(d)) / 60000)
  if (diff < 1)  return 'just now'
  if (diff < 60) return `${diff}m ago`
  const h = Math.floor(diff / 60)
  if (h < 24)    return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

export default function GroupStudy() {
  const { apiFetch, toast, user } = useApp()

  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [platform, setPlatform] = useState('meet')
  const [topic, setTopic]       = useState('')
  const [link, setLink]         = useState('')
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [showJoin, setShowJoin] = useState(false)
  const [newSession, setNewSession] = useState(null)

  useEffect(() => { loadSessions() }, [])

  async function loadSessions() {
    setLoading(true)
    try {
      const res  = await apiFetch('/sessions')
      const data = await res.json()
      setSessions(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  async function createSession() {
    if (!link.trim()) return toast('Meeting link paste karo!', 'error')
    if (platform==='meet' && !link.includes('meet.google.com'))
      return toast('Google Meet link hona chahiye!', 'error')
    if (platform==='zoom' && !link.includes('zoom.us'))
      return toast('Zoom link hona chahiye!', 'error')
    setCreating(true)
    try {
      const res  = await apiFetch('/sessions/create', 'POST', {
        platform, link: link.trim(),
        topic: topic.trim() || `${user?.name}'s Study Session`
      })
      const data = await res.json()
      setSessions(p => [data, ...p])
      setNewSession(data)
      setLink(''); setTopic(''); setShowCreate(false)
      toast('Session created! 🎉')
    } catch { toast('Failed to create session', 'error') }
    setCreating(false)
  }

  async function deleteSession(id) {
    try {
      await apiFetch(`/sessions/${id}`, 'DELETE')
      setSessions(p => p.filter(s => s.id !== id))
      toast('Session removed')
    } catch {}
  }

  function joinByCode() {
    const code = joinCode.trim().toUpperCase()
    if (!code) return toast('Code daalo!', 'error')
    const session = sessions.find(s => s.id === code)
    if (!session) return toast('Session nahi mila! Code check karo.', 'error')
    window.open(session.link, '_blank')
    setShowJoin(false); setJoinCode('')
  }

  const PLATFORM_INFO = {
    meet: { name:'Google Meet', icon:'📹', color:'#1a73e8', bg:'rgba(26,115,232,0.1)', border:'rgba(26,115,232,0.25)', placeholder:'https://meet.google.com/xxx-xxxx-xxx' },
    zoom: { name:'Zoom',        icon:'💻', color:'#2d8cff', bg:'rgba(45,140,255,0.1)', border:'rgba(45,140,255,0.25)', placeholder:'https://zoom.us/j/123456789' },
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">👥 Group Study</div>
        <div className="page-sub">Create or join a study session with your friends</div>
      </div>

      {/* Action row */}
      <div style={{display:'flex',gap:12,marginBottom:24,flexWrap:'wrap'}}>
        <button onClick={()=>{setShowCreate(s=>!s);setShowJoin(false)}}
          style={{display:'flex',alignItems:'center',gap:8,padding:'12px 24px',borderRadius:14,
            cursor:'pointer',fontWeight:700,fontSize:14,background:'var(--grad)',
            border:'none',color:'#fff',boxShadow:'0 4px 16px var(--glow)',transition:'all .2s'}}>
          ➕ Create Session
        </button>
        <button onClick={()=>{setShowJoin(s=>!s);setShowCreate(false)}}
          style={{display:'flex',alignItems:'center',gap:8,padding:'12px 24px',borderRadius:14,
            cursor:'pointer',fontWeight:700,fontSize:14,background:'var(--surface2)',
            border:'1.5px solid var(--border)',color:'var(--fg)',transition:'all .2s'}}>
          🔑 Join by Code
        </button>
        <a href="https://meet.google.com/new" target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>
          <button style={{padding:'12px 20px',borderRadius:14,cursor:'pointer',fontWeight:600,fontSize:13,
            background:'rgba(26,115,232,0.12)',border:'1.5px solid rgba(26,115,232,0.3)',color:'#1a73e8'}}>
            📹 Quick Meet
          </button>
        </a>
        <a href="https://zoom.us/start/videomeeting" target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>
          <button style={{padding:'12px 20px',borderRadius:14,cursor:'pointer',fontWeight:600,fontSize:13,
            background:'rgba(45,140,255,0.12)',border:'1.5px solid rgba(45,140,255,0.3)',color:'#2d8cff'}}>
            💻 Quick Zoom
          </button>
        </a>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{background:'var(--surface2)',border:'1.5px solid var(--border)',
          borderRadius:20,padding:24,marginBottom:20,animation:'fadeUp 0.3s ease'}}>
          <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:16,fontWeight:700,marginBottom:16}}>
            ➕ Create Study Session
          </div>
          <div style={{display:'flex',gap:10,marginBottom:16}}>
            {Object.entries(PLATFORM_INFO).map(([key,info])=>(
              <div key={key} onClick={()=>setPlatform(key)} style={{
                flex:1,padding:'12px 16px',borderRadius:14,cursor:'pointer',
                background:platform===key?info.bg:'var(--surface)',
                border:platform===key?`1.5px solid ${info.border}`:'1.5px solid var(--border)',
                display:'flex',alignItems:'center',gap:10,transition:'all .2s'}}>
                <span style={{fontSize:24}}>{info.icon}</span>
                <div>
                  <div style={{fontWeight:700,fontSize:14,color:platform===key?info.color:'var(--fg)'}}>{info.name}</div>
                  <div style={{fontSize:11,color:'var(--muted)'}}>{key==='meet'?'Google Meet link':'Zoom meeting link'}</div>
                </div>
                {platform===key&&<div style={{marginLeft:'auto',color:info.color,fontSize:18}}>✓</div>}
              </div>
            ))}
          </div>
          <input className="input-base" placeholder="Session topic (e.g. Maths Chapter 5)"
            value={topic} onChange={e=>setTopic(e.target.value)} style={{marginBottom:12}}/>
          <div style={{fontSize:12,color:'var(--muted)',marginBottom:8,padding:'8px 12px',
            background:'var(--surface)',borderRadius:10,border:'1px solid var(--border)',lineHeight:1.7}}>
            {platform==='meet'
              ? <>📹 <strong>Google Meet:</strong> Go to <a href="https://meet.google.com/new" target="_blank" rel="noreferrer" style={{color:'var(--accent)'}}>meet.google.com/new</a> → Copy the link → Paste below</>
              : <>💻 <strong>Zoom:</strong> Open Zoom app → New Meeting → Copy Invitation → Paste the join link below</>
            }
          </div>
          <input className="input-base" placeholder={PLATFORM_INFO[platform].placeholder}
            value={link} onChange={e=>setLink(e.target.value)}
            style={{marginBottom:14,fontFamily:'monospace',fontSize:13}}/>
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>setShowCreate(false)} style={{flex:1,padding:'11px',borderRadius:12,cursor:'pointer',
              background:'var(--surface)',border:'1.5px solid var(--border)',color:'var(--muted)',fontWeight:600,fontSize:14}}>Cancel</button>
            <button onClick={createSession} disabled={creating} style={{flex:2,padding:'11px',borderRadius:12,cursor:'pointer',
              background:'var(--grad)',border:'none',color:'#fff',fontWeight:700,fontSize:14,opacity:creating?0.6:1}}>
              {creating?'Creating...':'Create & Share Session 🚀'}
            </button>
          </div>
        </div>
      )}

      {/* Join form */}
      {showJoin && (
        <div style={{background:'var(--surface2)',border:'1.5px solid var(--border)',
          borderRadius:20,padding:24,marginBottom:20,animation:'fadeUp 0.3s ease'}}>
          <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:16,fontWeight:700,marginBottom:8}}>
            🔑 Join Session by Code
          </div>
          <div style={{fontSize:13,color:'var(--muted)',marginBottom:14}}>
            Apne friend se 6-character session code maango
          </div>
          <input className="input-base" placeholder="Enter code (e.g. AB12CD)"
            value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e=>e.key==='Enter'&&joinByCode()}
            style={{marginBottom:14,fontFamily:'monospace',fontSize:22,letterSpacing:6,textAlign:'center',fontWeight:700}}/>
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>setShowJoin(false)} style={{flex:1,padding:'11px',borderRadius:12,cursor:'pointer',
              background:'var(--surface)',border:'1.5px solid var(--border)',color:'var(--muted)',fontWeight:600,fontSize:14}}>Cancel</button>
            <button onClick={joinByCode} style={{flex:2,padding:'11px',borderRadius:12,cursor:'pointer',
              background:'var(--grad)',border:'none',color:'#fff',fontWeight:700,fontSize:14}}>Join Session 🚀</button>
          </div>
        </div>
      )}

      {/* New session popup */}
      {newSession && (
        <div style={{background:'linear-gradient(135deg,rgba(124,106,247,0.15),rgba(106,247,160,0.1))',
          border:'1.5px solid var(--accent)',borderRadius:20,padding:22,marginBottom:20,animation:'fadeUp 0.3s ease'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div>
              <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:16,fontWeight:700,marginBottom:2}}>🎉 Session Created!</div>
              <div style={{fontSize:13,color:'var(--muted)'}}>Share this code with friends</div>
            </div>
            <button onClick={()=>setNewSession(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:18}}>✕</button>
          </div>
          <div style={{fontFamily:'monospace',fontSize:40,fontWeight:900,letterSpacing:10,
            color:'var(--accent)',background:'var(--glow)',padding:'12px 24px',borderRadius:16,
            textAlign:'center',marginBottom:16}}>{newSession.id}</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <button onClick={()=>{copyToClipboard(newSession.id);toast('Code copied! 📋')}}
              style={{flex:1,padding:'10px',borderRadius:12,cursor:'pointer',fontWeight:700,fontSize:13,
                background:'var(--surface2)',border:'1.5px solid var(--border)',color:'var(--fg)'}}>📋 Copy Code</button>
            <button onClick={()=>{copyToClipboard(newSession.link);toast('Link copied! 🔗')}}
              style={{flex:1,padding:'10px',borderRadius:12,cursor:'pointer',fontWeight:700,fontSize:13,
                background:'var(--surface2)',border:'1.5px solid var(--border)',color:'var(--fg)'}}>🔗 Copy Link</button>
            <button onClick={()=>{copyToClipboard(`Join my study session!\nCode: ${newSession.id}\nLink: ${newSession.link}\nTopic: ${newSession.topic}`);toast('Invite copied! 🎉')}}
              style={{flex:1,padding:'10px',borderRadius:12,cursor:'pointer',fontWeight:700,fontSize:13,
                background:'var(--grad)',border:'none',color:'#fff'}}>📤 Copy Invite</button>
            <a href={newSession.link} target="_blank" rel="noreferrer" style={{flex:1,textDecoration:'none'}}>
              <button style={{width:'100%',padding:'10px',borderRadius:12,cursor:'pointer',fontWeight:700,fontSize:13,
                background:'var(--surface2)',border:'1.5px solid var(--border)',color:'var(--accent)'}}>
                {PLATFORM_INFO[newSession.platform]?.icon} Open Now
              </button>
            </a>
          </div>
        </div>
      )}

      {/* Sessions list */}
      <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:16,fontWeight:700,marginBottom:14}}>📋 Active Sessions</div>
      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {[1,2,3].map(i=><div key={i} className="skeleton skeleton-card" style={{height:90}}/>)}
        </div>
      ) : sessions.length===0 ? (
        <div style={{background:'var(--surface2)',border:'1.5px dashed var(--border)',
          borderRadius:20,padding:48,textAlign:'center'}}>
          <div style={{fontSize:48,marginBottom:12}}>📚</div>
          <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:17,fontWeight:700,marginBottom:6}}>No active sessions</div>
          <div style={{color:'var(--muted)',fontSize:14}}>Create a session and invite your friends!</div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {sessions.map(s=>{
            const info = PLATFORM_INFO[s.platform]||PLATFORM_INFO.meet
            return (
              <div key={s.id} style={{background:'var(--surface2)',border:'1.5px solid var(--border)',
                borderRadius:18,padding:'16px 20px',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
                <div style={{width:44,height:44,borderRadius:14,flexShrink:0,background:info.bg,
                  border:`1.5px solid ${info.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>
                  {info.icon}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {s.topic}
                  </div>
                  <div style={{fontSize:12,color:'var(--muted)',display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                    <span style={{color:info.color,fontWeight:600}}>{info.name}</span>
                    <span>👤 {s.hostName}</span>
                    <span>🕐 {timeAgo(s.createdAt)}</span>
                  </div>
                </div>
                <div style={{fontFamily:'monospace',fontSize:15,fontWeight:800,letterSpacing:3,
                  color:'var(--accent)',background:'var(--glow)',padding:'4px 14px',borderRadius:10,flexShrink:0}}>
                  {s.id}
                </div>
                <div style={{display:'flex',gap:8,flexShrink:0}}>
                  <button onClick={()=>{copyToClipboard(s.id);toast('Code copied! 📋')}}
                    style={{padding:'7px 12px',borderRadius:10,cursor:'pointer',fontSize:12,fontWeight:600,
                      background:'var(--surface)',border:'1.5px solid var(--border)',color:'var(--muted)'}}>📋</button>
                  <button onClick={()=>{copyToClipboard(`Join my study session!\nCode: ${s.id}\nLink: ${s.link}\nTopic: ${s.topic}`);toast('Invite copied!')}}
                    style={{padding:'7px 12px',borderRadius:10,cursor:'pointer',fontSize:12,fontWeight:600,
                      background:'var(--surface)',border:'1.5px solid var(--border)',color:'var(--muted)'}}>📤</button>
                  <a href={s.link} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>
                    <button style={{padding:'7px 14px',borderRadius:10,cursor:'pointer',fontSize:12,fontWeight:700,
                      background:'var(--grad)',border:'none',color:'#fff'}}>Join →</button>
                  </a>
                  {s.hostName===user?.name&&(
                    <button onClick={()=>deleteSession(s.id)} style={{padding:'7px 10px',borderRadius:10,cursor:'pointer',
                      fontSize:13,background:'rgba(255,100,100,0.1)',border:'1.5px solid rgba(255,100,100,0.2)',color:'#ff6464'}}>🗑️</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}