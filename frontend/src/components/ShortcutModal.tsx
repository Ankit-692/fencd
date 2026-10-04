import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { models } from '../../wailsjs/go/models';

interface Props {
  app: models.AppModel;
  onClose: () => void;
  onConfirm: (name: string, icon: string) => void;
}

export function ShortcutModal({ app, onClose, onConfirm }: Props) {
  const [name, setName] = useState(app.name || app.id);
  const [icon, setIcon] = useState(app.icon || '🚀');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setIcon(ev.target.result as string);
          setError('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (!name.trim()) {
      setError("Shortcut name is required.");
      return;
    }
    if (!icon.trim()) {
      setError("Icon is required.");
      return;
    }

    let finalIcon = icon;

    if (!icon.startsWith('data:image/')) {
      const isEmoji = /\p{Extended_Pictographic}/u.test(icon);
      const hasText = /[a-zA-Z0-9]/.test(icon);
      
      if (!isEmoji || hasText) {
        setError("Please enter a valid emoji or upload an image. Text is not allowed.");
        return;
      }

      // Convert emoji to base64 PNG so it renders correctly on desktop environments
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Ensure emoji fonts are prioritized
        ctx.font = '100px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Ubuntu Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Adjust baseline slightly for standard emoji vertical alignment
        ctx.fillText(icon, 64, 72);
        finalIcon = canvas.toDataURL('image/png');
      }
    }

    setError('');
    onConfirm(name, finalIcon);
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '400px', maxWidth: '90vw' }}>
        <h2>Create Desktop Shortcut</h2>
        
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Shortcut Name</label>
          <input 
            type="text" 
            className="app-input" 
            value={name} 
            onChange={(e) => { setName(e.target.value); setError(''); }} 
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Icon</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
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
                onChange={(e) => { setIcon(e.target.value); setError(''); }} 
                placeholder="Emoji or Base64"
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: '0.5rem' }}
              />
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/svg+xml, image/webp"
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
          <button className="add-app-btn confirm-btn" onClick={handleConfirm}>Create Shortcut</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
