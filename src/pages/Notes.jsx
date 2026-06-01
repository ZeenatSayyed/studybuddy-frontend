import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : ''

export default function Notes() {
  const { notes, loadNotes, apiFetch, toast } = useApp()
  const [search, setSearch]       = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editId, setEditId]       = useState('')
  const [title, setTitle]         = useState('')
  const [content, setContent]     = useState('')
  const [modal, setModal]         = useState(null)

  const filtered = notes.filter(n =>
    (n.title||'').toLowerCase().includes(search.toLowerCase()) ||
    (n.content||'').toLowerCase().includes(search.toLowerCase())
  )

  function openEditor(id='', t='', c='') {
    setEditId(id); setTitle(t); setContent(c); setEditorOpen(true)
  }
  function closeEditor() { setEditorOpen(false); setEditId(''); setTitle(''); setContent('') }

  async function saveNote() {
    if (!title.trim()) return toast('Please enter a title.', 'error')
    try {
      if (editId) { await apiFetch(`/notes/${editId}`, 'PUT', { title, content }); toast('Note updated ✅') }
      else        { await apiFetch('/notes', 'POST', { title, content }); toast('Note saved 📝') }
      closeEditor(); loadNotes()
    } catch { toast('Server offline?', 'error') }
  }

  function confirmDelete(id) {
    setModal({
      title: 'Delete Note', body: "Are you sure? This can't be undone.",
      buttons: [
        { label: 'Cancel', cls: 'btn-outline', fn: () => setModal(null) },
        { label: 'Delete', cls: 'btn-danger',  fn: async () => { setModal(null); await apiFetch(`/notes/${id}`, 'DELETE'); toast('Deleted.'); loadNotes() } }
      ]
    })
  }

  return (
    <div>
      {modal && <Modal {...modal} onClose={() => setModal(null)} />}
      <div className="page-header">
        <div className="page-title">📝 My Notes</div>
        <div className="page-sub">Capture and organise your study material.</div>
      </div>

      <div className="notes-toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="input-base" placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn-sm btn-accent" onClick={() => openEditor()}>+ New Note</button>
      </div>

      {editorOpen && (
        <div className="note-editor">
          <input className="input-base" placeholder="Note title..." value={title} onChange={e => setTitle(e.target.value)} style={{marginBottom:12,fontSize:17,fontWeight:700}}/>
          <textarea className="input-base" placeholder="Write your notes here..." value={content} onChange={e => setContent(e.target.value)} style={{resize:'vertical',minHeight:130,lineHeight:1.7}}/>
          <div className="note-editor-btns">
            <button className="btn-sm btn-outline" onClick={closeEditor}>Cancel</button>
            <button className="btn-sm btn-accent" onClick={saveNote}>Save Note</button>
          </div>
        </div>
      )}

      <div className="notes-grid">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No notes yet. Hit <strong>+ New Note</strong> to start!</p>
          </div>
        ) : filtered.map(n => (
          <div key={n._id} className="note-card">
            <div className="note-card-title">{n.title || 'Untitled'}</div>
            <div className="note-card-content">{n.content || ''}</div>
            <div className="note-card-date">{fmtDate(n.createdAt)}</div>
            <div className="note-card-actions">
              <button className="btn-sm btn-outline" onClick={() => openEditor(n._id, n.title, n.content)}>✏️ Edit</button>
              <button className="btn-sm btn-danger"  onClick={() => confirmDelete(n._id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
