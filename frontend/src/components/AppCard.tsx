import { useState } from 'react';
import { Play, ExternalLink, Globe, HardDrive, Camera, Mic, Trash, Monitor, Cpu, Activity, Home, Volume2, Server, Settings } from 'lucide-react';
import { core } from '../../wailsjs/go/models';
import { CreateDesktopShortcut } from '../../wailsjs/go/core/App';
import { ShortcutModal } from './ShortcutModal';
import { PermissionsModal } from './PermissionsModal';

interface AppCardProps {
  app: core.AppModel;
  launchingAppId: string | null;
  handleLaunch: (id: string, type: string) => void;
  handleTogglePermission: (id: string, type: string, perm: keyof core.Permissions, currentVal: boolean) => void;
  handleRemove: (id: string) => void;
  showAlert: (msg: string) => void;
}

export function AppCard({ app, launchingAppId, handleLaunch, handleTogglePermission, handleRemove, showAlert }: AppCardProps) {
  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const handleCreateShortcut = async (name: string, icon: string) => {
    try {
      const success = await CreateDesktopShortcut(app.id, name, icon);
      if (success) {
        showAlert("Success! Desktop shortcut created in your application launcher.");
      } else {
        showAlert("Failed to create shortcut.");
      }
    } catch (e) {
      showAlert("Error creating shortcut: " + e);
    }
    setShowShortcutModal(false);
  };

  return (
    <div className="app-card glass-panel">
      <div className="app-header">
        <div className="app-title-group">
          <div className="app-icon">
            {app.icon.startsWith('data:image/') ? (
              <img src={app.icon} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              app.icon
            )}
          </div>
          <div className="app-info">
            <h3 title={app.id}>{app.name || app.id}</h3>
            <span className="app-type-badge">{app.type}</span>
          </div>
        </div>
        {app.type !== 'Native' ? (
          <button
            className="mini-launch-btn"
            title="Launch Application"
            onClick={() => handleLaunch(app.id, app.type)}
            disabled={launchingAppId === app.id}
          >
            <Play size={16} />
          </button>
        ) : (
          <button
            className="mini-launch-btn"
            title="Create Desktop Shortcut"
            onClick={() => setShowShortcutModal(true)}
          >
            <ExternalLink size={16} />
          </button>
        )}
      </div>

      {showShortcutModal && (
        <ShortcutModal 
          app={app} 
          onClose={() => setShowShortcutModal(false)} 
          onConfirm={handleCreateShortcut} 
        />
      )}

      <div 
        className="permissions-panel" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: 'auto',
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          padding: '0.4rem 0.6rem',
          minHeight: '36px'
        }}
      >
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
          {app.permissions.network && <span title="Network Access"><Globe size={14} style={{ color: 'var(--text-secondary)' }} /></span>}
          {app.permissions.fsHome && <span title="Home Folder"><Home size={14} style={{ color: 'var(--text-secondary)' }} /></span>}
          {app.permissions.fsHost && <span title="System Files"><HardDrive size={14} style={{ color: 'var(--text-secondary)' }} /></span>}
          {app.permissions.audioOutput && <span title="Audio Playback"><Volume2 size={14} style={{ color: 'var(--text-secondary)' }} /></span>}
          {app.permissions.camera && <span title="Camera"><Camera size={14} style={{ color: 'var(--text-secondary)' }} /></span>}
          {app.permissions.microphone && <span title="Microphone"><Mic size={14} style={{ color: 'var(--text-secondary)' }} /></span>}
          {app.permissions.display && <span title="Display (X11/Wayland)"><Monitor size={14} style={{ color: 'var(--text-secondary)' }} /></span>}
          {app.permissions.gpu && <span title="GPU Acceleration"><Cpu size={14} style={{ color: 'var(--text-secondary)' }} /></span>}
          {app.permissions.dbus && <span title="D-Bus Access"><Activity size={14} style={{ color: 'var(--text-secondary)' }} /></span>}
          {app.permissions.virtualization && <span title="Virtualization (KVM)"><Server size={14} style={{ color: 'var(--text-secondary)' }} /></span>}
          
          {!(app.permissions.network || app.permissions.fsHome || app.permissions.fsHost || app.permissions.audioOutput || app.permissions.camera || app.permissions.microphone || app.permissions.display || app.permissions.gpu || app.permissions.dbus || app.permissions.virtualization) && (
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Default</span>
          )}
        </div>
        
        <button 
          className="settings-btn" 
          onClick={() => setShowPermissionsModal(true)}
          title="Manage Permissions"
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: 'none', 
            color: 'var(--text-primary)', 
            borderRadius: '6px', 
            padding: '0.3rem 0.6rem', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.3rem', 
            marginLeft: '0.5rem', 
            transition: 'all 0.2s', 
            fontSize: '0.75rem', 
            fontWeight: 600,
            flexShrink: 0
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-color)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        >
          <Settings size={14} /> <span>Manage</span>
        </button>
      </div>

      {showPermissionsModal && (
        <PermissionsModal
          app={app}
          onClose={() => setShowPermissionsModal(false)}
          handleTogglePermission={handleTogglePermission}
        />
      )}

      {app.type === 'Native' && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            className="launch-btn"
            onClick={() => handleLaunch(app.id, app.type)}
            style={{ flex: 1, margin: 0 }}
            disabled={launchingAppId === app.id}
          >
            <Play size={16} /> {launchingAppId === app.id ? "Launching..." : "Launch"}
          </button>
          <button className="remove-btn" onClick={() => handleRemove(app.id)}>
            <Trash size={16} /> Remove
          </button>
        </div>
      )}
    </div>
  );
}
