export default function ConfirmModal({ title, message, onConfirm, onCancel, danger=true }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{maxWidth:400}}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{color:'var(--text-secondary)', fontSize:14}}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {danger ? '🗑 Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
