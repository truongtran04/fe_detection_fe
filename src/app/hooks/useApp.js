import { useState, useEffect, useCallback, useRef } from 'react';
import { parseTabFromPath, TAB_IDS } from '../../shared/constants/tabs.js';

export function useApp() {
  const [activeTab, setActiveTab] = useState(parseTabFromPath);
  const [conf, setConf] = useState(0.25);
  const [iou, setIou] = useState(0.45);
  const [serverOnline, setServerOnline] = useState(false);
  const [classes, setClasses] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [models, setModels] = useState([]);
  const [activeModel, setActiveModel] = useState('');
  const [loadingModel, setLoadingModel] = useState(false);

  const showToast = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch('/api/models');
      const data = await res.json();
      setModels(data.models || []);
      setActiveModel(data.current || '');
    } catch (e) {
      console.error('Error fetching models:', e);
    }
  }, []);

  const handleSelectModel = useCallback(async (modelPath) => {
    setLoadingModel(true);
    showToast('Đang tải và nạp mô hình AI...', 'info');
    try {
      const res = await fetch('/api/select-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: modelPath })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setActiveModel(data.current);
        showToast('Đã nạp và kích hoạt mô hình AI mới thành công!', 'success');
      } else {
        showToast('Lỗi nạp mô hình: ' + (data.detail || 'Không xác định'), 'error');
      }
    } catch (e) {
      showToast('Lỗi mạng khi nạp mô hình: ' + e.message, 'error');
    } finally {
      setLoadingModel(false);
    }
  }, [showToast]);

  useEffect(() => {
    const currentPath = window.location.pathname.replace(/^\//, '');
    if (currentPath !== activeTab) {
      window.history.pushState(null, '', `/${activeTab}`);
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, '');
      if (TAB_IDS.includes(path)) setActiveTab(path);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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

  useEffect(() => {
    if (serverOnline) {
      fetchModels();
    }
  }, [serverOnline, fetchModels]);

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
    showToast,
    models,
    activeModel,
    loadingModel,
    handleSelectModel
  };
}
