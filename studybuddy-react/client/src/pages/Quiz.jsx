import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Quiz() {
  const { notes, apiFetch, toast, incQuiz } = useApp()
  const [mode, setMode]       = useState('notes')
  const [phase, setPhase]     = useState('setup')

  const [selectedNotes, setSelectedNotes] = useState([])
  const [numQ, setNumQ]       = useState(5)
  const [questions, setQuestions] = useState([])
  const [index, setIndex]     = useState(0)
  const [score, setScore]     = useState(0)
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen]   = useState(null)
  const [showExp, setShowExp] = useState(false)

  const [qaQuestions, setQaQuestions]   = useState([])
  const [userAnswers, setUserAnswers]   = useState({})
  const [showAnswers, setShowAnswers]   = useState(false)

  const [bankQuestions, setBankQuestions] = useState([])
  const [bankLoading, setBankLoading]   = useState(false)
  const [addForm, setAddForm]           = useState({ question:'', optA:'', optB:'', optC:'', optD:'', answer:'', explanation:'' })
  const [addOpen, setAddOpen]           = useState(false)
  const [bankPhase, setBankPhase]       = useState('list')
  const [bankIndex, setBankIndex]       = useState(0)
  const [bankAnswered, setBankAnswered] = useState(false)
  const [bankChosen, setBankChosen]     = useState(null)
  const [bankScore, setBankScore]       = useState(0)

  const q    = questions[index]
  const norm = s => (s||'').trim().toLowerCase()

  function toggleNote(id) {
    setSelectedNotes(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id])
  }
  function getNoteText() {
    return notes.filter(n => selectedNotes.includes(n._id))
      .map(n => (n.title||'') + '\n' + (n.content||'')).join('\n\n')
  }
  function reset() {
    setPhase('setup'); setSelectedNotes([]); setQaQuestions([])
    setUserAnswers({}); setShowAnswers(false); setQuestions([])
    setBankPhase('list')
  }

  async function startNotesQuiz() {
    if (!selectedNotes.length) return toast('Select at least one note!', 'error')
    setPhase('loading')
    try {
      const res  = await apiFetch('/quiz/from-notes', 'POST', { notesText: getNoteText(), numQuestions: numQ })
      const data = await res.json()
      if (!Array.isArray(data) || !data.length) throw new Error('empty')
      setQuestions(data); setIndex(0); setScore(0); setAnswered(false); setChosen(null); setShowExp(false)
      setPhase('question')
    } catch { setPhase('setup'); toast('AI failed. Is server running?', 'error') }
  }

  function pickAnswer(opt) {
    if (answered) return
    setAnswered(true); setChosen(opt); setShowExp(true)
    if (norm(opt) === norm(q.answer)) setScore(s => s+1)
  }

  function nextQ() {
    if (index+1 >= questions.length) { incQuiz(); setPhase('result') }
    else { setIndex(i=>i+1); setAnswered(false); setChosen(null); setShowExp(false) }
  }

  async function startQaPaper() {
    if (!selectedNotes.length) return toast('Select at least one note!', 'error')
    setPhase('loading')
    try {
      const res  = await apiFetch('/quiz/qa-paper', 'POST', { notesText: getNoteText(), numQuestions: numQ })
      const data = await res.json()
      if (!Array.isArray(data) || !data.length) throw new Error('empty')
      setQaQuestions(data); setUserAnswers({}); setShowAnswers(false)
      setPhase('paper')
    } catch { setPhase('setup'); toast('AI failed. Is server running?', 'error') }
  }

  function printQaPaper() {
    const win = window.open('', '_blank')
    const selectedTitles = notes.filter(n=>selectedNotes.includes(n._id)).map(n=>n.title||'Untitled').join(', ')
    const totalMarks = qaQuestions.reduce((s, q) => s + (q.marks||1), 0)
    win.document.write(`
      <html><head><title>Question Paper</title>
      <style>
        body{font-family:Georgia,serif;max-width:780px;margin:40px auto;color:#111;line-height:1.6}
        h1{text-align:center;font-size:24px;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:6px}
        .meta{text-align:center;font-size:13px;color:#555;margin-bottom:32px}
        .q{margin-bottom:32px;page-break-inside:avoid}
        .q-text{font-size:15px;font-weight:bold;margin-bottom:8px}
        .marks{float:right;background:#f0f0f0;padding:2px 10px;border-radius:4px;font-size:13px;font-weight:bold}
        .line{border-bottom:1px solid #bbb;height:28px;margin-bottom:6px}
        .footer{margin-top:48px;border-top:1px solid #ccc;padding-top:12px;text-align:center;font-size:12px;color:#888}
        @media print{body{margin:20px}}
      </style></head><body>
      <h1>📝 Question Paper</h1>
      <div class="meta">
        Topic: <strong>${selectedTitles}</strong> &nbsp;|&nbsp;
        Total Questions: <strong>${qaQuestions.length}</strong> &nbsp;|&nbsp;
        Total Marks: <strong>${totalMarks}</strong> &nbsp;|&nbsp;
        Date: <strong>${new Date().toLocaleDateString('en-GB')}</strong>
      </div>
      ${qaQuestions.map((q,i)=>`
        <div class="q">
          <div class="q-text">
            <span class="marks">[${q.marks||1} mark${(q.marks||1)>1?'s':''}]</span>
            Q${i+1}. ${q.question}
          </div>
          <div class="ans-lines">
            <div class="line"></div><div class="line"></div><div class="line"></div>
          </div>
        </div>
      `).join('')}
      <div class="footer">Generated by StudyBuddy AI — All the best! 🎓</div>
      </body></html>`)
    win.document.close()
    win.print()
  }

  async function loadBank() {
    setBankLoading(true)
    try {
      const res  = await apiFetch('/quiz')
      const data = await res.json()
      setBankQuestions(data)
    } catch { toast('Could not load question bank', 'error') }
    setBankLoading(false)
  }

  async function addToBank() {
    const { question, optA, optB, optC, optD, answer, explanation } = addForm
    if (!question || !optA || !optB || !answer) return toast('Fill question, options & answer!', 'error')
    const options = [optA, optB, optC, optD].filter(Boolean)
    try {
      await apiFetch('/quiz/add', 'POST', { question, options, answer, explanation })
      toast('Question added! ✅')
      setAddForm({ question:'', optA:'', optB:'', optC:'', optD:'', answer:'', explanation:'' })
      setAddOpen(false)
      loadBank()
    } catch { toast('Failed to add', 'error') }
  }

  async function deleteFromBank(id) {
    try {
      await apiFetch(`/quiz/${id}`, 'DELETE')
      toast('Deleted'); loadBank()
    } catch { toast('Delete failed', 'error') }
  }

  function startBankQuiz() {
    if (!bankQuestions.length) return toast('No questions in bank!', 'error')
    setBankIndex(0); setBankScore(0); setBankAnswered(false); setBankChosen(null)
    setBankPhase('quiz')
  }

  function pickBankAnswer(opt) {
    if (bankAnswered) return
    setBankAnswered(true); setBankChosen(opt)
    if (norm(opt) === norm(bankQuestions[bankIndex].answer)) setBankScore(s=>s+1)
  }

  function nextBankQ() {
    if (bankIndex+1 >= bankQuestions.length) { incQuiz(); setBankPhase('result') }
    else { setBankIndex(i=>i+1); setBankAnswered(false); setBankChosen(null) }
  }

  const pct     = questions.length ? Math.round((score/questions.length)*100) : 0
  const bankPct = bankQuestions.length ? Math.round((bankScore/bankQuestions.length)*100) : 0
  const bq      = bankQuestions[bankIndex]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🎯 Quiz & Papers</div>
        <div className="page-sub">AI-powered quizzes, question papers, and question bank</div>
      </div>
      <div className="card">

        {phase === 'setup' && (
          <>
            <div className="quiz-mode-tabs">
              <div className={`quiz-mode-tab ${mode==='notes'?'active':''}`} onClick={() => setMode('notes')}>
                <span className="qmt-icon">⚡</span><h3>MCQ Quiz</h3>
                <p>Interactive quiz from your notes</p>
              </div>
              <div className={`quiz-mode-tab ${mode==='paper'?'active':''}`} onClick={() => setMode('paper')}>
                <span className="qmt-icon">📄</span><h3>Question Paper</h3>
                <p>Written Q&A paper — attempt or print</p>
              </div>
              <div className={`quiz-mode-tab ${mode==='bank'?'active':''}`} onClick={() => { setMode('bank'); loadBank() }}>
                <span className="qmt-icon">🗄️</span><h3>Question Bank</h3>
                <p>Add & practice saved questions</p>
              </div>
            </div>

            {mode === 'notes' && (
              <div className="quiz-notes-panel">
                <div className="card-title">📖 Select Notes</div>
                <NoteSelector notes={notes} selected={selectedNotes} toggle={toggleNote}/>
                <div className="num-q-row">
                  <span style={{fontSize:14,fontWeight:600,color:'var(--muted)'}}>Questions:</span>
                  <select className="input-base" style={{width:'auto',padding:'8px 14px'}} value={numQ} onChange={e=>setNumQ(+e.target.value)}>
                    {[3,5,8,10].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                  <button className="btn-sm btn-accent" onClick={startNotesQuiz}>Start MCQ Quiz ⚡</button>
                </div>
              </div>
            )}

            {mode === 'paper' && (
              <div className="quiz-notes-panel">
                <div className="card-title">📄 Select Notes for Question Paper</div>
                <NoteSelector notes={notes} selected={selectedNotes} toggle={toggleNote}/>
                <div className="num-q-row">
                  <span style={{fontSize:14,fontWeight:600,color:'var(--muted)'}}>Questions:</span>
                  <select className="input-base" style={{width:'auto',padding:'8px 14px'}} value={numQ} onChange={e=>setNumQ(+e.target.value)}>
                    {[5,8,10,15].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                  <button className="btn-sm btn-accent" onClick={startQaPaper}>Generate Paper 📄</button>
                </div>
                <div style={{marginTop:12,padding:'12px 16px',background:'var(--surface2)',borderRadius:12,border:'1px solid var(--border)',fontSize:13,color:'var(--muted)'}}>
                  💡 Written Q&A questions — type answers online, check model answers, or print as PDF
                </div>
              </div>
            )}

            {mode === 'bank' && (
              <QuestionBank
                questions={bankQuestions} loading={bankLoading}
                addOpen={addOpen} addForm={addForm}
                setAddForm={setAddForm} setAddOpen={setAddOpen}
                onAdd={addToBank} onDelete={deleteFromBank}
                onStartQuiz={startBankQuiz} bankPhase={bankPhase}
                bq={bq} bankIndex={bankIndex} bankAnswered={bankAnswered}
                bankChosen={bankChosen} bankScore={bankScore} bankPct={bankPct}
                pickBankAnswer={pickBankAnswer} nextBankQ={nextBankQ}
                norm={norm} onReset={() => { setBankPhase('list'); loadBank() }}
              />
            )}
          </>
        )}

        {phase === 'loading' && (
          <div style={{textAlign:'center',padding:52}}>
            <div style={{fontSize:48,animation:'logoBounce 1s infinite'}}>🤖</div>
            <p style={{color:'var(--muted)',marginTop:16,fontSize:15}}>AI is generating your paper...</p>
          </div>
        )}

        {phase === 'question' && q && (
          <>
            <div className="quiz-progress-bar">
              <div className="quiz-progress-fill" style={{width:`${(index/questions.length)*100}%`}}/>
            </div>
            <div className="quiz-meta">Question {index+1} of {questions.length}</div>
            <div className="quiz-q-text">{q.question}</div>
            <div className="options-grid">
              {q.options.map((opt,i) => {
                let cls = 'option-btn'
                if (answered) {
                  if (norm(opt)===norm(q.answer)) cls += ' correct'
                  else if (norm(opt)===norm(chosen)) cls += ' wrong'
                }
                return <button key={i} className={cls} disabled={answered} onClick={()=>pickAnswer(opt)}>{opt}</button>
              })}
            </div>
            {showExp && q.explanation && (
              <div className="explanation-box">💡 <strong>Explanation:</strong> {q.explanation}</div>
            )}
            {answered && (
              <div style={{marginTop:20,textAlign:'right'}}>
                <button className="btn-sm btn-accent" onClick={nextQ}>Next →</button>
              </div>
            )}
          </>
        )}

        {phase === 'result' && (
          <div className="quiz-result">
            <div className="result-score">{score}/{questions.length}</div>
            <div className="result-label">You scored <strong>{pct}%</strong></div>
            <p style={{color:'var(--muted)',marginBottom:28}}>
              {pct>=80?'🔥 Outstanding!':pct>=60?'👍 Good job!':'📚 Keep studying!'}
            </p>
            <button className="btn-sm btn-accent" style={{padding:'14px 32px'}} onClick={reset}>Try Again 🔁</button>
          </div>
        )}

        {phase === 'paper' && (
          <div>
            <div style={{background:'var(--surface2)',border:'1.5px solid var(--border)',borderRadius:18,padding:22,marginBottom:24}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
                <div>
                  <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:20,fontWeight:700}}>📝 Question Paper</div>
                  <div style={{color:'var(--muted)',fontSize:13,marginTop:4}}>
                    {qaQuestions.length} questions • Total marks: {qaQuestions.reduce((s,q)=>s+(q.marks||1),0)} • {new Date().toLocaleDateString('en-GB')}
                  </div>
                </div>
                <div style={{display:'flex',gap:10}}>
                  <button className="btn-sm btn-outline" onClick={printQaPaper}>🖨️ Print / PDF</button>
                  <button className="btn-sm btn-accent" onClick={()=>setShowAnswers(s=>!s)}>
                    {showAnswers ? '🙈 Hide Answers' : '👁️ Show Model Answers'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:20}}>
              {qaQuestions.map((ques,qi) => (
                <div key={qi} style={{background:'var(--surface2)',border:'1.5px solid var(--border)',borderRadius:18,padding:24}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                    <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                      <div style={{width:34,height:34,borderRadius:10,flexShrink:0,background:'var(--grad)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:15,color:'#fff'}}>{qi+1}</div>
                      <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:17,fontWeight:600,lineHeight:1.45,paddingTop:6}}>{ques.question}</div>
                    </div>
                    <div style={{flexShrink:0,padding:'4px 12px',borderRadius:99,background:'var(--surface)',border:'1px solid var(--border)',fontSize:12,fontWeight:700,color:'var(--accent)',whiteSpace:'nowrap'}}>
                      [{ques.marks||1} mark{(ques.marks||1)>1?'s':''}]
                    </div>
                  </div>
                  {ques.hint && (
                    <div style={{fontSize:12,color:'var(--muted)',marginBottom:12,padding:'6px 12px',background:'var(--surface)',borderRadius:8,border:'1px solid var(--border)'}}>
                      💭 Hint: {ques.hint}
                    </div>
                  )}
                  <textarea className="input-base" placeholder="Write your answer here..."
                    value={userAnswers[qi]||''} onChange={e=>setUserAnswers(p=>({...p,[qi]:e.target.value}))}
                    style={{resize:'vertical',minHeight:90,lineHeight:1.7,marginTop:0}}/>
                  {showAnswers && (
                    <div style={{marginTop:14,padding:'14px 18px',background:'rgba(106,247,160,0.06)',border:'1px solid rgba(106,247,160,0.25)',borderRadius:14,fontSize:14,lineHeight:1.7}}>
                      ✅ <strong>Model Answer:</strong> {ques.modelAnswer}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{marginTop:24,display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
              <button className="btn-sm btn-outline" onClick={reset}>← Back</button>
              <button className="btn-sm btn-outline" onClick={printQaPaper}>🖨️ Print Paper</button>
              <button className="btn-sm btn-accent" style={{padding:'14px 32px',fontSize:15}} onClick={()=>setShowAnswers(true)}>
                ✅ Check Model Answers
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function NoteSelector({ notes, selected, toggle }) {
  return (
    <div className="notes-selector">
      {notes.length === 0
        ? <div style={{color:'var(--muted)',textAlign:'center',padding:20}}>Create some notes first!</div>
        : notes.map(n => (
          <label key={n._id} className="note-select-item">
            <input type="checkbox" checked={selected.includes(n._id)} onChange={()=>toggle(n._id)}/>
            <div>
              <div className="ns-title">{n.title||'Untitled'}</div>
              <div className="ns-preview">{(n.content||'').substring(0,80)}{(n.content||'').length>80?'...':''}</div>
            </div>
          </label>
        ))
      }
    </div>
  )
}

function QuestionBank({ questions, loading, addOpen, addForm, setAddForm, setAddOpen,
  onAdd, onDelete, onStartQuiz, bankPhase, bq, bankIndex, bankAnswered,
  bankChosen, bankScore, bankPct, pickBankAnswer, nextBankQ, norm, onReset }) {

  if (bankPhase === 'quiz' && bq) return (
    <div>
      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{width:`${(bankIndex/questions.length)*100}%`}}/>
      </div>
      <div className="quiz-meta">Question {bankIndex+1} of {questions.length}</div>
      <div className="quiz-q-text">{bq.question}</div>
      <div className="options-grid">
        {bq.options.map((opt,i) => {
          let cls = 'option-btn'
          if (bankAnswered) {
            if (norm(opt)===norm(bq.answer)) cls += ' correct'
            else if (norm(opt)===norm(bankChosen)) cls += ' wrong'
          }
          return <button key={i} className={cls} disabled={bankAnswered} onClick={()=>pickBankAnswer(opt)}>{opt}</button>
        })}
      </div>
      {bankAnswered && bq.explanation && (
        <div className="explanation-box">💡 <strong>Explanation:</strong> {bq.explanation}</div>
      )}
      {bankAnswered && (
        <div style={{marginTop:20,textAlign:'right'}}>
          <button className="btn-sm btn-accent" onClick={nextBankQ}>Next →</button>
        </div>
      )}
    </div>
  )

  if (bankPhase === 'result') return (
    <div className="quiz-result">
      <div className="result-score">{bankScore}/{questions.length}</div>
      <div className="result-label">You scored <strong>{bankPct}%</strong></div>
      <p style={{color:'var(--muted)',marginBottom:28}}>
        {bankPct>=80?'🔥 Outstanding!':bankPct>=60?'👍 Good job!':'📚 Keep practising!'}
      </p>
      <button className="btn-sm btn-accent" style={{padding:'14px 32px'}} onClick={onReset}>Back to Bank 🗄️</button>
    </div>
  )

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:16,fontWeight:700}}>
          🗄️ Question Bank <span style={{color:'var(--muted)',fontSize:13,fontWeight:400}}>({questions.length} questions)</span>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn-sm btn-outline" onClick={()=>setAddOpen(o=>!o)}>
            {addOpen ? '✕ Cancel' : '+ Add Question'}
          </button>
          {questions.length > 0 && (
            <button className="btn-sm btn-accent" onClick={onStartQuiz}>Start Quiz ⚡</button>
          )}
        </div>
      </div>

      {addOpen && (
        <div style={{background:'var(--surface2)',border:'1.5px solid var(--accent)',borderRadius:18,padding:22,marginBottom:20,animation:'fadeUp 0.3s ease'}}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>➕ Add New Question</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <textarea className="input-base" placeholder="Question *" value={addForm.question}
              onChange={e=>setAddForm(p=>({...p,question:e.target.value}))} style={{resize:'vertical',minHeight:70}}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {['optA','optB','optC','optD'].map((k,i)=>(
                <input key={k} className="input-base" placeholder={`Option ${String.fromCharCode(65+i)}${i<2?' *':''}`}
                  value={addForm[k]} onChange={e=>setAddForm(p=>({...p,[k]:e.target.value}))}/>
              ))}
            </div>
            <input className="input-base" placeholder="Correct Answer (exact text from options) *"
              value={addForm.answer} onChange={e=>setAddForm(p=>({...p,answer:e.target.value}))}/>
            <input className="input-base" placeholder="Explanation (optional)"
              value={addForm.explanation} onChange={e=>setAddForm(p=>({...p,explanation:e.target.value}))}/>
            <div style={{textAlign:'right'}}>
              <button className="btn-sm btn-accent" onClick={onAdd}>Save Question ✅</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{textAlign:'center',padding:40}}><div className="spinner"/></div>
      ) : questions.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🗄️</span>
          <p>No questions yet.<br/>Click <strong>+ Add Question</strong> to build your bank!</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {questions.map((q,i) => (
            <div key={q._id} style={{background:'var(--surface2)',border:'1.5px solid var(--border)',borderRadius:16,padding:18,display:'flex',gap:14,alignItems:'flex-start'}}>
              <div style={{width:30,height:30,borderRadius:8,flexShrink:0,background:'var(--glow)',border:'1.5px solid var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Clash Display',sans-serif",fontWeight:700,fontSize:13,color:'var(--accent)'}}>{i+1}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14,marginBottom:6}}>{q.question}</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {q.options.map((opt,oi)=>(
                    <span key={oi} style={{padding:'3px 10px',borderRadius:99,fontSize:12,
                      background:norm(opt)===norm(q.answer)?'rgba(106,247,160,0.12)':'var(--surface)',
                      border:norm(opt)===norm(q.answer)?'1px solid rgba(106,247,160,0.4)':'1px solid var(--border)',
                      color:norm(opt)===norm(q.answer)?'var(--success)':'var(--muted)',
                      fontWeight:norm(opt)===norm(q.answer)?700:400}}>
                      {String.fromCharCode(65+oi)}. {opt}
                    </span>
                  ))}
                </div>
                {q.explanation && <div style={{fontSize:12,color:'var(--muted)',marginTop:6}}>💡 {q.explanation}</div>}
              </div>
              <button onClick={()=>onDelete(q._id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:18,padding:'4px',flexShrink:0,lineHeight:1}}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}