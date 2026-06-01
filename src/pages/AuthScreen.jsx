import { useState } from 'react'
import { useApp } from '../context/AppContext'

const API = '/api'

function FloatingShapes() {
  const shapes = [
    { top:'8%',  left:'5%',  size:60,  color:'var(--accent)',  opacity:0.12, delay:0,   dur:6  },
    { top:'70%', left:'3%',  size:40,  color:'var(--accent3)', opacity:0.1,  delay:1,   dur:8  },
    { top:'20%', right:'4%', size:80,  color:'var(--accent2)', opacity:0.1,  delay:0.5, dur:7  },
    { top:'60%', right:'6%', size:50,  color:'var(--accent)',  opacity:0.12, delay:2,   dur:9  },
    { top:'45%', left:'8%',  size:30,  color:'var(--accent3)', opacity:0.08, delay:1.5, dur:5  },
    { top:'85%', right:'10%',size:45,  color:'var(--accent2)', opacity:0.1,  delay:0.8, dur:7  },
  ]
  return (
    <div style={{position:'fixed',inset:0,pointerEvents:'none',overflow:'hidden',zIndex:0}}>
      {shapes.map((s,i)=>(
        <div key={i} style={{
          position:'absolute', top:s.top, left:s.left, right:s.right,
          width:s.size, height:s.size, borderRadius:'40% 60% 60% 40% / 50% 50% 60% 40%',
          background:s.color, opacity:s.opacity,
          animation:`emojiFloat ${s.dur}s ease-in-out infinite`,
          animationDelay:`${s.delay}s`,
        }}/>
      ))}
      {[{top:'15%',left:'20%'},{top:'30%',right:'15%'},{top:'75%',left:'25%'},{top:'50%',right:'20%'},{top:'90%',left:'50%'}].map((p,i)=>(
        <div key={`star-${i}`} style={{
          position:'absolute',...p,fontSize:16,opacity:0.2,
          animation:`starTwinkle ${2+i*0.5}s ease-in-out infinite`,
          animationDelay:`${i*0.4}s`
        }}>✦</div>
      ))}
    </div>
  )
}

function AuthLogo() {
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:28,justifyContent:'center'}}>
      <div style={{width:48,height:48,borderRadius:16,background:'var(--grad)',
        display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:'0 8px 24px var(--glow)',animation:'logoBounce 2s ease-in-out infinite'}}>
        <svg viewBox="0 0 32 32" fill="none" style={{width:30,height:30}}>
          <path d="M6 22 L6 8 Q6 6 8 6 L24 6 Q26 6 26 8 L26 18 Q26 20 24 20 L10 20 L6 24 Z" fill="white" opacity="0.95"/>
          <line x1="10" y1="11" x2="22" y2="11" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
          <line x1="10" y1="15" x2="19" y2="15" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="26" cy="7" r="5" fill="var(--accent3)"/>
          <text x="26" y="9.5" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">AI</text>
        </svg>
      </div>
      <div>
        <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:22,fontWeight:800,
          background:'var(--grad)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
          backgroundClip:'text',lineHeight:1}}>StudyBuddy</div>
        <div style={{fontSize:11,color:'var(--muted)',marginTop:2,letterSpacing:1}}>AI-POWERED LEARNING</div>
      </div>
    </div>
  )
}

function FeaturePills() {
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center',marginBottom:20}}>
      {['🤖 AI Quiz','📝 Smart Notes','⏱️ Focus Timer','💬 Study Rooms','📅 Planner'].map(f=>(
        <span key={f} style={{padding:'4px 12px',borderRadius:99,fontSize:11,fontWeight:600,
          background:'var(--glow)',border:'1px solid var(--border)',color:'var(--accent)'}}>
          {f}
        </span>
      ))}
    </div>
  )
}

export default function AuthScreen() {
  const [screen, setScreen] = useState('login')
  const { login } = useApp()

  const [loginEmail, setLoginEmail]       = useState('')
  const [loginPass, setLoginPass]         = useState('')
  const [loginMsg, setLoginMsg]           = useState({ text:'', type:'' })
  const [loginLoading, setLoginLoading]   = useState(false)
  const [showLoginPass, setShowLoginPass] = useState(false)

  const [sName, setSName]                   = useState('')
  const [sEmail, setSEmail]                 = useState('')
  const [sPass, setSPass]                   = useState('')
  const [signupMsg, setSignupMsg]           = useState({ text:'', type:'' })
  const [signupLoading, setSignupLoading]   = useState(false)
  const [showSignupPass, setShowSignupPass] = useState(false)

  async function doLogin() {
    if (!loginEmail || !loginPass) return setLoginMsg({ text:'Enter email and password.', type:'error' })
    setLoginLoading(true); setLoginMsg({ text:'Signing in...', type:'' })
    try {
      const res  = await fetch(`${API}/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email:loginEmail, password:loginPass }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Login failed')
      login(data.token, data.user)
    } catch(e) { setLoginMsg({ text:e.message, type:'error' }) }
    finally { setLoginLoading(false) }
  }

  async function doSignup() {
    if (!sName || !sEmail || !sPass) return setSignupMsg({ text:'Fill in all fields.', type:'error' })
    if (sPass.length < 6) return setSignupMsg({ text:'Password needs 6+ characters.', type:'error' })
    setSignupLoading(true); setSignupMsg({ text:'Creating account...', type:'' })
    try {
      const res  = await fetch(`${API}/signup`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name:sName, email:sEmail, password:sPass }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error)
      login(data.token, data.user)
    } catch(e) { setSignupMsg({ text:e.message, type:'error' }) }
    finally { setSignupLoading(false) }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
      background:'var(--bg)',position:'relative',padding:20}}>
      <FloatingShapes/>
      <div style={{width:'100%',maxWidth:440,position:'relative',zIndex:1,animation:'fadeUp 0.5s cubic-bezier(.16,1,.3,1)'}}>
        <div style={{background:'var(--surface)',border:'1.5px solid var(--border)',borderRadius:28,
          padding:'36px 36px 32px',boxShadow:'0 20px 60px rgba(0,0,0,0.12)'}}>

          <AuthLogo/>

          {/* Tab switcher */}
          <div style={{display:'flex',background:'var(--surface2)',borderRadius:14,padding:4,
            marginBottom:28,border:'1px solid var(--border)'}}>
            {['login','signup'].map(s=>(
              <button key={s} onClick={()=>setScreen(s)} style={{
                flex:1,padding:'10px',borderRadius:10,border:'none',cursor:'pointer',
                fontFamily:"'Cabinet Grotesk',sans-serif",fontWeight:700,fontSize:14,
                transition:'all .25s cubic-bezier(.34,1.56,.64,1)',
                background:screen===s?'var(--grad)':'transparent',
                color:screen===s?'#fff':'var(--muted)',
                boxShadow:screen===s?'0 4px 12px var(--glow)':'none',
                transform:screen===s?'scale(1.02)':'scale(1)',
              }}>
                {s==='login'?'🔑 Sign In':'✨ Sign Up'}
              </button>
            ))}
          </div>

          {/* LOGIN */}
          {screen==='login' && (
            <div style={{animation:'fadeUp 0.3s ease'}}>
              <div style={{marginBottom:24,textAlign:'center'}}>
                <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:22,fontWeight:700,marginBottom:4}}>Welcome back! 👋</div>
                <div style={{color:'var(--muted)',fontSize:14}}>Log in and continue your streak 🔥</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:'var(--muted)',letterSpacing:0.5,display:'block',marginBottom:6}}>EMAIL</label>
                  <input className="input-base" type="email" placeholder="you@uni.edu"
                    value={loginEmail} onChange={e=>setLoginEmail(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&doLogin()} style={{fontSize:15}}/>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:'var(--muted)',letterSpacing:0.5,display:'block',marginBottom:6}}>PASSWORD</label>
                  <div style={{position:'relative'}}>
                    <input className="input-base" type={showLoginPass?'text':'password'} placeholder="••••••••"
                      value={loginPass} onChange={e=>setLoginPass(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&doLogin()} style={{fontSize:15,paddingRight:48}}/>
                    <button onClick={()=>setShowLoginPass(s=>!s)} style={{position:'absolute',right:14,top:'50%',
                      transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:16,padding:0}}>
                      {showLoginPass?'🙈':'👁️'}
                    </button>
                  </div>
                </div>
                {loginMsg.text && (
                  <div style={{padding:'10px 14px',borderRadius:12,fontSize:13,fontWeight:500,animation:'fadeUp 0.2s ease',
                    background:loginMsg.type==='error'?'rgba(239,68,68,0.1)':'rgba(106,247,160,0.1)',
                    border:`1px solid ${loginMsg.type==='error'?'rgba(239,68,68,0.3)':'rgba(106,247,160,0.3)'}`,
                    color:loginMsg.type==='error'?'#ef4444':'var(--success)'}}>
                    {loginMsg.type==='error'?'⚠️':'✅'} {loginMsg.text}
                  </div>
                )}
                <button onClick={doLogin} disabled={loginLoading} style={{padding:'14px',borderRadius:14,border:'none',
                  cursor:loginLoading?'not-allowed':'pointer',background:'var(--grad)',color:'#fff',fontSize:16,fontWeight:700,
                  fontFamily:"'Cabinet Grotesk',sans-serif",boxShadow:'0 6px 20px var(--glow)',
                  transition:'all .2s',opacity:loginLoading?0.7:1}}>
                  {loginLoading?'✨ Signing in...':'Sign In →'}
                </button>
              </div>
              <div style={{textAlign:'center',marginTop:20,fontSize:14,color:'var(--muted)'}}>
                No account?{' '}
                <span onClick={()=>setScreen('signup')} style={{color:'var(--accent)',fontWeight:700,cursor:'pointer',textDecoration:'underline',textUnderlineOffset:3}}>
                  Create one free ✨
                </span>
              </div>
            </div>
          )}

          {/* SIGNUP */}
          {screen==='signup' && (
            <div style={{animation:'fadeUp 0.3s ease'}}>
              <div style={{marginBottom:16,textAlign:'center'}}>
                <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:22,fontWeight:700,marginBottom:4}}>Join StudyBuddy! 🎓</div>
                <div style={{color:'var(--muted)',fontSize:14}}>Start your AI-powered study journey</div>
              </div>
              <FeaturePills/>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:'var(--muted)',letterSpacing:0.5,display:'block',marginBottom:6}}>YOUR NAME</label>
                  <input className="input-base" type="text" placeholder="Your Name"
                    value={sName} onChange={e=>setSName(e.target.value)} style={{fontSize:15}}/>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:'var(--muted)',letterSpacing:0.5,display:'block',marginBottom:6}}>EMAIL</label>
                  <input className="input-base" type="email" placeholder="you@uni.edu"
                    value={sEmail} onChange={e=>setSEmail(e.target.value)} style={{fontSize:15}}/>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:'var(--muted)',letterSpacing:0.5,display:'block',marginBottom:6}}>PASSWORD</label>
                  <div style={{position:'relative'}}>
                    <input className="input-base" type={showSignupPass?'text':'password'} placeholder="Min 6 characters"
                      value={sPass} onChange={e=>setSPass(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&doSignup()} style={{fontSize:15,paddingRight:48}}/>
                    <button onClick={()=>setShowSignupPass(s=>!s)} style={{position:'absolute',right:14,top:'50%',
                      transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:16,padding:0}}>
                      {showSignupPass?'🙈':'👁️'}
                    </button>
                  </div>
                  {sPass.length>0 && (
                    <div style={{marginTop:6,display:'flex',gap:3,alignItems:'center'}}>
                      {[1,2,3,4].map(i=>(
                        <div key={i} style={{flex:1,height:3,borderRadius:99,transition:'background .3s',
                          background:sPass.length>=i*2?i<=1?'#ef4444':i<=2?'#f97316':i<=3?'#facc15':'var(--success)':'var(--border)'}}/>
                      ))}
                      <span style={{fontSize:10,color:'var(--muted)',marginLeft:6,whiteSpace:'nowrap'}}>
                        {sPass.length<4?'Weak':sPass.length<6?'Fair':sPass.length<8?'Good':'Strong'}
                      </span>
                    </div>
                  )}
                </div>
                {signupMsg.text && (
                  <div style={{padding:'10px 14px',borderRadius:12,fontSize:13,fontWeight:500,animation:'fadeUp 0.2s ease',
                    background:signupMsg.type==='error'?'rgba(239,68,68,0.1)':'rgba(106,247,160,0.1)',
                    border:`1px solid ${signupMsg.type==='error'?'rgba(239,68,68,0.3)':'rgba(106,247,160,0.3)'}`,
                    color:signupMsg.type==='error'?'#ef4444':'var(--success)'}}>
                    {signupMsg.type==='error'?'⚠️':'✅'} {signupMsg.text}
                  </div>
                )}
                <button onClick={doSignup} disabled={signupLoading} style={{padding:'14px',borderRadius:14,border:'none',
                  cursor:signupLoading?'not-allowed':'pointer',background:'var(--grad)',color:'#fff',fontSize:16,fontWeight:700,
                  fontFamily:"'Cabinet Grotesk',sans-serif",boxShadow:'0 6px 20px var(--glow)',transition:'all .2s',opacity:signupLoading?0.7:1}}>
                  {signupLoading?'✨ Creating...':'Create Account →'}
                </button>
              </div>
              <div style={{textAlign:'center',marginTop:18,fontSize:14,color:'var(--muted)'}}>
                Already a member?{' '}
                <span onClick={()=>setScreen('login')} style={{color:'var(--accent)',fontWeight:700,cursor:'pointer',textDecoration:'underline',textUnderlineOffset:3}}>
                  Sign in 🔑
                </span>
              </div>
            </div>
          )}
        </div>
        <div style={{textAlign:'center',marginTop:16,fontSize:12,color:'var(--muted)'}}>Made with ❤️ for students · Free forever</div>
      </div>
    </div>
  )
}