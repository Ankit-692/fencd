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
    <div className="app-card glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1.25rem' }}>
      <div className="app-header" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
        <div className="app-icon" style={{ width: '64px', height: '64px', flexShrink: 0, borderRadius: '16px' }}>
          {app.icon.startsWith('data:image/') ? (
            <img src={app.icon} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            app.icon
          )}
        </div>
        <div className="app-info" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h3 title={app.name || app.id} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0, fontSize: '1.25rem' }}>{app.name || app.id}</h3>
          <div><span className="app-type-badge">{app.type}</span></div>
        </div>
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
          gap: '0.5rem', 
          flexWrap: 'wrap', 
          alignItems: 'center', 
          background: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '0.75rem',
          minHeight: '48px'
        }}
      >
        {app.permissions.network && <span title="Network Access"><Globe size={18} style={{ color: 'rgba(255,255,255,0.75)' }} /></span>}
        {app.permissions.fsHome && <span title="Home Folder"><Home size={18} style={{ color: 'rgba(255,255,255,0.75)' }} /></span>}
        {app.permissions.fsHost && <span title="System Files"><HardDrive size={18} style={{ color: 'rgba(255,255,255,0.75)' }} /></span>}
        {app.permissions.audioOutput && <span title="Audio Playback"><Volume2 size={18} style={{ color: 'rgba(255,255,255,0.75)' }} /></span>}
        {app.permissions.camera && <span title="Camera"><Camera size={18} style={{ color: 'rgba(255,255,255,0.75)' }} /></span>}
        {app.permissions.microphone && <span title="Microphone"><Mic size={18} style={{ color: 'rgba(255,255,255,0.75)' }} /></span>}
        {app.permissions.display && <span title="Display (X11/Wayland)"><Monitor size={18} style={{ color: 'rgba(255,255,255,0.75)' }} /></span>}
        {app.permissions.gpu && <span title="GPU Acceleration"><Cpu size={18} style={{ color: 'rgba(255,255,255,0.75)' }} /></span>}
        {app.permissions.dbus && <span title="D-Bus Access"><Activity size={18} style={{ color: 'rgba(255,255,255,0.75)' }} /></span>}
        {app.permissions.virtualization && <span title="Virtualization (KVM)"><Server size={18} style={{ color: 'rgba(255,255,255,0.75)' }} /></span>}
        
        {!(app.permissions.network || app.permissions.fsHome || app.permissions.fsHost || app.permissions.audioOutput || app.permissions.camera || app.permissions.microphone || app.permissions.display || app.permissions.gpu || app.permissions.dbus || app.permissions.virtualization) && (
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', paddingLeft: '0.25rem' }}>No special permissions active</span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
        <button 
          onClick={() => setShowPermissionsModal(true)}
          title="Manage App"
          style={{ 
            flex: app.type === 'Native' ? '1 1 100%' : '1',
            background: 'var(--accent-color)', 
            border: 'none', 
            color: 'white', 
            borderRadius: '6px', 
            padding: '0.75rem', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '0.4rem', 
            transition: 'all 0.2s', 
            fontSize: '1rem', 
            fontWeight: 600,
            margin: 0
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent-color)'; }}
        >
          <Settings size={18} /> Manage
        </button>

        {app.type === 'Native' && (
          <button 
            onClick={() => setShowShortcutModal(true)}
            title="Create Sandbox Shortcut"
            style={{ 
              flex: 1,
              background: 'rgba(255,255,255,0.08)', 
              border: 'none', 
              color: 'var(--text-primary)', 
              borderRadius: '6px', 
              padding: '0.75rem', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '0.4rem', 
              transition: 'all 0.2s', 
              fontSize: '1rem', 
              fontWeight: 600,
              margin: 0
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          >
            <Monitor size={18} /> Shortcut
          </button>
        )}
        
        <button 
          onClick={() => handleLaunch(app.id, app.type)}
          disabled={launchingAppId === app.id}
          title="Launch App directly"
          style={{ 
            flex: app.type === 'Native' ? 1 : '0 1 auto',
            minWidth: app.type === 'Native' ? 'auto' : '100px',
            background: 'rgba(255,255,255,0.08)', 
            border: 'none', 
            color: 'var(--text-primary)', 
            borderRadius: '6px', 
            padding: '0.75rem', 
            cursor: launchingAppId === app.id ? 'not-allowed' : 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '0.4rem', 
            transition: 'all 0.2s', 
            fontSize: '1rem', 
            fontWeight: 600,
            margin: 0,
            opacity: launchingAppId === app.id ? 0.6 : 1
          }}
          onMouseEnter={(e) => { if (launchingAppId !== app.id) e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
          onMouseLeave={(e) => { if (launchingAppId !== app.id) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
        >
          <Play size={18} /> {app.type === 'Native' ? "Launch" : (launchingAppId === app.id ? "Launching..." : "Launch")}
        </button>
      </div>

      {showPermissionsModal && (
        <PermissionsModal
          app={app}
          onClose={() => setShowPermissionsModal(false)}
          handleTogglePermission={handleTogglePermission}
          onOpenShortcut={() => setShowShortcutModal(true)}
          handleRemove={handleRemove}
        />
      )}
    </div>
  );
}
