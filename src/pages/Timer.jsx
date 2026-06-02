import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'

const MODES = { pomodoro: 1500, short: 300, long: 900 }
const MODE_LABELS = { pomodoro: 'FOCUS', short: 'SHORT BREAK', long: 'LONG BREAK' }
const CIRCUMFERENCE = 2 * Math.PI * 108
const CONFETTI_COLORS = ['#f76af7','#7c6af7','#6af7c8','#f7a26a','#ff6b6b','#ffd700','#00d4ff','#ff9ff3','#54a0ff']

function Confetti() {
  const pieces = Array.from({ length: 70 }, (_, i) => ({
    id: i, left: Math.random() * 100,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    duration: 2.2 + Math.random() * 2.5, delay: Math.random() * 1.8,
    size: 6 + Math.random() * 10,
    shape: Math.random() > 0.4 ? '50%' : Math.random() > 0.5 ? '3px' : '0%',
  }))
  return (
    <div className="confetti-wrap">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left:`${p.left}%`, background:p.color, width:p.size, height:p.size,
          borderRadius:p.shape, animationDuration:`${p.duration}s`, animationDelay:`${p.delay}s`,
        }}/>
      ))}
    </div>
  )
}

function Stars() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i, top: Math.random()*100, left: Math.random()*100,
    size: 1 + Math.random()*3, duration: 1.5 + Math.random()*3, delay: Math.random()*3,
  }))
  return (
    <div className="tc-stars">
      {stars.map(s => (
        <div key={s.id} className="tc-star" style={{
          top:`${s.top}%`, left:`${s.left}%`, width:s.size, height:s.size,
          animationDuration:`${s.duration}s`, animationDelay:`${s.delay}s`,
        }}/>
      ))}
    </div>
  )
}

function Bubbles() {
  const bubbles = Array.from({ length: 12 }, (_, i) => ({
    id: i, left: 5 + Math.random()*90, size: 20 + Math.random()*60,
    duration: 6 + Math.random()*8, delay: Math.random()*5,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }))
  return (
    <div className="tc-bubbles">
      {bubbles.map(b => (
        <div key={b.id} className="tc-bubble" style={{
          left:`${b.left}%`, width:b.size, height:b.size, background:b.color,
          animationDuration:`${b.duration}s`, animationDelay:`${b.delay}s`,
        }}/>
      ))}
    </div>
  )
}

function Fireworks() {
  const bursts = [
    { top:'15%', left:'15%', color:'#ffd700', delay:0.2 },
    { top:'20%', left:'80%', color:'#f76af7', delay:0.5 },
    { top:'70%', left:'10%', color:'#6af7c8', delay:0.8 },
    { top:'65%', left:'85%', color:'#7c6af7', delay:0.3 },
    { top:'10%', left:'50%', color:'#ff6b6b', delay:0.6 },
  ]
  return (
    <div className="tc-fireworks">
      {bursts.map((b, bi) => (
        <div key={bi} style={{position:'absolute', top:b.top, left:b.left}}>
          {Array.from({length:12}, (_,i) => (
            <div key={i} className="fw-particle" style={{
              background:b.color, '--angle':`${i*30}deg`,
              transform:`rotate(${i*30}deg)`,
              animationDelay:`${b.delay}s`, animationDuration:'1.2s',
              left:'50%', top:'50%', marginLeft:'-2px',
            }}/>
          ))}
          <div className="fw-burst" style={{
            width:60, height:60, marginLeft:-30, marginTop:-30,
            background:b.color+'33', border:`2px solid ${b.color}`,
            animationDuration:'1s', animationDelay:`${b.delay}s`,
          }}/>
        </div>
      ))}
    </div>
  )
}

function CompletionScreen({ info, onDone }) {
  const [count, setCount] = useState(5)
  useEffect(() => {
    const t = setInterval(() => {
      setCount(c => {
        if (c <= 1) { clearInterval(t); onDone(); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <>
      <Confetti/>
      <div className="timer-complete-overlay" onClick={onDone}>
        <Stars/>
        <Bubbles/>
        <Fireworks/>
        <div className="tc-card" onClick={e => e.stopPropagation()}>
          <div className="tc-characters">
            <span className="tc-char">{info.leftChar}</span>
            <span className="tc-char">{info.mainChar}</span>
            <span className="tc-char">{info.rightChar}</span>
          </div>
          <div className="tc-title">{info.title}</div>
          <div className="tc-sub">{info.sub}</div>
          <div style={{fontSize:22,marginBottom:20,letterSpacing:4,animation:'emojiWiggle 0.5s ease-in-out infinite alternate'}}>
            {info.extraEmojis}
          </div>
          <div className="tc-countdown-bar">
            <div className="tc-countdown-fill"/>
          </div>
          <div className="tc-dismiss">
            Auto-closing in <strong style={{color:'rgba(255,255,255,0.6)'}}>{count}s</strong> · tap to dismiss
          </div>
        </div>
      </div>
    </>
  )
}

export default function Timer() {
  const { toast, incSession, apiFetch, sessionsToday } = useApp()
  const [mode, setMode]             = useState('pomodoro')
  const [seconds, setSeconds]       = useState(1500)
  const [total, setTotal]           = useState(1500)
  const [running, setRunning]       = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customMin, setCustomMin]   = useState(25)
  const [customSec, setCustomSec]   = useState(0)
  const [showDone, setShowDone]     = useState(false)
  const [doneInfo, setDoneInfo]     = useState({})
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) { clearInterval(intervalRef.current); setRunning(false); handleEnd(mode); return 0 }
          return s - 1
        })
      }, 1000)
    } else { clearInterval(intervalRef.current) }
    return () => clearInterval(intervalRef.current)
  }, [running])

  function handleEnd(m) {
    const n = (sessionsToday || 0) + 1
    if (m === 'pomodoro' || m === 'custom') {
      incSession()
      try { apiFetch('/usage/timer', 'POST', {}) } catch {}
      setDoneInfo({ mainChar:'🏆', leftChar:'⭐', rightChar:'🌟',
        title:'You Crushed It!',
        sub:`${n} session${n>1?'s':''} done today — you're on fire!`,
        extraEmojis:'🎊 🎉 🥳 🎊' })
    } else if (m === 'short') {
      setDoneInfo({ mainChar:'☕', leftChar:'🌸', rightChar:'✨',
        title:"Break's Over!",
        sub:"Feeling refreshed? Time to get back in the zone!",
        extraEmojis:'💪 🚀 ⚡ 💪' })
    } else {
      setDoneInfo({ mainChar:'🌙', leftChar:'😴', rightChar:'💤',
        title:'Long Break Done!',
        sub:"You rested well. Now let's go make it count!",
        extraEmojis:'🔥 💫 🎯 🔥' })
    }
    setShowDone(true)
  }

  function switchMode(m) {
    clearInterval(intervalRef.current); setRunning(false); setMode(m); setShowCustom(false)
    setSeconds(MODES[m]); setTotal(MODES[m])
  }

  function applyCustom() {
    const mins = Math.max(0, Math.min(99, parseInt(customMin)||0))
    const secs = Math.max(0, Math.min(59, parseInt(customSec)||0))
    const t = mins*60+secs
    if (t<=0) return toast('Time set karo!','error')
    clearInterval(intervalRef.current); setRunning(false); setMode('custom')
    setSeconds(t); setTotal(t); setShowCustom(false)
    toast(`Custom timer: ${mins}m ${secs}s ✅`)
  }

  function toggle() { setRunning(r=>!r) }
  function reset() {
    clearInterval(intervalRef.current); setRunning(false)
    const t = mode==='custom' ? total : MODES[mode]
    setSeconds(t); setTotal(t)
  }

  const mm=Math.floor(seconds/60), ss=seconds%60
  const display=`${mm}:${ss<10?'0':''}${ss}`
  const offset=CIRCUMFERENCE*(1-seconds/total)
  const dots=sessionsToday%4
  const pct=Math.round((1-seconds/total)*100)

  return (
    <div>
      <div className="page-header">
        <div className="page-title">⏱️ Focus Timer</div>
        <div className="page-sub">Pomodoro technique for laser-sharp focus.</div>
      </div>
      <div className="timer-container">
        <div className="timer-mode-tabs">
          {['pomodoro','short','long'].map(m2=>(
            <div key={m2} className={`mode-tab ${mode===m2?'active':''}`} onClick={()=>switchMode(m2)}>
              {m2==='pomodoro'?'🍅 Pomodoro':m2==='short'?'☕ Short Break':'🌙 Long Break'}
            </div>
          ))}
          <div className={`mode-tab ${mode==='custom'?'active':''}`} onClick={()=>setShowCustom(s=>!s)}>✏️ Custom</div>
        </div>

        {showCustom && (
          <div className="custom-timer-panel">
            <div style={{fontWeight:700,fontSize:14,color:'var(--muted)',textAlign:'center',marginBottom:4}}>Set Custom Time</div>
            <div className="custom-time-inputs">
              <div className="time-input-box">
                <input type="number" min="0" max="99" value={customMin} onChange={e=>setCustomMin(e.target.value)}/>
                <label>MIN</label>
              </div>
              <div className="time-colon">:</div>
              <div className="time-input-box">
                <input type="number" min="0" max="59" value={customSec} onChange={e=>setCustomSec(e.target.value)}/>
                <label>SEC</label>
              </div>
            </div>
            <div style={{marginTop:14,display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
              {[{l:'10m',m:10,s:0},{l:'15m',m:15,s:0},{l:'20m',m:20,s:0},{l:'45m',m:45,s:0},{l:'90m',m:90,s:0}].map(p=>(
                <button key={p.l} onClick={()=>{setCustomMin(p.m);setCustomSec(p.s)}}
                  style={{padding:'5px 14px',borderRadius:99,fontSize:12,fontWeight:700,cursor:'pointer',
                    background:'var(--surface)',border:'1.5px solid var(--border)',color:'var(--accent)',transition:'all .2s'}}>
                  {p.l}
                </button>
              ))}
            </div>
            <div style={{textAlign:'center',marginTop:16,display:'flex',gap:10,justifyContent:'center'}}>
              <button className="btn-sm btn-outline" onClick={()=>setShowCustom(false)} style={{padding:'8px 20px'}}>Cancel</button>
              <button className="btn-sm btn-accent" onClick={applyCustom} style={{padding:'8px 24px'}}>Set Timer ✅</button>
            </div>
          </div>
        )}

        <div className="timer-ring-wrap">
          <svg className="timer-svg" viewBox="0 0 240 240">
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent)"/>
                <stop offset="100%" stopColor="var(--accent3)"/>
              </linearGradient>
            </defs>
            <circle className="timer-ring-bg" cx="120" cy="120" r="108"/>
            <circle className="timer-ring-fg" cx="120" cy="120" r="108"
              strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}/>
          </svg>
          <div className="timer-inner">
            <div className="timer-display">{display}</div>
            <div className="timer-mode-label">{mode==='custom'?'✏️ CUSTOM':MODE_LABELS[mode]}</div>
            {running && <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>{pct}% done</div>}
          </div>
        </div>

        <div className="timer-controls">
          <button className="timer-btn start" onClick={toggle}>
            {running?'⏸ Pause':seconds===total?'▶ Start':'▶ Resume'}
          </button>
          <button className="timer-btn reset" onClick={reset}>↺ Reset</button>
        </div>

        <div className="sessions-row">
          <div>
            <div style={{fontWeight:700,fontSize:14}}>Sessions today</div>
            <div style={{color:'var(--muted)',fontSize:12}}>4 = long break cycle</div>
          </div>
          <div className="session-dots">
            {[0,1,2,3].map(i=>(
              <div key={i} className={`session-dot ${i<dots?'done':''}`}/>
            ))}
          </div>
        </div>
      </div>

      {showDone && <CompletionScreen info={doneInfo} onDone={()=>setShowDone(false)}/>}
    </div>
  )
}