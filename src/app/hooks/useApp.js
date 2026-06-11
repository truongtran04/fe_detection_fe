import { useState, useEffect, useCallback, useRef } from 'react';
import { parseTabFromHash, TAB_IDS } from '../../shared/constants/tabs.js';

export function useApp() {
  const [activeTab, setActiveTab] = useState(parseTabFromHash);
  const [conf, setConf] = useState(0.25);
  const [iou, setIou] = useState(0.45);
  const [serverOnline, setServerOnline] = useState(false);
  const [classes, setClasses] = useState([]);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    window.location.hash = `#/${activeTab}`;
  }, [activeTab]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      if (TAB_IDS.includes(hash)) setActiveTab(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const checkServerStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/info');
      const data = await res.json();
      if (res.ok && data.status === 'active') {
        setServerOnline(true);
        setClasses(Object.values(data.classes || {}));
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
    }
  }, []);

  const prevOnlineRef = useRef(null);

  useEffect(() => {
    if (prevOnlineRef.current === null) {
      if (serverOnline === true) {
        showToast('Đã kết nối với Inference Server', 'success');
      }
    } else {
      if (prevOnlineRef.current === false && serverOnline === true) {
        showToast('Đã kết nối với Inference Server', 'success');
      } else if (prevOnlineRef.current === true && serverOnline === false) {
        showToast('Mất kết nối với Inference Server', 'error');
      }
    }
    prevOnlineRef.current = serverOnline;
  }, [serverOnline, showToast]);

  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 5000);
    return () => clearInterval(interval);
  }, [checkServerStatus]);

  return {
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
  };
}
