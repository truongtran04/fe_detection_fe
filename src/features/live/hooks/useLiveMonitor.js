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

  const consecutiveDangerFramesRef = useRef(0);
  const lastAlertLoggedTimeRef = useRef(0);
  const safeStartTimeRef = useRef(0);
  const safetyAlertLoggedRef = useRef(true);
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
    const url = finalSession ? `/api/stop-stream?session_id=${finalSession}` : '/api/stop-stream';
    fetch(url, { method: 'POST' }).catch(() => {});

    setActiveStreamType(STREAM_TYPES.NONE);
    setWsImage(null);
    setStats(EMPTY_STATS());
    setIsAlertConfirmed(false);
  };

  const handleStartWebSocket = async () => {
    handleStopStream(streamTimestamp);
    setActiveStreamType(STREAM_TYPES.WEBSOCKET);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const loc = window.location;
      const wsProtocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${loc.host}/api/ws/predict?conf=${conf}&iou=${iou}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

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
            fire_level: data.fire_level || "none",
            is_active: true
          }));
        } catch {
          // ignore malformed frames
        }
      };

      captureIntervalRef.current = setInterval(() => {
        const video = videoRef.current;
        const canvas = wsCapCanvasRef.current;
        if (!video || !canvas || ws.readyState !== WebSocket.OPEN) return;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, 640, 480);
        canvas.toBlob((blob) => {
          if (blob && ws.readyState === WebSocket.OPEN) {
            blob.arrayBuffer().then(buf => ws.send(buf));
          }
        }, 'image/jpeg', 0.65);
      }, 120);

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

  useEffect(() => {
    if (activeStreamType === STREAM_TYPES.NONE) {
      consecutiveDangerFramesRef.current = 0;
      lastAlertLoggedTimeRef.current = 0;
      safeStartTimeRef.current = 0;
      safetyAlertLoggedRef.current = true;
      setIsAlertConfirmed(false);
      return;
    }

    const hasDangerNow = stats.fire_now > 0 || stats.smoke_now > 0;
    if (hasDangerNow) {
      // Khi phát hiện nguy hiểm, reset trạng thái an toàn
      safeStartTimeRef.current = 0;
      safetyAlertLoggedRef.current = false;

      consecutiveDangerFramesRef.current += 1;
      const threshold = DANGER_FRAME_THRESHOLD[activeStreamType] ?? 2;
      if (consecutiveDangerFramesRef.current >= threshold) {
        setIsAlertConfirmed(true);
        
        const now = Date.now();
        // Cảnh báo ngay lập tức nếu là lần đầu tiên phát hiện nguy hiểm (lastAlertLoggedTimeRef.current === 0)
        // hoặc cảnh báo định kỳ mỗi 10 giây (10000 ms)
        if (lastAlertLoggedTimeRef.current === 0 || (now - lastAlertLoggedTimeRef.current >= 10000)) {
          let alertLevel = 'warning';
          let alertMsg = 'CẢNH BÁO: Phát hiện có khói bốc lên.';
          
          if (stats.fire_now > 0) {
            const fLevel = stats.fire_level || 'early';
            if (fLevel === 'emergency') {
              alertLevel = 'emergency';
              alertMsg = 'HỎA HOẠN KHẨN CẤP: Cháy lớn lan rộng hoặc bùng phát cực nhanh! Hãy sơ tán lập tức và gọi 114!';
            } else if (fLevel === 'moderate') {
              alertLevel = 'warning';
              alertMsg = 'BÁO ĐỘNG ĐỎ: Phát hiện đám cháy vừa (Diện tích từ 3% đến 12%). Hãy khẩn trương dập tắt!';
            } else {
              alertLevel = 'warning';
              alertMsg = 'CẢNH BÁO SỚM: Đám lửa nhỏ mới bùng phát (Diện tích < 3%). Vui lòng kiểm soát ngay!';
            }
          }
          logAlert(alertLevel, alertMsg);
          lastAlertLoggedTimeRef.current = now;
        }
      }
    } else {
      // Khi an toàn trở lại
      consecutiveDangerFramesRef.current = 0;
      setIsAlertConfirmed(false);
      lastAlertLoggedTimeRef.current = 0;

      // Nếu bắt đầu chuyển sang trạng thái an toàn
      if (safeStartTimeRef.current === 0) {
        safeStartTimeRef.current = Date.now();
      } else {
        const now = Date.now();
        // Nếu đã duy trì an toàn liên tục hơn 60 giây (60000 ms) và chưa gửi log an toàn
        if (now - safeStartTimeRef.current >= 60000 && !safetyAlertLoggedRef.current) {
          logAlert(
            'normal',
            'An toàn: Không còn phát hiện dấu hiệu cháy trong 1 phút qua. Hệ thống trở lại bình thường.'
          );
          safetyAlertLoggedRef.current = true;
        }
      }
    }
  }, [stats, activeStreamType]);

  useEffect(() => {
    if (isAlertConfirmed && activeStreamType !== STREAM_TYPES.NONE && !isMuted) {
      const fLevel = stats.fire_now > 0 ? (stats.fire_level || 'early') : 'warning';
      alarmRef.current?.start(fLevel);
    } else {
      alarmRef.current?.stop();
    }
    return () => alarmRef.current?.stop();
  }, [isAlertConfirmed, activeStreamType, isMuted, stats.fire_now, stats.fire_level]);

  const refreshAlerts = async () => {
    setAlerts(await fetchAlertsHistory());
  };

  useEffect(() => {
    refreshAlerts();
    alertsIntervalRef.current = setInterval(refreshAlerts, 3000);
    return () => {
      clearInterval(alertsIntervalRef.current);
      handleStopStream();
    };
  }, []);

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
