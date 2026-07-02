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
  showToast,
  models,
  activeModel,
  loadingModel,
  handleSelectModel
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isDarkMode = true; // Fixed to Dark Mode

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
        models={models}
        activeModel={activeModel}
        loadingModel={loadingModel}
        handleSelectModel={handleSelectModel}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Header
          activeTab={activeTab}
          sidebarOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(prev => !prev)}
          isDarkMode={isDarkMode}
        />

        <div className="flex-1 overflow-y-auto p-6 relative">
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

