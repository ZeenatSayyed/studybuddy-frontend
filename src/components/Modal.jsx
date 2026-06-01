export default function Modal({ title, body, buttons, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{title}</div>
        <div className="modal-body">{body}</div>
        <div className="modal-btns">
          {buttons.map((b, i) => (
            <button key={i} className={`btn-sm ${b.cls}`} onClick={b.fn}>{b.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
