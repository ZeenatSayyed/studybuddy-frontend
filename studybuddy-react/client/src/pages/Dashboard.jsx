import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'

function getGreeting(name) {
  const h = new Date().getHours()
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${g}, ${(name||'Student').split(' ')[0]}! 👋`
}

function getLast7Days() {
  const short = ['S','M','T','W','T','F','S']
  const full  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const arr   = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setHours(0,0,0,0)
    d.setDate(d.getDate() - i)
    arr.push({
      dateStr : d.toISOString().slice(0,10),
      label   : short[d.getDay()],
      dayName : full[d.getDay()],
      isToday : i === 0,
    })
  }
  return arr
}

function formatFullDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
}

function Bar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div style={{background:'var(--surface2)',borderRadius:99,height:8,overflow:'hidden',marginTop:7}}>
      <div style={{height:'100%',borderRadius:99,width:`${pct}%`,background:color,transition:'width 0.9s cubic-bezier(.16,1,.3,1)'}}/>
    </div>
  )
}

export default function Dashboard({ onNavigate }) {
  const { user, notes, sessionsToday, totalQuiz, totalAI, apiFetch } = useApp()
  const [usageMap, setUsageMap] = useState({})
  const [notesMap, setNotesMap] = useState({})
  const [selected, setSelected] = useState(null)
  const last7    = getLast7Days()
  const todayStr = new Date().toISOString().slice(0,10)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const res  = await apiFetch('/usage')
      const data = await res.json()
      const map  = {}
      data.forEach(u => {
        const d = new Date(u.date).toISOString().slice(0,10)
        if (!map[d]) map[d] = {}
        map[d][u.feature] = (map[d][u.feature] || 0) + u.count
      })
      setUsageMap(map)
    } catch {}

    try {
      const res  = await apiFetch('/notes')
      const data = await res.json()
      const nm   = {}
      data.forEach(n => {
        if (n.createdAt) {
          const d = new Date(n.createdAt).toISOString().slice(0,10)
          nm[d] = (nm[d] || 0) + 1
        }
      })
      setNotesMap(nm)
    } catch {}
  }

  function hasActivity(dateStr) {
    return !!(usageMap[dateStr] && Object.keys(usageMap[dateStr]).length > 0) ||
           !!(notesMap[dateStr] && notesMap[dateStr] > 0)
  }

  function getDetail(dateStr) {
    const u = usageMap[dateStr] || {}
    return {
      notesAdded    : notesMap[dateStr] || 0,
      timerSessions : u.timer || 0,
      quizDone      : u.quiz  || 0,
      aiQueries     : u.ai    || 0,
      timeSpentMin  : (u.timer || 0) * 25,
    }
  }

  const detail = selected ? getDetail(selected) : null

  return (
    <div>
      {/* HEADER */}
      <div className="page-header">
        <div className="page-title">{getGreeting(user?.name)}</div>
        <div className="page-sub">Click any day to see your activity details.</div>
      </div>

      {/* STAT CARDS */}
      <div className="stats-grid">
        {[
          { icon:'📝', label:'Notes',      val: notes.length,  hint:'Keep capturing!' },
          { icon:'🎯', label:'Quizzes',    val: totalQuiz,     hint:'Practice daily'  },
          { icon:'⏱️', label:'Sessions',  val: sessionsToday, hint:'25 min focus'    },
          { icon:'🤖', label:'AI Queries', val: totalAI,       hint:'Ask more!'       },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="sc-shine"/>
            <span className="sc-icon">{s.icon}</span>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-hint">↑ {s.hint}</div>
          </div>
        ))}
      </div>

      {/* STREAK CARD — clickable days */}
      <div className="card" style={{marginBottom:20}}>

        {/* Title row with flame badge */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div className="card-title" style={{marginBottom:0}}>📅 Last 7 Days — Click a day!</div>
          <div style={{display:'flex',alignItems:'center',gap:8,background:'var(--surface2)',
            border:'1px solid var(--border)',borderRadius:12,padding:'8px 14px'}}>
            <span style={{fontSize:20,animation:'flamePulse 1.5s ease-in-out infinite'}}>🔥</span>
            <div>
              <div style={{fontWeight:700,fontSize:14,lineHeight:1}}>{user?.loginStreak||0} day streak</div>
              <div style={{fontSize:11,color:'var(--muted)'}}>Best: {user?.maxStreak||0} days</div>
            </div>
          </div>
        </div>

        {/* 7 clickable day boxes */}
        <div style={{display:'flex',gap:10,marginBottom:16}}>
          {last7.map(day => {
            const active     = hasActivity(day.dateStr)
            const isSelected = selected === day.dateStr
            return (
              <div
                key={day.dateStr}
                onClick={() => setSelected(isSelected ? null : day.dateStr)}
                title={`${day.dayName} — ${day.dateStr}`}
                style={{
                  flex:1, height:64, borderRadius:16, cursor:'pointer',
                  display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center', gap:3,
                  userSelect:'none',
                  border: isSelected
                    ? '2.5px solid var(--accent)'
                    : active
                      ? '1.5px solid var(--accent)'
                      : '1.5px solid var(--border)',
                  background: isSelected
                    ? 'var(--glow)'
                    : day.isToday
                      ? 'linear-gradient(135deg,var(--accent),var(--accent3))'
                      : active
                        ? 'rgba(124,106,247,0.08)'
                        : 'var(--surface2)',
                  color: isSelected
                    ? 'var(--accent)'
                    : day.isToday
                      ? '#fff'
                      : active
                        ? 'var(--accent)'
                        : 'var(--muted)',
                  transform: isSelected ? 'translateY(-5px)' : 'none',
                  boxShadow: isSelected ? '0 8px 24px var(--glow)' : 'none',
                  transition: 'all 0.2s cubic-bezier(.16,1,.3,1)',
                }}
              >
                <span style={{fontSize:13,fontWeight:800}}>{day.label}</span>
                <span style={{fontSize:8,opacity: active||day.isToday ? 1 : 0.25}}>
                  {active||day.isToday ? '●' : '○'}
                </span>
                {active && !day.isToday && <span style={{fontSize:9,fontWeight:700}}>✓</span>}
              </div>
            )
          })}
        </div>

        {/* DETAIL PANEL — slides in on click */}
        {selected && detail && (
          <div style={{
            background:'var(--surface2)', borderRadius:18, padding:22,
            border:'1.5px solid var(--accent)',
            boxShadow:'0 0 40px var(--glow)',
            animation:'fadeUp 0.3s cubic-bezier(.16,1,.3,1)',
          }}>
            {/* Panel header */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div>
                <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:17,fontWeight:700,
                  background:'var(--grad)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                  {selected === todayStr ? "📊 Today's Activity" : `📊 ${formatFullDate(selected)}`}
                </div>
                <div style={{fontSize:12,color:'var(--muted)',marginTop:3}}>
                  {hasActivity(selected) ? '✅ You were active on this day!' : '😴 No activity recorded.'}
                </div>
              </div>
              <button onClick={() => setSelected(null)}
                style={{background:'none',border:'none',cursor:'pointer',
                  color:'var(--muted)',fontSize:20,lineHeight:1,padding:'4px 8px'}}>✕
              </button>
            </div>

            {/* 4 detail boxes */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[
                { icon:'📝', label:'Notes Added',   val:detail.notesAdded,   max:10,  color:'var(--accent)',  suffix:'',   empty:'No notes created'       },
                { icon:'⏱️', label:'Time Spent',   val:detail.timeSpentMin, max:120, color:'var(--accent2)', suffix:' m', empty:'No focus sessions'       },
                { icon:'🎯', label:'Quizzes Done',  val:detail.quizDone,     max:10,  color:'var(--accent3)', suffix:'',   empty:'No quizzes attempted'    },
                { icon:'🤖', label:'AI Queries',    val:detail.aiQueries,    max:20,  color:'#f76af7',        suffix:'',   empty:'No AI queries'           },
              ].map(item => (
                <div key={item.label}
                  style={{background:'var(--surface)',border:'1.5px solid var(--border)',borderRadius:16,padding:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:11,color:'var(--muted)',fontWeight:700,textTransform:'uppercase'}}>
                      {item.icon} {item.label}
                    </span>
                    <span style={{fontFamily:"'Clash Display',sans-serif",fontSize:28,fontWeight:700,color:item.color}}>
                      {item.val}{item.suffix}
                    </span>
                  </div>
                  <Bar value={item.val} max={item.max} color={item.color}/>
                  <div style={{fontSize:11,color:'var(--muted)',marginTop:5}}>
                    {item.val === 0 ? item.empty : `${item.val}${item.suffix} recorded`}
                  </div>
                </div>
              ))}
            </div>

            {/* Streak info row */}
            <div style={{marginTop:12,padding:'10px 16px',background:'var(--surface)',
              borderRadius:12,border:'1px solid var(--border)',
              display:'flex',alignItems:'center',gap:10}}>
              <span>🔥</span>
              <span style={{fontSize:13,color:'var(--muted)'}}>
                {selected === todayStr
                  ? `Current streak: ${user?.loginStreak||0} days • Best: ${user?.maxStreak||0} days`
                  : hasActivity(selected)
                    ? `Active day ✅ — current streak: ${user?.loginStreak||0} days`
                    : 'Not active — streak not counted'}
              </span>
              {hasActivity(selected) && (
                <div style={{marginLeft:'auto',padding:'3px 10px',background:'var(--glow)',
                  borderRadius:99,border:'1px solid var(--accent)',
                  fontSize:11,fontWeight:700,color:'var(--accent)'}}>Active ✓</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM ROW */}
      <div className="dash-grid">

        {/* Today's Progress */}
        <div className="card">
          <div className="card-title">📈 Today's Progress</div>
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {[
              { icon:'📝', label:'Notes created today', val:notesMap[todayStr]||0, max:10,  color:'var(--accent)'  },
              { icon:'⏱️', label:'Focus time',          val:sessionsToday*25,      max:120, color:'var(--accent2)', suffix:' min' },
              { icon:'🎯', label:'Quizzes completed',   val:totalQuiz,             max:10,  color:'var(--accent3)' },
              { icon:'🤖', label:'AI questions asked',  val:totalAI,               max:20,  color:'#f76af7'        },
            ].map(item => (
              <div key={item.label}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:13,fontWeight:600}}>{item.icon} {item.label}</span>
                  <span style={{fontSize:13,fontWeight:700,color:item.color}}>
                    {item.val}{item.suffix||''}
                    <span style={{color:'var(--muted)',fontWeight:400}}> / {item.max}{item.suffix||''}</span>
                  </span>
                </div>
                <Bar value={item.val} max={item.max} color={item.color}/>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-title">⚡ Quick Actions</div>
          <div className="quick-actions">
            <button className="quick-btn" onClick={() => onNavigate('notes')}><span className="qbi">📝</span> Add a new note</button>
            <button className="quick-btn" onClick={() => onNavigate('quiz')}><span className="qbi">🎯</span> Start AI quiz from notes</button>
            <button className="quick-btn" onClick={() => onNavigate('timer')}><span className="qbi">⏱️</span> Begin focus session</button>
            <button className="quick-btn" onClick={() => onNavigate('classroom')}><span className="qbi">💬</span> Open classroom chat</button>
          </div>
        </div>

      </div>
    </div>
  )
}