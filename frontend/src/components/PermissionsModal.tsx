import { Globe, HardDrive, Camera, Mic, Monitor, Cpu, Activity, Home, Volume2, Server, X, Trash } from 'lucide-react';
import { createPortal } from 'react-dom';
import { core } from '../../wailsjs/go/models';

interface PermissionsModalProps {
  app: core.AppModel;
  onClose: () => void;
  handleTogglePermission: (id: string, type: string, perm: keyof core.Permissions, currentVal: boolean) => void;
  onOpenShortcut?: () => void;
  handleRemove?: (id: string) => void;
}

export function PermissionsModal({ app, onClose, handleTogglePermission, onOpenShortcut, handleRemove }: PermissionsModalProps) {
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content permissions-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>App Permissions</h3>
          <button className="icon-btn" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="permissions-list" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
          <div className="permission-item">
            <div className="permission-info">
              <Globe size={16} />
              <span className="permission-name">Network Access</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={app.permissions.network} onChange={() => handleTogglePermission(app.id, app.type, 'network', app.permissions.network)} />
              <span className="slider"></span>
            </label>
          </div>

          <div className="permission-item">
            <div className="permission-info">
              <Home size={16} />
              <span className="permission-name">Home Folder</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={app.permissions.fsHome} onChange={() => handleTogglePermission(app.id, app.type, 'fsHome', app.permissions.fsHome)} />
              <span className="slider"></span>
            </label>
          </div>

          <div className="permission-item">
            <div className="permission-info">
              <HardDrive size={16} />
              <span className="permission-name">System Files</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={app.permissions.fsHost} onChange={() => handleTogglePermission(app.id, app.type, 'fsHost', app.permissions.fsHost)} />
              <span className="slider"></span>
            </label>
          </div>

          <div className="permission-item">
            <div className="permission-info">
              <Volume2 size={16} />
              <span className="permission-name">Audio Playback</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={app.permissions.audioOutput} onChange={() => handleTogglePermission(app.id, app.type, 'audioOutput', app.permissions.audioOutput)} />
              <span className="slider"></span>
            </label>
          </div>

          <div className="permission-item">
            <div className="permission-info">
              <Camera size={16} />
              <span className="permission-name">Camera</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={app.permissions.camera} onChange={() => handleTogglePermission(app.id, app.type, 'camera', app.permissions.camera)} />
              <span className="slider"></span>
            </label>
          </div>

          <div className="permission-item">
            <div className="permission-info">
              <Mic size={16} />
              <span className="permission-name">Microphone</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={app.permissions.microphone} onChange={() => handleTogglePermission(app.id, app.type, 'microphone', app.permissions.microphone)} />
              <span className="slider"></span>
            </label>
          </div>

          <div className="permission-item">
            <div className="permission-info">
              <Monitor size={16} />
              <span className="permission-name">Display (X11/Wayland)</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={app.permissions.display} onChange={() => handleTogglePermission(app.id, app.type, 'display', app.permissions.display)} />
              <span className="slider"></span>
            </label>
          </div>

          <div className="permission-item">
            <div className="permission-info">
              <Cpu size={16} />
              <span className="permission-name">GPU Acceleration</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={app.permissions.gpu} onChange={() => handleTogglePermission(app.id, app.type, 'gpu', app.permissions.gpu)} />
              <span className="slider"></span>
            </label>
          </div>

          <div className="permission-item">
            <div className="permission-info">
              <Activity size={16} />
              <span className="permission-name">D-Bus Access</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={app.permissions.dbus} onChange={() => handleTogglePermission(app.id, app.type, 'dbus', app.permissions.dbus)} />
              <span className="slider"></span>
            </label>
          </div>

          <div className="permission-item">
            <div className="permission-info">
              <Server size={16} />
              <span className="permission-name">Virtualization (KVM)</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={app.permissions.virtualization} onChange={() => handleTogglePermission(app.id, app.type, 'virtualization', app.permissions.virtualization)} />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {app.type === 'Native' && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>App Actions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {handleRemove && (
                <button
                  onClick={() => { onClose(); handleRemove(app.id); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.95rem' }}
                >
                  <Trash size={18} /> Remove Application
                </button>
              )}
            </div>
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
          <button className="confirm-btn" onClick={onClose} style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}>Done</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
