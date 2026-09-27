import { Shield, LayoutGrid, Box, Terminal } from 'lucide-react';

type TabType = 'All' | 'Flatpak' | 'Snap' | 'Native';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <div className="sidebar">
      <h2><Shield size={24} color="var(--accent-color)" /> Fencd</h2>
      <button className={`nav-item ${activeTab === 'All' ? 'active' : ''}`} onClick={() => setActiveTab('All')}>
        <LayoutGrid size={20} /> All Apps
      </button>
      <button className={`nav-item ${activeTab === 'Flatpak' ? 'active' : ''}`} onClick={() => setActiveTab('Flatpak')}>
        <Box size={20} /> Flatpaks
      </button>
      <button className={`nav-item ${activeTab === 'Snap' ? 'active' : ''}`} onClick={() => setActiveTab('Snap')}>
        <Box size={20} /> Snaps
      </button>
      <button className={`nav-item ${activeTab === 'Native' ? 'active' : ''}`} onClick={() => setActiveTab('Native')}>
        <Terminal size={20} /> Native & AppImage
      </button>
    </div>
  );
}
