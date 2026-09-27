import { Image as ImageIcon } from 'lucide-react';
import { SelectIcon } from '../../wailsjs/go/core/App';

interface AddAppModalProps {
  pendingExecPath: string;
  newAppName: string;
  setNewAppName: (name: string) => void;
  newAppIcon: string;
  setNewAppIcon: (icon: string) => void;
  confirmAddApp: () => void;
  setShowModal: (show: boolean) => void;
}

export function AddAppModal({
  pendingExecPath,
  newAppName,
  setNewAppName,
  newAppIcon,
  setNewAppIcon,
  confirmAddApp,
  setShowModal,
}: AddAppModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Name Your Application</h3>
        <p>You selected: <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{pendingExecPath}</span></p>
        <input
          autoFocus
          type="text"
          placeholder="e.g., My Awesome App"
          value={newAppName}
          onChange={(e) => setNewAppName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && confirmAddApp()}
        />

        <div className="icon-selector" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <div className="app-icon" style={{ width: '40px', height: '40px', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
            {newAppIcon.startsWith('data:image/') ? (
              <img src={newAppIcon} alt="Icon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              "🚀"
            )}
          </div>
          <button className="cancel-btn" onClick={async () => {
            const iconBase64 = await SelectIcon();
            if (iconBase64) setNewAppIcon(iconBase64);
          }} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <ImageIcon size={16} /> Choose Custom Icon
          </button>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="confirm-btn" onClick={confirmAddApp}>Add App</button>
        </div>
      </div>
    </div>
  );
}
