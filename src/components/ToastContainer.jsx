import { useApp } from '../context/AppContext'

export default function ToastContainer() {
  const { toasts } = useApp()
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === 'success' ? '✅' : '❌'}</span> {t.msg}
        </div>
      ))}
    </div>
  )
}
