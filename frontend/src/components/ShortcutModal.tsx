import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { core } from '../../wailsjs/go/models';

interface Props {
  app: core.AppModel;
  onClose: () => void;
  onConfirm: (name: string, icon: string) => void;
}

export function ShortcutModal({ app, onClose, onConfirm }: Props) {
  const [name, setName] = useState(app.name || app.id);
  const [icon, setIcon] = useState(app.icon || '🚀');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setIcon(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '400px', maxWidth: '90vw' }}>
        <h2>Create Desktop Shortcut</h2>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Shortcut Name</label>
          <input 
            type="text" 
            className="app-input" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Icon</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              {icon.startsWith('data:image/') ? (
                <img src={icon} alt="Icon preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                icon
              )}
            </div>
            <div style={{ flex: 1 }}>
              <input 
                type="text" 
                className="app-input" 
                value={icon} 
                onChange={(e) => setIcon(e.target.value)} 
                placeholder="Emoji or Base64"
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: '0.5rem' }}
              />
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/svg+xml"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
              <button 
                className="add-app-btn" 
                onClick={() => fileInputRef.current?.click()}
                style={{ width: '100%' }}
              >
                Upload Image
              </button>
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="add-app-btn confirm-btn" onClick={() => onConfirm(name, icon)}>Create Shortcut</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
