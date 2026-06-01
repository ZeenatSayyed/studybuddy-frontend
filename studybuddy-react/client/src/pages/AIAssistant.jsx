import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'

const SUGGESTIONS = [
  "Explain Newton's laws of motion",
  "Give me 5 exam tips for tomorrow",
  "What is the difference between RAM and ROM?",
  "How do I stay focused while studying?",
  "Explain the Pythagorean theorem with an example",
]

function formatMarkdown(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/`(.*?)`/g,"<code style='background:var(--surface2);padding:2px 6px;border-radius:4px;font-size:12px;font-family:monospace'>$1</code>")
    .replace(/\n/g,'<br>')
}

function timeNow() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function AIAssistant() {
  const { apiFetch, incAI } = useApp()
  const [messages, setMessages] = useState([
    { role: 'bot', text: "👋 Hey! I'm your AI study buddy powered by LLaMA 3.3. Ask me anything — concepts, definitions, practice questions, exam strategies. Let's ace this! 🎓", time: timeNow() }
  ])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showSugg, setShowSugg] = useState(true)
  const boxRef                  = useRef(null)

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight
  }, [messages, loading])

  async function send(text) {
    const q = (text || input).trim()
    if (!q) return
    setInput(''); setShowSugg(false)
    setMessages(m => [...m, { role: 'user', text: q, time: timeNow() }])
    setLoading(true)
    try {
      const res  = await apiFetch('/ask-ai', 'POST', { question: q })
      const data = await res.json()
      setMessages(m => [...m, { role: 'bot', text: data.answer || 'No response.', time: timeNow() }])
      incAI()
    } catch {
      setMessages(m => [...m, { role: 'bot', text: '⚠️ AI server offline. Make sure backend is running on port 5000.', time: timeNow() }])
    } finally { setLoading(false) }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🤖 AI Assistant</div>
        <div className="page-sub">Powered by LLaMA 3.3 — your personal study coach.</div>
      </div>
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="chat-wrap">
          <div className="chat-messages" ref={boxRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div className="msg-bubble" dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }}/>
                <div className="msg-time">{msg.time}</div>
              </div>
            ))}
            {loading && (
              <div className="message bot">
                <div className="msg-bubble">
                  <div className="typing-dots"><span/><span/><span/></div>
                </div>
              </div>
            )}
          </div>

          {showSugg && (
            <div className="chat-suggestions">
              {SUGGESTIONS.map((s,i) => (
                <div key={i} className="suggestion-chip" onClick={() => send(s)}>{s}</div>
              ))}
            </div>
          )}

          <div className="chat-input-area">
            <textarea
              placeholder="Ask anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              style={{resize:'none'}}
              onInput={e => { e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px' }}
            />
            <button className="send-btn" onClick={() => send()}>➤</button>
          </div>
        </div>
      </div>
    </div>
  )
}
