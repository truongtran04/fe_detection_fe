import { useState } from 'react';
import { Sidebar } from './components/Sidebar.jsx';
import { Header } from './components/Header.jsx';
import { Footer } from './components/Footer.jsx';
import { ToastContainer } from './components/ToastContainer.jsx';
import { LiveMonitorTab } from '../features/live/LiveMonitorTab.jsx';
import { OfflineAnalysisTab } from '../features/offline/OfflineAnalysisTab.jsx';
import { HomographyTargetingTab } from '../features/homography/HomographyTargetingTab.jsx';
import { AlertsHistoryTab } from '../features/live/panels/AlertsHistoryTab.jsx';

export function AppLayout({
  activeTab,
  setActiveTab,
  conf,
  setConf,
  iou,
  setIou,
  serverOnline,
  classes,
  toasts,
  showToast
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const tabProps = { conf, iou, showToast };

  return (
    <div className={`flex h-screen bg-[#0b0c10] text-[#f1f3f9] font-sans overflow-hidden transition-all duration-300 ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        serverOnline={serverOnline}
        classes={classes}
        conf={conf}
        setConf={setConf}
        iou={iou}
        setIou={setIou}
        sidebarOpen={sidebarOpen}
      />

      <main className="flex-1 flex flex-col bg-[#0b0c10] overflow-hidden relative">
        <Header
          activeTab={activeTab}
          sidebarOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(prev => !prev)}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />

        <div className="flex-1 overflow-y-auto p-6 bg-[#0b0c10]/40 relative">
          {activeTab === 'live' && <LiveMonitorTab {...tabProps} />}
          {activeTab === 'predict' && <OfflineAnalysisTab {...tabProps} />}
          {activeTab === 'targeting' && <HomographyTargetingTab {...tabProps} />}
          {activeTab === 'history' && <AlertsHistoryTab {...tabProps} />}
        </div>

        <Footer />
      </main>

      <ToastContainer toasts={toasts} />
    </div>
  );
}

