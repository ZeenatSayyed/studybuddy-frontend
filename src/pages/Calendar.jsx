import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'

const FEATURES = [
  { key:'notes',  icon:'📝', name:'Notes',     color:'var(--accent)'  },
  { key:'quiz',   icon:'🎯', name:'Quiz',      color:'var(--accent3)' },
  { key:'timer',  icon:'⏱️', name:'Timer',    color:'var(--accent2)' },
  { key:'ai',     icon:'🤖', name:'AI Chats',  color:'#f76af7'        },
  { key:'chat',   icon:'💬', name:'Classroom', color:'var(--success)' },
]
const FEAT_COLORS = { notes:'var(--accent)', quiz:'var(--accent3)', timer:'var(--accent2)', ai:'#f76af7', chat:'var(--success)' }
const PRI_COLOR   = { high:'#ff6b6b', medium:'var(--accent)', low:'var(--success)' }
const PRI_LABEL   = { high:'🔴 High', medium:'🟡 Medium', low:'🟢 Low' }
const DAY_LABELS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function Calendar() {
  const { apiFetch, toast } = useApp()

  const today     = new Date()
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const [usageMap, setUsageMap] = useState({})
  const [totals,   setTotals]   = useState({})
  const [tasks,    setTasks]    = useState([])
  const [loading,  setLoading]  = useState(true)

  const [selected, setSelected] = useState(null)

  const [newTitle,    setNewTitle]    = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [adding,      setAdding]      = useState(false)

  const [plannerView, setPlannerView] = useState('calendar')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [uRes, tRes] = await Promise.all([apiFetch('/usage'), apiFetch('/tasks')])
      const uData = await uRes.json()
      const tData = await tRes.json()

      const map = {}, tot = {}
      uData.forEach(u => {
        const d = new Date(u.date).toISOString().slice(0,10)
        if (!map[d]) map[d] = {}
        map[d][u.feature] = (map[d][u.feature] || 0) + u.count
        tot[u.feature] = (tot[u.feature] || 0) + u.count
      })
      setUsageMap(map); setTotals(tot)
      setTasks(Array.isArray(tData) ? tData : [])
    } catch(e) { console.log(e) }
    setLoading(false)
  }

  async function addTask() {
    if (!newTitle.trim()) return toast('Task title likho!', 'error')
    if (!selected) return
    setAdding(true)
    try {
      const res  = await apiFetch('/tasks', 'POST', { title: newTitle.trim(), date: selected, priority: newPriority })
      const task = await res.json()
      setTasks(p => [...p, task])
      setNewTitle(''); toast('Task added! ✅')
    } catch { toast('Failed to add task', 'error') }
    setAdding(false)
  }

  async function toggleTask(task) {
    try {
      const res     = await apiFetch(`/tasks/${task._id}`, 'PATCH', { done: !task.done })
      const updated = await res.json()
      setTasks(p => p.map(t => t._id === task._id ? updated : t))
    } catch { toast('Update failed', 'error') }
  }

  async function deleteTask(id) {
    try {
      await apiFetch(`/tasks/${id}`, 'DELETE')
      setTasks(p => p.filter(t => t._id !== id))
      toast('Deleted')
    } catch { toast('Delete failed', 'error') }
  }

  const monthLabel  = new Date(viewYear, viewMonth).toLocaleString('default', { month:'long' }) + ' ' + viewYear
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate()
  const todayStr    = today.toISOString().slice(0,10)

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y=>y-1); setViewMonth(11) }
    else setViewMonth(m=>m-1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y=>y+1); setViewMonth(0) }
    else setViewMonth(m=>m+1)
  }

  function dateStr(y, m, d) {
    return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  }

  function tasksFor(str) { return tasks.filter(t => t.date === str) }

  function getWeekDays() {
    const days = []
    const d = new Date(today)
    d.setDate(d.getDate() - d.getDay())
    for (let i = 0; i < 7; i++) {
      const copy = new Date(d)
      copy.setDate(d.getDate() + i)
      days.push(copy.toISOString().slice(0,10))
    }
    return days
  }

  function getUpcoming() {
    const result = []
    for (let i = 0; i <= 14; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const str = d.toISOString().slice(0,10)
      const dayTasks = tasks.filter(t => t.date === str && !t.done)
      if (dayTasks.length) result.push({ date: str, tasks: dayTasks })
    }
    return result
  }

  const selectedTasks = selected ? tasksFor(selected) : []
  const donePct       = selectedTasks.length ? Math.round((selectedTasks.filter(t=>t.done).length / selectedTasks.length)*100) : 0
  const weekDays      = getWeekDays()
  const upcoming      = getUpcoming()
  const pendingCount  = tasks.filter(t => !t.done && t.date >= todayStr).length

  return (
    <div>
      <div className="page-header">
        <div className="page-title">📅 Planner & Calendar</div>
        <div className="page-sub">Track activity, plan tasks, stay on top of deadlines</div>
      </div>

      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
        {[
          { v:'calendar', label:'📅 Calendar' },
          { v:'week',     label:'🗓️ This Week' },
          { v:'upcoming', label:`📋 Upcoming${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
        ].map(({v,label}) => (
          <button key={v} onClick={() => setPlannerView(v)} style={{
            padding:'10px 20px',borderRadius:99,fontSize:14,fontWeight:600,cursor:'pointer',
            border: plannerView===v ? 'none' : '1.5px solid var(--border)',
            background: plannerView===v ? 'var(--grad)' : 'var(--surface2)',
            color: plannerView===v ? '#fff' : 'var(--fg)',
            transition:'all 0.2s'
          }}>{label}</button>
        ))}
      </div>

      {/* ══ CALENDAR VIEW ══ */}
      {plannerView === 'calendar' && (
        <div style={{display:'grid',gridTemplateColumns:selected?'1fr 360px':'1fr',gap:20,alignItems:'start'}}>
          <div className="card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <button onClick={prevMonth} style={{background:'var(--surface2)',border:'1.5px solid var(--border)',borderRadius:10,padding:'8px 14px',cursor:'pointer',fontSize:16,color:'var(--fg)'}}>‹</button>
              <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:18,fontWeight:700}}>{monthLabel}</div>
              <button onClick={nextMonth} style={{background:'var(--surface2)',border:'1.5px solid var(--border)',borderRadius:10,padding:'8px 14px',cursor:'pointer',fontSize:16,color:'var(--fg)'}}>›</button>
            </div>

            {loading ? (
              <div style={{textAlign:'center',padding:32}}><div className="spinner"/></div>
            ) : (
              <div className="cal-grid">
                {DAY_LABELS.map(d => <div key={d} className="cal-day-label">{d}</div>)}
                {Array.from({length: firstDay}).map((_,i) => <div key={`e${i}`} className="cal-day" style={{opacity:0}}/>)}
                {Array.from({length: daysInMonth}).map((_,i) => {
                  const d     = i + 1
                  const str   = dateStr(viewYear, viewMonth, d)
                  const use   = usageMap[str]
                  const isToday  = str === todayStr
                  const isSel    = str === selected
                  const hasData  = use && Object.keys(use).length > 0
                  const dayTasks = tasksFor(str)
                  const hasTasks = dayTasks.length > 0

                  let bg = 'var(--surface2)', border = '1.5px solid var(--border)'
                  if (hasData && !isToday && !isSel) {
                    const col = FEAT_COLORS[Object.keys(use)[0]] || 'var(--accent)'
                    bg = col + '22'; border = `1.5px solid ${col}`
                  }
                  if (isSel)    { bg = 'var(--grad)'; border = 'none' }
                  if (isToday && !isSel) { border = '2px solid var(--accent)' }

                  return (
                    <div key={d} onClick={() => setSelected(isSel ? null : str)} style={{
                      background:bg, border, borderRadius:12, minHeight:56, padding:'6px 8px',
                      cursor:'pointer', transition:'all 0.15s',
                      transform: isSel ? 'scale(1.05)' : 'scale(1)',
                    }}>
                      <div style={{fontWeight:isToday||isSel?800:500, fontSize:14,
                        color: isSel?'#fff':isToday?'var(--accent)':'var(--fg)'}}>{d}</div>
                      {hasTasks && (
                        <div style={{display:'flex',gap:3,flexWrap:'wrap',marginTop:3}}>
                          {dayTasks.slice(0,3).map((t,ti) => (
                            <div key={ti} style={{width:6,height:6,borderRadius:99,
                              background:t.done?'var(--success)':PRI_COLOR[t.priority]||'var(--accent)',
                              opacity:t.done?0.5:1}}/>
                          ))}
                          {dayTasks.length > 3 && <div style={{fontSize:9,color:isSel?'#fff':'var(--muted)',lineHeight:'6px'}}>+{dayTasks.length-3}</div>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="usage-legend" style={{marginTop:16}}>
              {FEATURES.map(f => (
                <div key={f.key} className="legend-item">
                  <div className="legend-dot" style={{background:f.color}}/>{f.name}
                </div>
              ))}
              <div className="legend-item">
                <div className="legend-dot" style={{background:'var(--success)'}}/>Tasks Done
              </div>
            </div>
          </div>

          {/* Day panel */}
          {selected && (
            <div className="card" style={{animation:'fadeUp 0.25s ease',position:'sticky',top:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div>
                  <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:16,fontWeight:700}}>
                    {new Date(selected+'T00:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short'})}
                  </div>
                  {selectedTasks.length > 0 && (
                    <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>
                      {selectedTasks.filter(t=>t.done).length}/{selectedTasks.length} done
                    </div>
                  )}
                </div>
                <button onClick={()=>setSelected(null)} style={{background:'var(--surface)',border:'1.5px solid var(--border)',borderRadius:8,padding:'4px 10px',cursor:'pointer',color:'var(--muted)',fontSize:13}}>✕</button>
              </div>

              {selectedTasks.length > 0 && (
                <div style={{height:6,background:'var(--surface)',borderRadius:99,marginBottom:16,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${donePct}%`,background:'var(--grad)',borderRadius:99,transition:'width 0.4s ease'}}/>
                </div>
              )}

              {usageMap[selected] && (
                <div style={{marginBottom:16,padding:'10px 14px',background:'var(--surface2)',borderRadius:12,border:'1px solid var(--border)'}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--muted)',marginBottom:6}}>📊 Activity</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {Object.entries(usageMap[selected]).map(([feat,cnt]) => {
                      const f = FEATURES.find(x=>x.key===feat)
                      return f ? (
                        <span key={feat} style={{padding:'3px 10px',borderRadius:99,fontSize:12,fontWeight:600,
                          background:f.color+'22',border:`1px solid ${f.color}44`,color:f.color}}>
                          {f.icon} {f.name} ×{cnt}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              <div style={{marginBottom:12}}>
                {selectedTasks.length === 0 ? (
                  <div style={{textAlign:'center',padding:'20px 0',color:'var(--muted)',fontSize:13}}>No tasks for this day</div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {selectedTasks.map(task => (
                      <div key={task._id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:12,
                        background:'var(--surface2)',border:'1.5px solid var(--border)',opacity:task.done?0.6:1,transition:'opacity 0.2s'}}>
                        <div onClick={()=>toggleTask(task)} style={{width:20,height:20,borderRadius:6,flexShrink:0,cursor:'pointer',
                          border:`2px solid ${PRI_COLOR[task.priority]}`,
                          background:task.done?PRI_COLOR[task.priority]:'transparent',
                          display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#fff',transition:'all 0.2s'}}>
                          {task.done?'✓':''}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:14,fontWeight:500,textDecoration:task.done?'line-through':'none',
                            color:task.done?'var(--muted)':'var(--fg)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                            {task.title}
                          </div>
                          <div style={{fontSize:11,color:PRI_COLOR[task.priority],marginTop:1,fontWeight:600}}>{PRI_LABEL[task.priority]}</div>
                        </div>
                        <button onClick={()=>deleteTask(task._id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:15,padding:'2px',flexShrink:0}}>🗑️</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{borderTop:'1px solid var(--border)',paddingTop:14}}>
                <div style={{fontSize:13,fontWeight:700,color:'var(--muted)',marginBottom:10}}>+ Add Task</div>
                <input className="input-base" placeholder="Task title..."
                  value={newTitle} onChange={e=>setNewTitle(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&addTask()} style={{marginBottom:8}}/>
                <div style={{display:'flex',gap:8}}>
                  <select className="input-base" value={newPriority} onChange={e=>setNewPriority(e.target.value)} style={{flex:1,padding:'8px 10px'}}>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                  <button className="btn-sm btn-accent" onClick={addTask} disabled={adding} style={{padding:'8px 16px',opacity:adding?0.6:1}}>
                    {adding ? '...' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ WEEK VIEW ══ */}
      {plannerView === 'week' && (
        <div className="card">
          <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:17,fontWeight:700,marginBottom:20}}>🗓️ This Week</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:10}}>
            {weekDays.map(str => {
              const d        = new Date(str+'T00:00:00')
              const isToday  = str === todayStr
              const dayTasks = tasksFor(str)
              const doneCnt  = dayTasks.filter(t=>t.done).length
              return (
                <div key={str} onClick={() => { setSelected(str); setPlannerView('calendar') }}
                  style={{background:isToday?'var(--glow)':'var(--surface2)',
                    border:isToday?'1.5px solid var(--accent)':'1.5px solid var(--border)',
                    borderRadius:16,padding:'12px 10px',minHeight:140,cursor:'pointer'}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:2}}>
                    {d.toLocaleDateString('en',{weekday:'short'})}
                  </div>
                  <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:22,fontWeight:800,
                    color:isToday?'var(--accent)':'var(--fg)',marginBottom:8}}>{d.getDate()}</div>
                  <div style={{display:'flex',flexDirection:'column',gap:4}}>
                    {dayTasks.slice(0,3).map((t,i) => (
                      <div key={i} style={{fontSize:11,padding:'3px 6px',borderRadius:6,
                        background:t.done?'rgba(106,247,160,0.1)':PRI_COLOR[t.priority]+'22',
                        color:t.done?'var(--success)':PRI_COLOR[t.priority],fontWeight:600,
                        textDecoration:t.done?'line-through':'none',
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                    ))}
                    {dayTasks.length > 3 && <div style={{fontSize:10,color:'var(--muted)'}}>+{dayTasks.length-3} more</div>}
                    {dayTasks.length === 0 && <div style={{fontSize:10,color:'var(--border)'}}>No tasks</div>}
                  </div>
                  {dayTasks.length > 0 && (
                    <div style={{marginTop:8,fontSize:10,color:'var(--muted)'}}>{doneCnt}/{dayTasks.length} done</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══ UPCOMING VIEW ══ */}
      {plannerView === 'upcoming' && (
        <div className="card">
          <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:17,fontWeight:700,marginBottom:20}}>📋 Upcoming Tasks (Next 14 Days)</div>
          {upcoming.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎉</span>
              <p>No pending tasks! You're all caught up.</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {upcoming.map(({date, tasks: dayT}) => {
                const d      = new Date(date+'T00:00:00')
                const isToday = date === todayStr
                const tmrw    = new Date(today); tmrw.setDate(today.getDate()+1)
                const isTmrw  = date === tmrw.toISOString().slice(0,10)
                const label   = isToday ? '📍 Today' : isTmrw ? '⏰ Tomorrow'
                  : d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})
                return (
                  <div key={date}>
                    <div style={{fontSize:13,fontWeight:700,marginBottom:8,display:'flex',alignItems:'center',gap:8,
                      color:isToday?'var(--accent)':isTmrw?'#f76af7':'var(--muted)'}}>
                      {label}
                      <div style={{flex:1,height:1,background:'var(--border)'}}/>
                      <span style={{fontWeight:400,fontSize:11}}>{dayT.length} task{dayT.length>1?'s':''}</span>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                      {dayT.map(task => (
                        <div key={task._id} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',
                          borderRadius:12,background:'var(--surface2)',border:`1.5px solid ${PRI_COLOR[task.priority]}44`}}>
                          <div onClick={()=>toggleTask(task)} style={{width:20,height:20,borderRadius:6,flexShrink:0,cursor:'pointer',
                            border:`2px solid ${PRI_COLOR[task.priority]}`,background:'transparent',
                            display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#fff'}}/>
                          <div style={{flex:1}}>
                            <div style={{fontSize:14,fontWeight:500}}>{task.title}</div>
                            <div style={{fontSize:11,color:PRI_COLOR[task.priority],marginTop:1,fontWeight:600}}>{PRI_LABEL[task.priority]}</div>
                          </div>
                          <button onClick={()=>deleteTask(task._id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:15}}>🗑️</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ STATS ══ */}
      <div className="card" style={{marginTop:20}}>
        <div className="card-title">📊 Feature Usage (Last 30 Days)</div>
        <div className="feature-stats-grid">
          {FEATURES.map(f => (
            <div key={f.key} className="feat-stat">
              <div className="fs-icon">{f.icon}</div>
              <div className="fs-name">{f.name}</div>
              <div className="fs-count" style={{color:f.color}}>{totals[f.key] || 0}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}