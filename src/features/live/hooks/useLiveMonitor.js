import { useState, useEffect, useRef } from 'react';
import { INITIAL_STATS, STREAM_TYPES, DANGER_FRAME_THRESHOLD } from '../constants.js';
import { createAlarmController } from '../utils/alarmAudio.js';
import { logAlert, fetchAlertsHistory, clearAlertsHistory } from '../utils/alertsApi.js';
import { uploadSampleVideo } from '../utils/videoUpload.js';

const EMPTY_STATS = () => ({ ...INITIAL_STATS });

export function useLiveMonitor({ conf, iou, showToast }) {
  const [streamSource, setStreamSource] = useState('videos/file.mp4');
  const [customUrl, setCustomUrl] = useState('');
  const [activeStreamType, setActiveStreamType] = useState(STREAM_TYPES.NONE);
  const [isMuted, setIsMuted] = useState(false);
  const [streamTimestamp, setStreamTimestamp] = useState(null);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [isAlertConfirmed, setIsAlertConfirmed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts] = useState(false);
  const [wsImage, setWsImage] = useState(null);

  const videoRef = useRef(null);
  const wsCapCanvasRef = useRef(null);
  const wsRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const captureIntervalRef = useRef(null);
  const alertsIntervalRef = useRef(null);
  const isMutedRef = useRef(isMuted);
  const alarmRef = useRef(null);

  isMutedRef.current = isMuted;

  useEffect(() => {
    alarmRef.current = createAlarmController(isMutedRef);
  }, []);

  const stopPollingStats = () => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
  };

  const pollStats = () => {
    stopPollingStats();
    statsIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/stream-stats');
        setStats(await res.json());
      } catch (e) {
        console.error(e);
      }
    }, 1000);
  };

  const handleStopStream = (sessionToStop = null) => {
    alarmRef.current?.stop();
    stopPollingStats();
    if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    if (wsRef.current) wsRef.current.close();
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }

    const finalSession = (sessionToStop && (typeof sessionToStop === 'string' || typeof sessionToStop === 'number'))
      ? sessionToStop
      : null;
    
    // Only call /api/stop-stream if there is a session running, or if activeStreamType is not NONE.
    // This avoids sending an unnecessary global stop request during startup which races with and kills the new stream.
    if (finalSession || activeStreamType !== STREAM_TYPES.NONE) {
      const url = finalSession ? `/api/stop-stream?session_id=${finalSession}` : '/api/stop-stream';
      fetch(url, { method: 'POST' }).catch(() => {});
    }

    setActiveStreamType(STREAM_TYPES.NONE);
    setWsImage(null);
    setStats(EMPTY_STATS());
    setIsAlertConfirmed(false);
  };

  const handleStartWebSocket = async () => {
    handleStopStream(streamTimestamp);
    setActiveStreamType(STREAM_TYPES.WEBSOCKET);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: 1.7777777778
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const loc = window.location;
      const wsProtocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${loc.host}/api/ws/predict?conf=${conf}&iou=${iou}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const sendNextFrame = () => {
        const video = videoRef.current;
        const canvas = wsCapCanvasRef.current;
        if (!video || !canvas || ws.readyState !== WebSocket.OPEN) return;
        
        canvas.width = 640;
        canvas.height = 360;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, 640, 360);
        canvas.toBlob((blob) => {
          if (blob && ws.readyState === WebSocket.OPEN) {
            blob.arrayBuffer().then(buf => ws.send(buf));
          }
        }, 'image/jpeg', 0.65);
      };

      ws.onopen = () => {
        // Gửi frame đầu tiên khi mở kết nối
        sendNextFrame();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) return;
          setWsImage(data.image);
          const fireC = (data.detections || []).filter(d => d.class_name === 'fire').length;
          const smokeC = (data.detections || []).filter(d => d.class_name === 'smoke').length;
          setStats(prev => ({
            ...prev,
            frame: prev.frame + 1,
            total_detections: prev.total_detections + (data.detections || []).length,
            fire_now: fireC,
            smoke_now: smokeC,
            fire_accumulated: (prev.fire_accumulated || 0) + (fireC > 0 ? 1 : 0),
            smoke_accumulated: (prev.smoke_accumulated || 0) + (smokeC > 0 ? 1 : 0),
            fire_level: data.alert_level || "none",
            is_alerting: data.is_alerting || false,
            is_active: true
          }));
        } catch {
          // ignore malformed frames
        }
        
        // Sau khi nhận kết quả của frame cũ, lập tức gửi tiếp frame mới
        if (ws.readyState === WebSocket.OPEN) {
          requestAnimationFrame(sendNextFrame);
        }
      };

      showToast('Đã mở webcam laptop thành công.', 'success');
    } catch (e) {
      showToast('Lỗi camera: ' + e.message, 'error');
      setActiveStreamType(STREAM_TYPES.NONE);
    }
  };

  const handleStartMJPEG = () => {
    const newTimestamp = Date.now();
    handleStopStream(streamTimestamp);
    setStreamTimestamp(newTimestamp);
    setActiveStreamType(STREAM_TYPES.MJPEG);
    pollStats();
    showToast('Bắt đầu truyền phát luồng video AI...', 'success');
  };

  const lastLogTimeRef = useRef(0);

  useEffect(() => {
    if (activeStreamType === STREAM_TYPES.NONE) {
      setIsAlertConfirmed(false);
      return;
    }

    setIsAlertConfirmed(!!stats.is_alerting);

    // Gửi log cảnh báo khi hệ thống báo động (is_alerting = True cho Lửa) HOẶC phát hiện khói (fire_level = 'warning')
    const hasAlarm = !!stats.is_alerting;
    const hasSmoke = stats.fire_level === 'warning';

    if (hasAlarm || hasSmoke) {
      const now = Date.now();
      if (now - lastLogTimeRef.current >= 10000) {
        lastLogTimeRef.current = now;
        
        let level = 'warning';
        let message = 'Hệ thống phát hiện khói bất thường tại khu vực giám sát!';
        
        if (hasAlarm) {
          level = 'emergency';
          message = 'BÁO ĐỘNG: Phát hiện có đám cháy bùng phát tại khu vực giám sát!';
          showToast(message, 'error');
        } else {
          showToast(message, 'warning');
        }
        
        logAlert(level, message)
          .then(() => refreshAlerts())
          .catch(() => {});
      }
    }
  }, [stats.is_alerting, stats.fire_level, activeStreamType]);

  useEffect(() => {
    if (isAlertConfirmed && activeStreamType !== STREAM_TYPES.NONE && !isMuted) {
      const fLevel = stats.fire_now > 0 ? (stats.fire_level || 'emergency') : 'warning';
      alarmRef.current?.start(fLevel);
    } else {
      alarmRef.current?.stop();
    }
    return () => alarmRef.current?.stop();
  }, [isAlertConfirmed, activeStreamType, isMuted, stats.fire_now, stats.fire_level]);

  const refreshAlerts = async () => {
    try {
      const history = await fetchAlertsHistory();
      setAlerts(history);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshAlerts();
    return () => {
      handleStopStream();
    };
  }, []);

  useEffect(() => {
    if (stats.is_alerting) {
      refreshAlerts();
    }
  }, [stats.is_alerting]);

  const handleClearAlertLogs = async () => {
    if (!window.confirm('Xóa lịch sử cảnh báo?')) return;
    try {
      const res = await clearAlertsHistory();
      if (res.ok) {
        setAlerts([]);
        showToast('Đã xóa sạch lịch sử cảnh báo.', 'info');
      }
    } catch {
      // ignore
    }
  };

  const getActiveStreamUrl = () => {
    const source = streamSource === 'custom' ? customUrl : streamSource;
    return `/api/stream?source=${encodeURIComponent(source)}&conf=${conf}&iou=${iou}${streamTimestamp ? `&t=${streamTimestamp}` : ''}`;
  };

  const handleFileSubmit = (file) => {
    if (!file.type.startsWith('video/')) {
      showToast('Vui lòng chỉ chọn file video.', 'error');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    uploadSampleVideo(file, {
      onProgress: setUploadProgress,
      onSuccess: () => {
        setUploading(false);
        showToast('Tải video mẫu thành công!', 'success');
        setStreamSource('videos/file.mp4');
      },
      onError: () => {
        setUploading(false);
        showToast('Không thể tải video mẫu lên máy chủ.', 'error');
      }
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true);
    else if (e.type === 'dragleave') setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileSubmit(e.dataTransfer.files[0]);
  };

  return {
    streamSource, setStreamSource,
    customUrl, setCustomUrl,
    activeStreamType,
    isMuted, setIsMuted,
    stats,
    isAlertConfirmed,
    uploading, uploadProgress,
    isDragActive,
    alerts, loadingAlerts,
    wsImage,
    videoRef, wsCapCanvasRef,
    handleStartWebSocket, handleStartMJPEG, handleStopStream,
    getActiveStreamUrl,
    handleFileSubmit, handleDrag, handleDrop,
    handleClearAlertLogs,
    logAlertQuiet: logAlert,
    STREAM_TYPES
  };
}
