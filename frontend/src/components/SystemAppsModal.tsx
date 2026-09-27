import { useState, useEffect } from 'react';
import { GetSystemApps, AddNativeApp } from '../../wailsjs/go/core/App';
import { core } from '../../wailsjs/go/models';

interface Props {
  setShowModal: (show: boolean) => void;
  onAppAdded: () => void;
  showAlert: (msg: string) => void;
}

export function SystemAppsModal({ setShowModal, onAppAdded, showAlert }: Props) {
  const [apps, setApps] = useState<core.SystemApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addingApp, setAddingApp] = useState<string | null>(null);

  useEffect(() => {
    const fetchApps = async () => {
      setLoading(true);
      try {
        const sysApps = await GetSystemApps();
        setApps(sysApps || []);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchApps();
  }, []);

  const handleAdd = async (app: core.SystemApp) => {
    setAddingApp(app.execPath);
    try {
      const success = await AddNativeApp(app.name, app.execPath, app.icon);
      if (success) {
        onAppAdded();
      } else {
        showAlert("Failed to add app or it already exists.");
      }
    } catch (e) {
      console.error(e);
      showAlert("Error adding app.");
    }
    setAddingApp(null);
  };

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(search.toLowerCase()) || 
    app.execPath.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '600px', maxWidth: '90vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <h2>Installed System Apps</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Select an app to add to the Fencd sandbox.
        </p>
        
        <input 
          type="text" 
          placeholder="Search apps..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="app-input"
          style={{ marginBottom: '1rem', width: '100%', boxSizing: 'border-box' }}
        />

        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading system apps...</div>
          ) : filteredApps.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>No apps found.</div>
          ) : (
            filteredApps.map(app => (
              <div key={app.execPath} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '0.75rem',
                borderBottom: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.02)',
                marginBottom: '0.25rem',
                borderRadius: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', flex: 1 }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    marginRight: '1rem', 
                    flexShrink: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    {app.icon.startsWith('data:image/') ? (
                      <img src={app.icon} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      app.icon
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{app.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{app.execPath}</span>
                  </div>
                </div>
                <button 
                  className="add-app-btn" 
                  onClick={() => handleAdd(app)}
                  disabled={addingApp === app.execPath}
                  style={{ minWidth: '80px', flexShrink: 0, marginLeft: '1rem' }}
                >
                  {addingApp === app.execPath ? 'Adding...' : 'Add'}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: '1rem' }}>
          <button className="cancel-btn" onClick={() => setShowModal(false)}>Close</button>
        </div>
      </div>
    </div>
  );
}
