import { useState, useEffect } from 'react';
import './App.css';
import { Shield, Plus } from 'lucide-react';
import { GetApps, TogglePermission, AddNativeApp, LaunchApp, SelectExecutable, RemoveNativeApp } from '../wailsjs/go/core/App';
import { core } from '../wailsjs/go/models';import { Sidebar } from './components/Sidebar';
import { AppCard } from './components/AppCard';
import { AddAppModal } from './components/AddAppModal';
import { SystemAppsModal } from './components/SystemAppsModal';

export type TabType = 'All' | 'Flatpak' | 'Snap' | 'Native';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [apps, setApps] = useState<core.AppModel[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showSystemAppsModal, setShowSystemAppsModal] = useState(false);
  const [pendingExecPath, setPendingExecPath] = useState('');
  const [newAppName, setNewAppName] = useState('');
  const [newAppIcon, setNewAppIcon] = useState('');
  const [launchingAppId, setLaunchingAppId] = useState<string | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null);
  const [alertDialog, setAlertDialog] = useState<{message: string} | null>(null);

  const showAlert = (message: string) => setAlertDialog({ message });
  const showConfirm = (message: string, onConfirm: () => void) => setConfirmDialog({ message, onConfirm });

  const fetchApps = async () => {
    setLoading(true);
    try {
      const result = await GetApps();
      setApps(result || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const filteredApps = apps.filter(app => activeTab === 'All' || app.type === activeTab);

  const handleTogglePermission = async (appId: string, appType: string, perm: keyof core.Permissions, currentVal: boolean) => {
    // Optimistically update UI
    setApps(apps.map(app => {
      if (app.id === appId) {
        const updatedPerms = {
          ...app.permissions,
          [perm]: !currentVal
        };
        // Flatpak ties audio input and output to the same pulseaudio socket
        if (app.type === 'Flatpak') {
          if (perm === 'audioOutput') updatedPerms.microphone = !currentVal;
          if (perm === 'microphone') updatedPerms.audioOutput = !currentVal;
        }
        
        return {
          ...app,
          permissions: updatedPerms
        } as core.AppModel;
      }
      return app;
    }));

    // Call backend
    const success = await TogglePermission(appId, appType, perm as string, !currentVal);

    // Revert if failed
    if (!success) {
      setApps(apps.map(app => {
        if (app.id === appId) {
          const revertedPerms = {
            ...app.permissions,
            [perm]: currentVal
          };
          if (app.type === 'Flatpak') {
            if (perm === 'audioOutput') revertedPerms.microphone = currentVal;
            if (perm === 'microphone') revertedPerms.audioOutput = currentVal;
          }

          return {
            ...app,
            permissions: revertedPerms
          } as core.AppModel;
        }
        return app;
      }));
      showAlert('Failed to apply permission. Make sure you have the required rights.');
    }
  };

  const handleAddNativeApp = async () => {
    const execPath = await SelectExecutable();
    if (!execPath) return; // User cancelled the dialog

    setPendingExecPath(execPath);
    setNewAppName('');
    setNewAppIcon('');
    setShowModal(true);
  };

  const confirmAddApp = async () => {
    if (!newAppName.trim()) return;

    setShowModal(false);
    const success = await AddNativeApp(newAppName, pendingExecPath, newAppIcon);
    if (success) {
      fetchApps();
    } else {
      showAlert("Failed to add app or it already exists.");
    }
  };

  const handleLaunch = async (appId: string, appType: string) => {
    setLaunchingAppId(appId);
    try {
      const success = await LaunchApp(appId, appType);
      if (!success) {
        showAlert("Failed to launch app.");
      }
    } catch (e) {
      console.error(e);
      showAlert("An error occurred while launching.");
    } finally {
      setTimeout(() => {
        setLaunchingAppId(null);
      }, 1000); // disable button for 1 second to prevent double launches
    }
  };

  const handleRemove = (appId: string) => {
    showConfirm("Are you sure you want to remove this app from Fencd?", async () => {
      const success = await RemoveNativeApp(appId);
      if (success) {
        fetchApps();
      } else {
        showAlert("Failed to remove app.");
      }
    });
  };

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="main-content">
        <div className="header" style={{ marginBottom: '1rem' }}>
          <div className="header-text">
            <h1>{activeTab} Applications</h1>
            <p>Manage sandboxing and system permissions</p>
          </div>
          {activeTab === 'Native' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="add-app-btn" onClick={() => setShowSystemAppsModal(true)}>
                <Plus size={18} /> Installed Apps
              </button>
              <button className="add-app-btn" onClick={handleAddNativeApp} style={{ background: 'var(--bg-card)' }}>
                <Plus size={18} /> Add Custom
              </button>
            </div>
          )}
        </div>

        <div className="info-banner" style={{
          background: 'rgba(255,255,255,0.03)', 
          border: '1px solid rgba(255,255,255,0.08)', 
          padding: '1rem 1.25rem', 
          borderRadius: '8px', 
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          lineHeight: '1.4',
          marginBottom: '2rem'
        }}>
          <Shield size={24} style={{color: 'var(--accent-color)', flexShrink: 0}} />
          <div>
            {activeTab === 'All' && "Manage all your applications from one dashboard. Permissions behave slightly differently based on the packaging format."}
            {(activeTab === 'Flatpak' || activeTab === 'Snap') && "These permissions apply system-wide. If the app is currently running, please restart it for the new permissions to take effect."}
            {activeTab === 'Native' && "Fencd actively sandboxes these apps. You must launch them from Fencd to apply these restrictions. You can create desktop shortcuts later to automate this."}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
            <p>Loading applications...</p>
          </div>
        ) : (
          <div className="app-grid">
            {filteredApps.length === 0 ? (
              <p>No {activeTab} applications found.</p>
            ) : filteredApps.map(app => (
              <AppCard
                key={app.id}
                app={app}
                launchingAppId={launchingAppId}
                handleLaunch={handleLaunch}
                handleTogglePermission={handleTogglePermission}
                handleRemove={handleRemove}
                showAlert={showAlert}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddAppModal
          pendingExecPath={pendingExecPath}
          newAppName={newAppName}
          setNewAppName={setNewAppName}
          newAppIcon={newAppIcon}
          setNewAppIcon={setNewAppIcon}
          confirmAddApp={confirmAddApp}
          setShowModal={setShowModal}
        />
      )}

      {showSystemAppsModal && (
        <SystemAppsModal 
          setShowModal={setShowSystemAppsModal} 
          onAppAdded={fetchApps} 
          showAlert={showAlert}
        />
      )}
      {confirmDialog && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '400px', maxWidth: '90vw', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginBottom: '1rem' }}>Confirm</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{confirmDialog.message}</p>
            <div className="modal-actions" style={{ justifyContent: 'center', gap: '1rem', marginTop: 'auto' }}>
              <button className="cancel-btn" onClick={() => setConfirmDialog(null)}>Cancel</button>
              <button className="add-app-btn" onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(null);
              }} style={{ background: '#e04a4a', borderColor: '#e04a4a' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {alertDialog && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '400px', maxWidth: '90vw', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginBottom: '1rem' }}>Notice</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{alertDialog.message}</p>
            <div className="modal-actions" style={{ justifyContent: 'center', marginTop: 'auto' }}>
              <button className="add-app-btn" onClick={() => setAlertDialog(null)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
