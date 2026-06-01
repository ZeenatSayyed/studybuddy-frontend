import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { io } from 'socket.io-client'

const PUBLIC_ROOMS = [
  { id: 'general',   label: '📚 General' },
  { id: 'math',      label: '🔢 Math' },
  { id: 'science',   label: '🔬 Science' },
  { id: 'exam-prep', label: '📋 Exam Prep' },
]

function timeStr(d) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {})
}

function AIMessage({ msg }) {
  return (
    <div style={{display:'flex',gap:10,alignItems:'flex-start',animation:'fadeUp 0.3s ease'}}>
      <div style={{width:36,height:36,borderRadius:99,flexShrink:0,
        background:'linear-gradient(135deg,#7c6af7,#f76af7)',
        display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:18,boxShadow:'0 0 12px rgba(124,106,247,0.4)'}}>🤖</div>
      <div style={{flex:1,maxWidth:'80%'}}>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
          <span style={{fontSize:13,fontWeight:700,color:'var(--accent)'}}>StudyBuddy AI</span>
          <span style={{fontSize:10,fontWeight:800,padding:'1px 7px',borderRadius:99,
            background:'linear-gradient(135deg,#7c6af7,#f76af7)',color:'#fff',letterSpacing:0.5}}>AI BOT</span>
        </div>
        <div style={{background:'linear-gradient(135deg,rgba(124,106,247,0.12),rgba(247,106,247,0.08))',
          border:'1.5px solid rgba(124,106,247,0.25)',borderRadius:'4px 18px 18px 18px',
          padding:'12px 16px',fontSize:14,lineHeight:1.7,color:'var(--fg)',whiteSpace:'pre-wrap'}}>
          {msg.text}
        </div>
        <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>{timeStr(msg.createdAt||new Date())}</div>
      </div>
    </div>
  )
}

function AIThinking() {
  return (
    <div style={{display:'flex',gap:10,alignItems:'center',animation:'fadeUp 0.2s ease'}}>
      <div style={{width:36,height:36,borderRadius:99,flexShrink:0,
        background:'linear-gradient(135deg,#7c6af7,#f76af7)',
        display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🤖</div>
      <div style={{background:'rgba(124,106,247,0.1)',border:'1.5px solid rgba(124,106,247,0.2)',
        borderRadius:'4px 18px 18px 18px',padding:'10px 18px',display:'flex',gap:5,alignItems:'center'}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{width:7,height:7,borderRadius:99,background:'var(--accent)',
            animation:'bounce 1s ease-in-out infinite',animationDelay:`${i*0.2}s`}}/>
        ))}
        <span style={{fontSize:12,color:'var(--muted)',marginLeft:6}}>AI is thinking...</span>
      </div>
    </div>
  )
}

export default function Classroom({ onChatMsg }) {
  const { user, apiFetch, toast } = useApp()

  const [view, setView]             = useState('rooms')
  const [activeRoom, setActiveRoom] = useState(null)
  const [messages, setMessages]     = useState([])
  const [online, setOnline]         = useState([])
  const [input, setInput]           = useState('')
  const [typing, setTyping]         = useState('')
  const [aiThinking, setAiThinking] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal]     = useState(false)
  const [newRoomName, setNewRoomName]         = useState('')
  const [joinCode, setJoinCode]               = useState('')
  const [myPrivateRooms, setMyPrivateRooms]   = useState([])
  const [createdCode, setCreatedCode]         = useState(null)

  const [dmUser, setDmUser]         = useState(null)
  const [dmMessages, setDmMessages] = useState([])
  const [dmInput, setDmInput]       = useState('')
  const [dmChats, setDmChats]       = useState([])

  const socketRef = useRef(null)
  const typingRef = useRef(null)
  const boxRef    = useRef(null)
  const dmBoxRef  = useRef(null)

  useEffect(() => {
    const s = io('http://localhost:5000', { transports: ['websocket', 'polling'] })
    socketRef.current = s

    s.on('connect', () => {
      if (activeRoom) s.emit('join-room', { room: activeRoom.id, username: user?.name })
    })
    s.on('new-message', msg => {
      setMessages(m => [...m, { ...msg, type: msg.isAI ? 'ai' : 'msg' }])
      if (onChatMsg) onChatMsg()
    })
    s.on('user-joined', ({ username }) => setMessages(m => [...m, { type:'sys', text:`${username} joined 👋` }]))
    s.on('user-left',   ({ username }) => setMessages(m => [...m, { type:'sys', text:`${username} left` }]))
    s.on('online-users', users => setOnline(users))
    s.on('user-typing',  name  => setTyping(`${name} is typing...`))
    s.on('stop-typing',  ()    => setTyping(''))
    s.on('dm-received', msg => {
      setDmMessages(m => [...m, { ...msg, type:'dm' }])
      const other = msg.self ? msg.to : msg.from
      if (other) setDmChats(p => p.includes(other) ? p : [other, ...p])
    })
    s.on('ai-response', msg => {
      setMessages(m => [...m, { ...msg, type:'ai' }])
      setAiThinking(false)
    })

    return () => s.disconnect()
  }, [])

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight
  }, [messages, aiThinking])

  useEffect(() => {
    if (dmBoxRef.current) dmBoxRef.current.scrollTop = dmBoxRef.current.scrollHeight
  }, [dmMessages])

  async function joinRoom(roomId, label, isPrivate = false, code = null) {
    setMessages([])
    const roomObj = { id: roomId, label, isPrivate, code }
    setActiveRoom(roomObj); setView('chat')
    socketRef.current?.emit('join-room', { room: roomId, username: user?.name })
    try {
      const res  = await apiFetch(`/chat/${roomId}`)
      const data = await res.json()
      setMessages(data.map(m => ({ ...m, type: m.isAI ? 'ai' : 'msg' })))
    } catch {}
  }

  async function createPrivateRoom() {
    if (!newRoomName.trim()) return toast('Room naam do!', 'error')
    try {
      const res  = await apiFetch('/rooms/create', 'POST', { name: newRoomName.trim() })
      const data = await res.json()
      setCreatedCode(data.code); setMyPrivateRooms(p => [...p, data]); setNewRoomName('')
      toast('Room created! 🎉')
    } catch { toast('Failed to create room', 'error') }
  }

  async function joinPrivateRoom() {
    if (!joinCode.trim()) return toast('Invite code daalo!', 'error')
    try {
      const res  = await apiFetch('/rooms/join', 'POST', { code: joinCode.trim() })
      const data = await res.json()
      if (data.error) return toast(data.error, 'error')
      setMyPrivateRooms(p => p.find(r => r.code===data.code) ? p : [...p, data])
      setShowJoinModal(false); setJoinCode('')
      toast(`Joined "${data.name}"! ✅`)
      joinRoom(`private_${data.code}`, `🔒 ${data.name}`, true, data.code)
    } catch { toast('Invalid code!', 'error') }
  }

  async function sendMsg() {
    const text = input.trim()
    if (!text || !socketRef.current || !activeRoom) return
    setInput('')

    if (text.toLowerCase().startsWith('@ai ')) {
      const question = text.slice(4).trim()
      if (!question) return toast('Question likho @ai ke baad!', 'error')
      socketRef.current.emit('send-message', { room: activeRoom.id, username: user?.name, text })
      socketRef.current.emit('stop-typing', { room: activeRoom.id })
      setAiThinking(true)
      try {
        const res  = await apiFetch('/room-ai', 'POST', { question, room: activeRoom.id })
        const data = await res.json()
        socketRef.current.emit('broadcast-ai', {
          room: activeRoom.id, text: data.answer,
          createdAt: data.createdAt, msgId: data.msgId
        })
        setAiThinking(false)
      } catch { setAiThinking(false); toast('AI response failed!', 'error') }
      return
    }

    socketRef.current.emit('send-message', { room: activeRoom.id, username: user?.name, text })
    socketRef.current.emit('stop-typing', { room: activeRoom.id })
  }

  function emitTyping() {
    if (!socketRef.current || !activeRoom) return
    socketRef.current.emit('typing', { room: activeRoom.id, username: user?.name })
    clearTimeout(typingRef.current)
    typingRef.current = setTimeout(() => socketRef.current?.emit('stop-typing', { room: activeRoom.id }), 1500)
  }

  async function openDM(username) {
    setDmUser(username); setDmMessages([]); setView('dm')
    setDmChats(p => p.includes(username) ? p : [username, ...p])
    try {
      const res  = await apiFetch(`/dm/${username}`)
      const data = await res.json()
      setDmMessages(data.map(m => ({ ...m, type:'dm', self: m.username===user?.name })))
    } catch {}
  }

  function sendDM() {
    const text = dmInput.trim()
    if (!text || !socketRef.current || !dmUser) return
    socketRef.current.emit('direct-message', { toUsername: dmUser, fromUsername: user?.name, text })
    setDmInput('')
  }

  function leaveRoom() {
    if (socketRef.current && activeRoom)
      socketRef.current.emit('leave-room', { room: activeRoom.id, username: user?.name })
    setActiveRoom(null); setMessages([]); setOnline([]); setView('rooms')
  }

  function askAI() {
    setInput('@ai ')
    document.querySelector('.classroom-input input')?.focus()
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">💬 Study Classroom</div>
        <div className="page-sub">Chat rooms, private rooms, DMs & AI Study Bot</div>
      </div>

      <div className="classroom-layout">

        {/* SIDEBAR */}
        <div className="classroom-sidebar" style={{display:'flex',flexDirection:'column',gap:0,padding:0,overflow:'hidden'}}>

          {(view==='chat'||view==='dm') && (
            <button onClick={()=>setView('rooms')} style={{margin:'12px 12px 0',padding:'8px 14px',
              borderRadius:10,cursor:'pointer',background:'var(--surface)',border:'1.5px solid var(--border)',
              fontSize:13,color:'var(--muted)',textAlign:'left',fontWeight:600}}>← Back</button>
          )}

          <div style={{padding:'14px 12px 8px',fontSize:11,fontWeight:800,color:'var(--muted)',letterSpacing:1}}>PUBLIC ROOMS</div>
          {PUBLIC_ROOMS.map(r => (
            <div key={r.id} onClick={()=>joinRoom(r.id,r.label)} style={{
              padding:'10px 16px',cursor:'pointer',fontSize:14,fontWeight:500,
              background:view==='chat'&&activeRoom?.id===r.id?'var(--glow)':'transparent',
              color:view==='chat'&&activeRoom?.id===r.id?'var(--accent)':'var(--fg)',
              borderLeft:view==='chat'&&activeRoom?.id===r.id?'3px solid var(--accent)':'3px solid transparent',
              transition:'all 0.15s'}}>{r.label}</div>
          ))}

          <div style={{padding:'14px 12px 4px',fontSize:11,fontWeight:800,color:'var(--muted)',letterSpacing:1,marginTop:8}}>PRIVATE ROOMS</div>
          <div style={{display:'flex',gap:6,padding:'0 12px 8px'}}>
            <button onClick={()=>{setShowCreateModal(true);setCreatedCode(null)}} style={{flex:1,padding:'6px',
              borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:600,
              background:'var(--surface2)',border:'1.5px solid var(--border)',color:'var(--accent)'}}>+ Create</button>
            <button onClick={()=>setShowJoinModal(true)} style={{flex:1,padding:'6px',borderRadius:8,cursor:'pointer',
              fontSize:12,fontWeight:600,background:'var(--surface2)',border:'1.5px solid var(--border)',color:'var(--fg)'}}>Join</button>
          </div>
          {myPrivateRooms.map(r => (
            <div key={r.code} onClick={()=>joinRoom(`private_${r.code}`,`🔒 ${r.name}`,true,r.code)} style={{
              padding:'10px 16px',cursor:'pointer',fontSize:14,fontWeight:500,
              background:view==='chat'&&activeRoom?.code===r.code?'var(--glow)':'transparent',
              color:view==='chat'&&activeRoom?.code===r.code?'var(--accent)':'var(--fg)',
              borderLeft:view==='chat'&&activeRoom?.code===r.code?'3px solid var(--accent)':'3px solid transparent',
              transition:'all 0.15s',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>🔒 {r.name}</span>
              <span style={{fontSize:10,color:'var(--muted)',fontFamily:'monospace'}}>{r.code}</span>
            </div>
          ))}

          <div style={{padding:'14px 12px 4px',fontSize:11,fontWeight:800,color:'var(--muted)',letterSpacing:1,marginTop:8}}>DIRECT MESSAGES</div>
          {dmChats.length===0
            ? <div style={{padding:'4px 16px',fontSize:12,color:'var(--muted)'}}>Click a user to DM</div>
            : dmChats.map(u=>(
              <div key={u} onClick={()=>openDM(u)} style={{
                padding:'10px 16px',cursor:'pointer',fontSize:14,
                background:view==='dm'&&dmUser===u?'var(--glow)':'transparent',
                color:view==='dm'&&dmUser===u?'var(--accent)':'var(--fg)',
                borderLeft:view==='dm'&&dmUser===u?'3px solid var(--accent)':'3px solid transparent',
                display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:28,height:28,borderRadius:99,background:'var(--grad)',display:'flex',
                  alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff',flexShrink:0}}>
                  {u[0].toUpperCase()}
                </div>
                {u}
              </div>
            ))
          }

          <div style={{marginTop:'auto',borderTop:'1px solid var(--border)',padding:'12px'}}>
            <div style={{fontSize:11,fontWeight:800,color:'var(--muted)',letterSpacing:1,marginBottom:8}}>
              ONLINE NOW ({online.length})
            </div>
            {online.length===0
              ? <div style={{color:'var(--muted)',fontSize:12}}>No one online</div>
              : online.map((u,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 0',fontSize:13}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:7,height:7,borderRadius:99,background:'var(--success)',flexShrink:0}}/>
                    {u}
                  </div>
                  {u!==user?.name&&(
                    <button onClick={()=>openDM(u)} style={{background:'var(--glow)',border:'none',cursor:'pointer',
                      color:'var(--accent)',fontSize:11,fontWeight:700,padding:'2px 6px',borderRadius:6}}>DM</button>
                  )}
                </div>
              ))
            }
          </div>
        </div>

        {/* MAIN */}
        <div className="classroom-main" style={{display:'flex',flexDirection:'column'}}>

          {view==='rooms'&&(
            <div style={{padding:24,flex:1,overflowY:'auto'}}>
              <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:18,fontWeight:700,marginBottom:20}}>
                👋 Welcome, {user?.name}!
              </div>
              <div style={{background:'linear-gradient(135deg,rgba(124,106,247,0.15),rgba(247,106,247,0.1))',
                border:'1.5px solid rgba(124,106,247,0.3)',borderRadius:18,padding:'16px 20px',marginBottom:20,
                display:'flex',alignItems:'center',gap:14}}>
                <div style={{fontSize:36}}>🤖</div>
                <div>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:2}}>AI Study Bot available in all rooms!</div>
                  <div style={{fontSize:13,color:'var(--muted)'}}>
                    Type <code style={{background:'var(--surface)',padding:'1px 6px',borderRadius:5,color:'var(--accent)',fontWeight:700}}>@ai your question</code> in any room chat to ask the AI
                  </div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14,marginBottom:28}}>
                {PUBLIC_ROOMS.map(r=>(
                  <div key={r.id} onClick={()=>joinRoom(r.id,r.label)} style={{background:'var(--surface2)',
                    border:'1.5px solid var(--border)',borderRadius:18,padding:'20px 18px',cursor:'pointer',transition:'all 0.2s'}}>
                    <div style={{fontSize:28,marginBottom:8}}>{r.label.split(' ')[0]}</div>
                    <div style={{fontWeight:700,fontSize:15}}>{r.label.split(' ').slice(1).join(' ')}</div>
                    <div style={{fontSize:12,color:'var(--muted)',marginTop:4}}>Public room</div>
                  </div>
                ))}
                <div onClick={()=>{setShowCreateModal(true);setCreatedCode(null)}} style={{background:'var(--glow)',
                  border:'1.5px dashed var(--accent)',borderRadius:18,padding:'20px 18px',cursor:'pointer',
                  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6}}>
                  <div style={{fontSize:28}}>🔒</div>
                  <div style={{fontWeight:700,fontSize:14,color:'var(--accent)'}}>Create Private Room</div>
                </div>
                <div onClick={()=>setShowJoinModal(true)} style={{background:'var(--surface2)',
                  border:'1.5px dashed var(--border)',borderRadius:18,padding:'20px 18px',cursor:'pointer',
                  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6}}>
                  <div style={{fontSize:28}}>🔑</div>
                  <div style={{fontWeight:700,fontSize:14,color:'var(--muted)'}}>Join with Invite Code</div>
                </div>
              </div>
              {myPrivateRooms.length>0&&(
                <>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:'var(--muted)'}}>Your Private Rooms</div>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {myPrivateRooms.map(r=>(
                      <div key={r.code} onClick={()=>joinRoom(`private_${r.code}`,`🔒 ${r.name}`,true,r.code)}
                        style={{background:'var(--surface2)',border:'1.5px solid var(--border)',borderRadius:14,
                          padding:'14px 18px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div>
                          <div style={{fontWeight:600,fontSize:14}}>🔒 {r.name}</div>
                          <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>Private room</div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{fontFamily:'monospace',fontSize:15,fontWeight:700,letterSpacing:3,
                            color:'var(--accent)',background:'var(--glow)',padding:'4px 12px',borderRadius:8}}>{r.code}</div>
                          <button onClick={e=>{e.stopPropagation();copyToClipboard(r.code);toast('Code copied! 📋')}}
                            style={{background:'var(--surface)',border:'1.5px solid var(--border)',
                              borderRadius:8,padding:'4px 10px',cursor:'pointer',fontSize:12,color:'var(--muted)'}}>Copy</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {view==='chat'&&(
            <>
              <div className="classroom-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <h3 style={{margin:0}}>{activeRoom?.label}</h3>
                  <div style={{fontSize:12,color:'var(--muted)'}}>{online.length} online</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <button onClick={askAI} style={{background:'linear-gradient(135deg,rgba(124,106,247,0.15),rgba(247,106,247,0.1))',
                    border:'1.5px solid rgba(124,106,247,0.35)',borderRadius:8,padding:'6px 14px',cursor:'pointer',
                    fontSize:12,fontWeight:700,color:'var(--accent)',display:'flex',alignItems:'center',gap:5}}>
                    🤖 Ask AI
                  </button>
                  {activeRoom?.isPrivate&&(
                    <>
                      <div style={{fontFamily:'monospace',fontSize:14,fontWeight:700,letterSpacing:3,
                        color:'var(--accent)',background:'var(--glow)',padding:'4px 12px',borderRadius:8}}>
                        {activeRoom.code}
                      </div>
                      <button onClick={()=>{copyToClipboard(activeRoom.code);toast('Invite code copied! 📋')}}
                        style={{background:'var(--surface2)',border:'1.5px solid var(--border)',
                          borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:12,fontWeight:600,color:'var(--fg)'}}>
                        🔗 Share
                      </button>
                    </>
                  )}
                  <button onClick={leaveRoom} style={{background:'rgba(255,100,100,0.12)',
                    border:'1.5px solid rgba(255,100,100,0.3)',borderRadius:8,padding:'6px 14px',
                    cursor:'pointer',fontSize:12,fontWeight:700,color:'#ff6464'}}>🚪 Leave</button>
                </div>
              </div>

              <div className="classroom-messages" ref={boxRef}>
                {messages.length===0&&(
                  <div style={{textAlign:'center',color:'var(--muted)',padding:32,fontSize:14}}>
                    No messages yet. Say hello! 👋<br/>
                    <span style={{fontSize:12,marginTop:8,display:'block'}}>
                      Tip: Type <code style={{background:'var(--surface2)',padding:'1px 6px',borderRadius:4,color:'var(--accent)'}}>@ai your question</code> to ask AI 🤖
                    </span>
                  </div>
                )}
                {messages.map((msg,i)=>{
                  if (msg.type==='sys') return <div key={i} className="system-msg">{msg.text}</div>
                  if (msg.type==='ai'||msg.isAI) return <AIMessage key={i} msg={msg}/>
                  const mine=msg.username===user?.name
                  return (
                    <div key={i} className={`chat-msg ${mine?'mine':''}`}>
                      <div className="cm-avatar">{(msg.username||'?')[0].toUpperCase()}</div>
                      <div className="cm-body">
                        <div className="cm-name" style={{display:'flex',alignItems:'center',gap:8}}>
                          {msg.username}
                          {!mine&&(
                            <button onClick={()=>openDM(msg.username)} style={{background:'var(--glow)',border:'none',
                              cursor:'pointer',color:'var(--accent)',fontSize:11,fontWeight:700,padding:'1px 6px',borderRadius:4}}>DM</button>
                          )}
                        </div>
                        <div className="cm-text" style={{color:msg.text?.startsWith('@ai')?'var(--accent)':undefined}}>
                          {msg.text}
                        </div>
                        <div className="cm-time">{timeStr(msg.createdAt||new Date())}</div>
                      </div>
                    </div>
                  )
                })}
                {aiThinking&&<AIThinking/>}
              </div>

              <div className="typing-indicator">{typing}</div>
              <div className="classroom-input">
                <input className="input-base"
                  placeholder='Type a message... or "@ai question" to ask AI'
                  value={input} onChange={e=>{setInput(e.target.value);emitTyping()}}
                  onKeyDown={e=>e.key==='Enter'&&sendMsg()}
                  style={{borderColor:input.startsWith('@ai')?'var(--accent)':undefined,
                    boxShadow:input.startsWith('@ai')?'0 0 0 3px var(--glow)':undefined}}/>
                <button className="send-btn" onClick={sendMsg}>➤</button>
              </div>
            </>
          )}

          {view==='dm'&&(
            <>
              <div className="classroom-header" style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:38,height:38,borderRadius:99,background:'var(--grad)',display:'flex',
                  alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff',flexShrink:0}}>
                  {dmUser?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 style={{margin:0}}>{dmUser}</h3>
                  <div style={{fontSize:12,color:'var(--muted)'}}>Direct Message</div>
                </div>
              </div>
              <div className="classroom-messages" ref={dmBoxRef}>
                {dmMessages.length===0&&(
                  <div style={{textAlign:'center',color:'var(--muted)',padding:32,fontSize:14}}>
                    No messages yet. Start the conversation! 💬
                  </div>
                )}
                {dmMessages.map((msg,i)=>{
                  const mine=msg.self||msg.from===user?.name||msg.username===user?.name
                  return (
                    <div key={i} className={`chat-msg ${mine?'mine':''}`}>
                      <div className="cm-avatar">{((mine?user?.name:dmUser)||'?')[0].toUpperCase()}</div>
                      <div className="cm-body">
                        <div className="cm-name">{mine?'You':dmUser}</div>
                        <div className="cm-text">{msg.text}</div>
                        <div className="cm-time">{timeStr(msg.createdAt||new Date())}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="classroom-input">
                <input className="input-base" placeholder={`Message ${dmUser}...`}
                  value={dmInput} onChange={e=>setDmInput(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&sendDM()}/>
                <button className="send-btn" onClick={sendDM}>➤</button>
              </div>
            </>
          )}
        </div>
      </div>

      {showCreateModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',
          alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(4px)'}}>
          <div style={{background:'var(--surface)',border:'1.5px solid var(--border)',
            borderRadius:24,padding:32,width:380,animation:'fadeUp 0.25s ease'}}>
            {createdCode?(
              <>
                <div style={{textAlign:'center',marginBottom:20}}>
                  <div style={{fontSize:36,marginBottom:8}}>🎉</div>
                  <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:20,fontWeight:700}}>Room Created!</div>
                  <div style={{color:'var(--muted)',fontSize:13,marginTop:4}}>Share this invite code:</div>
                </div>
                <div style={{textAlign:'center',margin:'20px 0'}}>
                  <div style={{fontFamily:'monospace',fontSize:32,fontWeight:800,letterSpacing:8,
                    color:'var(--accent)',background:'var(--glow)',padding:'16px 24px',borderRadius:16,display:'inline-block'}}>
                    {createdCode}
                  </div>
                </div>
                <button onClick={()=>{copyToClipboard(createdCode);toast('Code copied! 📋')}}
                  style={{width:'100%',padding:'12px',borderRadius:12,cursor:'pointer',marginBottom:10,
                    background:'var(--grad)',border:'none',color:'#fff',fontSize:15,fontWeight:700}}>
                  📋 Copy Invite Code
                </button>
                <button onClick={()=>{setShowCreateModal(false);const r=myPrivateRooms.find(x=>x.code===createdCode);if(r)joinRoom(`private_${r.code}`,`🔒 ${r.name}`,true,r.code)}}
                  style={{width:'100%',padding:'12px',borderRadius:12,cursor:'pointer',
                    background:'var(--surface2)',border:'1.5px solid var(--border)',color:'var(--fg)',fontSize:15,fontWeight:600}}>
                  Enter Room →
                </button>
              </>
            ):(
              <>
                <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:18,fontWeight:700,marginBottom:20}}>🔒 Create Private Room</div>
                <input className="input-base" placeholder="Room name..." value={newRoomName}
                  onChange={e=>setNewRoomName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createPrivateRoom()}
                  style={{marginBottom:14}}/>
                <div style={{display:'flex',gap:10}}>
                  <button onClick={()=>setShowCreateModal(false)} style={{flex:1,padding:'12px',borderRadius:12,cursor:'pointer',
                    background:'var(--surface2)',border:'1.5px solid var(--border)',color:'var(--fg)',fontSize:14,fontWeight:600}}>Cancel</button>
                  <button onClick={createPrivateRoom} style={{flex:1,padding:'12px',borderRadius:12,cursor:'pointer',
                    background:'var(--grad)',border:'none',color:'#fff',fontSize:14,fontWeight:700}}>Create Room</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showJoinModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',
          alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(4px)'}}>
          <div style={{background:'var(--surface)',border:'1.5px solid var(--border)',
            borderRadius:24,padding:32,width:360,animation:'fadeUp 0.25s ease'}}>
            <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:18,fontWeight:700,marginBottom:20}}>🔑 Join Private Room</div>
            <input className="input-base" placeholder="Enter invite code (e.g. AB12CD)"
              value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e=>e.key==='Enter'&&joinPrivateRoom()}
              style={{marginBottom:6,fontFamily:'monospace',fontSize:18,letterSpacing:4,textAlign:'center'}}/>
            <div style={{fontSize:12,color:'var(--muted)',marginBottom:16,textAlign:'center'}}>
              Ask your friend for the 6-character invite code
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>{setShowJoinModal(false);setJoinCode('')}} style={{flex:1,padding:'12px',borderRadius:12,
                cursor:'pointer',background:'var(--surface2)',border:'1.5px solid var(--border)',color:'var(--fg)',fontSize:14,fontWeight:600}}>Cancel</button>
              <button onClick={joinPrivateRoom} style={{flex:1,padding:'12px',borderRadius:12,cursor:'pointer',
                background:'var(--grad)',border:'none',color:'#fff',fontSize:14,fontWeight:700}}>Join Room 🚀</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}