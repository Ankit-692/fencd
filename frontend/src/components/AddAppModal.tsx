import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AddAppModalProps {
  pendingExecPath: string;
  newAppName: string;
  setNewAppName: (name: string) => void;
  confirmAddApp: () => Promise<void>;
  setShowModal: (show: boolean) => void;
}

export function AddAppModal({
  pendingExecPath,
  newAppName,
  setNewAppName,
  confirmAddApp,
  setShowModal,
}: AddAppModalProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleConfirm = async () => {
    if (!newAppName.trim()) return;
    setIsAdding(true);
    await confirmAddApp();
    setIsAdding(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Name Your Application</h3>
        <p>You selected: <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{pendingExecPath}</span></p>

        {isAdding ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem 0' }}>
            <Loader2 className="spinner" size={48} style={{ animation: 'spin 2s linear infinite', color: 'var(--accent-color)' }} />
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Extracting app and icon... this might take a moment.</p>
            <style>{`
              @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        ) : (
          <>
            <input
              autoFocus
              type="text"
              placeholder="e.g., My Awesome App"
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />

            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="confirm-btn" onClick={handleConfirm}>Add App</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
