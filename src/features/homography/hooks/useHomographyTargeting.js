import { useState, useEffect, useRef } from 'react';
import {
  DRAG_NONE,
  DRAG_PAN,
  CEILING_DRAG_CCTV,
  CEILING_DRAG_NOZZLE,
  CEILING_DRAG_FIRE,
  CEILING_DRAG_PAN,
  CLICK_RADIUS,
  DEFAULT_RAW_OUTPUT
} from '../constants.js';
import { buildRoomHomography, projectRealToPixel } from '../utils/homographyMath.js';
import { getMousePosOnCanvas, attachCanvasWheelZoom } from '../utils/canvasUtils.js';
import {
  getCctvImageLayout,
  imagePixelToCctvCanvas,
  cctvCanvasToImagePixel,
  getCctvCornerHitPos
} from '../utils/cctvCoords.js';
import {
  getCeilingCanvasSize,
  createCeilingMappers,
  clampCeilingPan
} from '../utils/ceilingCoords.js';
import { getInitialCorners, getScaledCeilingDefaults } from '../utils/calibrationDefaults.js';
import { fetchDemoImageBlob } from '../utils/demoImage.js';
import { drawCctvOverlay } from '../canvas/drawCctvOverlay.js';
import { drawCeilingView } from '../canvas/drawCeilingView.js';
import { useThreeSimulator } from './useThreeSimulator.js';
import { uploadSampleVideo } from '../../live/utils/videoUpload.js';

export function useHomographyTargeting({ conf, iou, showToast }) {
  const [roomW, setRoomW] = useState(6.0);
  const [roomL, setRoomL] = useState(6.0);
  const [roomH, setRoomH] = useState(3.0);
  const [camZ, setCamZ] = useState(3.0);
  const [nozZ, setNozZ] = useState(3.0);

  const [isDemoImage, setIsDemoImage] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ w: 640, h: 480 });
  const [imageSrc, setImageSrc] = useState('');
  const [fileBlob, setFileBlob] = useState(null);

  // Video Streaming States for Homography Calibration background
  const [streamSource, setStreamSource] = useState('videos/file.mp4');
  const [customUrl, setCustomUrl] = useState('');
  const [activeStreamType, setActiveStreamType] = useState('none'); // 'none' | 'mjpeg' | 'websocket'
  const [streamTimestamp, setStreamTimestamp] = useState(null);
  const [wsImage, setWsImage] = useState(null);

  const videoRef = useRef(null);
  const wsCapCanvasRef = useRef(null);
  const wsRef = useRef(null);

  // Upload progress states for custom calibration videos
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [corners, setCorners] = useState([
    { x: 80, y: 80 },
    { x: 560, y: 80 },
    { x: 600, y: 420 },
    { x: 40, y: 420 }
  ]);
  const [cctvPixel, setCctvPixel] = useState({ x: 136, y: 136 });
  const [nozzlePixel, setNozzlePixel] = useState({ x: 320, y: 240 });

  const [ceilingCctv, setCeilingCctv] = useState({ x: -2.0, y: 2.0 });
  const [ceilingNozzle, setCeilingNozzle] = useState({ x: 0.0, y: 0.0 });
  const [simulatedFire, setSimulatedFire] = useState({ x: 0.6, y: -0.6 });

  const [jsHInv, setJsHInv] = useState(null);
  const [targets, setTargets] = useState([]);
  const [rawOutput, setRawOutput] = useState(DEFAULT_RAW_OUTPUT);
  const [plot3d, setPlot3d] = useState(null);
  const [active3DTab, setActive3DTab] = useState('interactive');

  const [cctvReal, setCctvReal] = useState([0.0, 0.0]);
  const [nozzleReal, setNozzleReal] = useState([0.0, 0.0]);
  const [nearestCornerInfo, setNearestCornerInfo] = useState('');
  const [cameraOffset, setCameraOffset] = useState({ x: 0.0, y: 0.0 });

  const [ceilingZoom, setCeilingZoom] = useState(1.0);
  const [ceilingPan, setCeilingPan] = useState({ x: 0, y: 0 });
  const [lastCeilingMouse, setLastCeilingMouse] = useState({ x: 0, y: 0 });

  const [cctvZoom, setCctvZoom] = useState(1.0);
  const [cctvPan, setCctvPan] = useState({ x: 0, y: 0 });
  const [lastCctvMouse, setLastCctvMouse] = useState({ x: 0, y: 0 });

  const [loading, setLoading] = useState(false);
  const [serialCommand, setSerialCommand] = useState('');
  const [serialStatus, setSerialStatus] = useState('ESP32: Sẵn sàng');
  const [serialStatusClass, setSerialStatusClass] = useState('bg-[#0b0c10]/40 text-slate-400 border border-slate-800');
  const [esp32Ip, setEsp32Ip] = useState(() => {
    return localStorage.getItem('esp32_ip') || 'http://192.168.1.17';
  });
  const [pumpOn, setPumpOn] = useState(false);
  const [pumpLoading, setPumpLoading] = useState(false);
  const [targetingMode, setTargetingMode] = useState(() => {
    return localStorage.getItem('targeting_mode') || 'client';
  });
  const [autoPumpEnabled, setAutoPumpEnabled] = useState(() => {
    return localStorage.getItem('auto_pump_enabled') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('esp32_ip', esp32Ip);
  }, [esp32Ip]);

  useEffect(() => {
    localStorage.setItem('targeting_mode', targetingMode);
  }, [targetingMode]);

  useEffect(() => {
    localStorage.setItem('auto_pump_enabled', autoPumpEnabled);
  }, [autoPumpEnabled]);

  const [cctvDragIndex, setCctvDragIndex] = useState(DRAG_NONE);
  const [ceilingDragIndex, setCeilingDragIndex] = useState(DRAG_NONE);
  const [activeCornerCount, setActiveCornerCount] = useState(4);
  const [cctvInteractionMode, setCctvInteractionMode] = useState('points'); // 'points' | 'pan'

  const imageRef = useRef(null);
  const cctvCanvasRef = useRef(null);
  const ceilingCanvasRef = useRef(null);
  const ceilingWrapRef = useRef(null);
  const prevRoomWRef = useRef(roomW);
  const prevRoomLRef = useRef(roomL);

  const { threeContainerRef } = useThreeSimulator({
    roomW, roomL, roomH, camZ, nozZ, ceilingNozzle, ceilingCctv, simulatedFire, targets, isDemoImage, active3DTab
  });

  const resolveCctvLayout = () => {
    const canvas = cctvCanvasRef.current;
    if (!canvas) return null;
    const container = canvas.parentElement;
    const cW = container ? container.offsetWidth : canvas.width;
    const cH = container ? container.offsetHeight : canvas.height;
    return getCctvImageLayout(cW, cH, imageSize);
  };

  useEffect(() => {
    const prevW = parseFloat(prevRoomWRef.current) || 6.0;
    const prevL = parseFloat(prevRoomLRef.current) || 6.0;
    const currW = parseFloat(roomW);
    const currL = parseFloat(roomL);
    if (!isNaN(currW) && currW > 0 && !isNaN(currL) && currL > 0) {
      if (prevW !== currW || prevL !== currL) {
        const scaleW = currW / prevW;
        const scaleL = currL / prevL;
        setCeilingCctv(prev => ({ x: prev.x * scaleL, y: prev.y * scaleW }));
        setCeilingNozzle(prev => ({ x: prev.x * scaleL, y: prev.y * scaleW }));
        setSimulatedFire(prev => ({ x: prev.x * scaleL, y: prev.y * scaleW }));
        prevRoomWRef.current = currW;
        prevRoomLRef.current = currL;
      }
    }
  }, [roomW, roomL]);

  useEffect(() => {
    if (!imageLoaded || activeCornerCount < 4) return;
    const wVal = parseFloat(roomW);
    const lVal = parseFloat(roomL);
    if (isNaN(wVal) || wVal <= 0 || isNaN(lVal) || lVal <= 0) return;
    const { HInv } = buildRoomHomography(corners, wVal, lVal);
    setJsHInv(HInv);
    if (HInv) {
      setCctvPixel(projectRealToPixel(ceilingCctv.x, ceilingCctv.y, HInv));
      setNozzlePixel(projectRealToPixel(ceilingNozzle.x, ceilingNozzle.y, HInv));
    }
  }, [imageLoaded, corners, activeCornerCount, ceilingCctv, ceilingNozzle, roomW, roomL]);

  const handleStopStream = (sessionToStop = null) => {
    if (wsRef.current) wsRef.current.close();
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    
    const finalSession = (sessionToStop && (typeof sessionToStop === 'string' || typeof sessionToStop === 'number'))
      ? sessionToStop
      : null;
    
    if (finalSession || activeStreamType !== 'none') {
      const url = finalSession ? `/api/stop-stream?session_id=${finalSession}` : '/api/stop-stream';
      fetch(url, { method: 'POST' }).catch(() => {});
    }

    setActiveStreamType('none');
    setWsImage(null);
    setImageLoaded(false);
  };

  const handleStartWebSocket = async () => {
    handleStopStream(streamTimestamp);
    setActiveStreamType('websocket');

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

      // Giả lập kích thước ảnh khi camera load
      setImageSize({ w: 640, h: 360 });
      setCorners(getInitialCorners(640, 360));
      setImageLoaded(true);

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
        sendNextFrame();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) return;
          setWsImage(data.image);
          setImageSrc(data.image); // Gán ảnh đã được xử lý làm nền Homography
        } catch {
        }
        if (ws.readyState === WebSocket.OPEN) {
          requestAnimationFrame(sendNextFrame);
        }
      };

      showToast('Đã mở webcam laptop làm nền hiệu chuẩn.', 'success');
    } catch (e) {
      showToast('Lỗi camera: ' + e.message, 'error');
      setActiveStreamType('none');
    }
  };

  const handleStartMJPEG = () => {
    const newTimestamp = Date.now();
    handleStopStream(streamTimestamp);
    setStreamTimestamp(newTimestamp);
    setActiveStreamType('mjpeg');
    
    // Giả lập kích thước 16:9
    setImageSize({ w: 640, h: 360 });
    setCorners(getInitialCorners(640, 360));
    setImageLoaded(true);

    const source = streamSource === 'custom' ? customUrl : streamSource;
    const streamUrl = `/api/stream?source=${encodeURIComponent(source)}&conf=${conf}&iou=${iou}&t=${newTimestamp}`;
    setImageSrc(streamUrl);

    showToast('Bắt đầu truyền phát luồng video làm nền hiệu chuẩn...', 'success');
  };

  const getActiveStreamUrl = () => {
    const source = streamSource === 'custom' ? customUrl : streamSource;
    return `/api/stream?source=${encodeURIComponent(source)}&conf=${conf}&iou=${iou}${streamTimestamp ? `&t=${streamTimestamp}` : ''}`;
  };

  useEffect(() => {
    return () => {
      // Dọn dẹp luồng camera khi tắt Tab Homography
      if (wsRef.current) wsRef.current.close();
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleVideoUpload = (file) => {
    setUploading(true);
    setUploadProgress(0);
    uploadSampleVideo(file, {
      onProgress: (p) => setUploadProgress(p),
      onSuccess: () => {
        setUploading(false);
        showToast('Tải video mới thành công! Đang kết nối...', 'success');
        handleStartMJPEG();
      },
      onError: () => {
        setUploading(false);
        showToast('Lỗi khi tải video lên.', 'error');
      }
    });
  };

  useEffect(() => {
    setCamZ(roomH);
    setNozZ(roomH);
  }, [roomH]);

  const loadDemoImage = async () => {
    setLoading(true);
    setIsDemoImage(true);
    try {
      const blob = await fetchDemoImageBlob();
      setFileBlob(blob);
      setImageSrc(URL.createObjectURL(blob));
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoaded = (e) => {
    const img = e.target;
    const prevLoaded = imageLoaded;
    setImageLoaded(true);

    if (imageSize.w !== img.naturalWidth || imageSize.h !== img.naturalHeight) {
      setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
    }

    // Do NOT reset corners and calibration parameters if we are in streaming video mode
    if (!prevLoaded && activeStreamType === 'none') {
      setCorners(getInitialCorners(img.naturalWidth, img.naturalHeight));
      setCctvZoom(1.0);
      setCctvPan({ x: 0, y: 0 });
      setActiveCornerCount(4);
      setCctvInteractionMode('points');
      const defaults = getScaledCeilingDefaults(roomW, roomL);
      setCeilingCctv(defaults.ceilingCctv);
      setCeilingNozzle(defaults.ceilingNozzle);
      setSimulatedFire(defaults.simulatedFire);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsDemoImage(false);
      setFileBlob(file);
      setImageSrc(URL.createObjectURL(file));
      setImageLoaded(false);
      setTargets([]);
      showToast('Đã tải lên hình ảnh CCTV mới.', 'success');
    }
  };

  const resizeCanvasToImage = () => {
    const img = imageRef.current;
    const canvas = cctvCanvasRef.current;
    if (!img || !canvas) return;
    const rect = img.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      canvas.style.left = `${img.offsetLeft}px`;
      canvas.style.top = `${img.offsetTop}px`;
    }
  };

  useEffect(() => {
    const canvas = cctvCanvasRef.current;
    const img = imageRef.current;
    if (!canvas || !imageLoaded || !img) return;

    const layout = resolveCctvLayout();
    if (!layout) return;
    canvas.width = layout.cW;
    canvas.height = layout.cH;

    drawCctvOverlay(canvas.getContext('2d'), {
      layout,
      imageSize,
      cctvZoom,
      cctvPan,
      corners,
      cctvPixel,
      nozzlePixel,
      activeCornerCount
    });
  }, [corners, cctvPixel, nozzlePixel, imageSize, imageLoaded, cctvZoom, cctvPan, activeCornerCount]);

  useEffect(() => {
    const canvas = ceilingCanvasRef.current;
    if (!canvas) return;
    const { w, h } = getCeilingCanvasSize(ceilingWrapRef.current);
    canvas.width = w;
    canvas.height = h;

    const { roomToCeilingCanvas } = createCeilingMappers(roomW, roomL, ceilingZoom, ceilingPan);
    const result = drawCeilingView(canvas.getContext('2d'), w, h, {
      roomW,
      roomL,
      ceilingCctv,
      ceilingNozzle,
      simulatedFire,
      isDemoImage,
      roomToCeilingCanvas,
      targets
    });

    setCctvReal([ceilingCctv.x, ceilingCctv.y]);
    setNozzleReal([ceilingNozzle.x, ceilingNozzle.y]);
    setNearestCornerInfo(result.nearest.name);
    setCameraOffset(result.cameraOffset);
  }, [roomW, roomL, ceilingCctv, ceilingNozzle, simulatedFire, isDemoImage, ceilingZoom, ceilingPan, targets]);

  useEffect(() => {
    window.addEventListener('resize', resizeCanvasToImage);
    return () => window.removeEventListener('resize', resizeCanvasToImage);
  }, [imageLoaded]);

  useEffect(() => {
    const canvas = ceilingCanvasRef.current;
    if (!canvas) return;
    return attachCanvasWheelZoom(canvas, setCeilingZoom);
  }, []);

  useEffect(() => {
    const canvas = cctvCanvasRef.current;
    if (!canvas) return;
    return attachCanvasWheelZoom(canvas, setCctvZoom);
  }, [imageLoaded]);

  const handleCctvMouseDown = (e) => {
    if (!imageLoaded) return;
    const canvas = cctvCanvasRef.current;
    const layout = resolveCctvLayout();
    if (!layout) return;
    const pos = getMousePosOnCanvas(e, canvas);
    const { cW, cH } = layout;
    setLastCctvMouse({ x: pos.x, y: pos.y });

    if (cctvInteractionMode === 'pan') {
      if (activeCornerCount === 4) {
        for (let i = 0; i < 4; i++) {
          const pt = getCctvCornerHitPos(
            imagePixelToCctvCanvas(corners[i], layout, imageSize, cctvZoom, cctvPan),
            cW,
            cH
          );
          if (Math.hypot(pos.x - pt.x, pos.y - pt.y) <= CLICK_RADIUS) {
            setCctvDragIndex(i);
            return;
          }
        }
      }
      setCctvDragIndex(DRAG_PAN);
      return;
    }

    // In 'points' mode:
    if (activeCornerCount < 4) {
      const pixel = cctvCanvasToImagePixel(pos.x, pos.y, layout, imageSize, cctvZoom, cctvPan);
      const newCorners = [...corners];
      newCorners[activeCornerCount] = pixel;
      setCorners(newCorners);
      setCctvDragIndex(activeCornerCount);
      setActiveCornerCount(prev => prev + 1);
      return;
    }

    // Check if clicked directly on an existing corner point
    for (let i = 0; i < 4; i++) {
      const pt = getCctvCornerHitPos(
        imagePixelToCctvCanvas(corners[i], layout, imageSize, cctvZoom, cctvPan),
        cW,
        cH
      );
      if (Math.hypot(pos.x - pt.x, pos.y - pt.y) <= CLICK_RADIUS) {
        setCctvDragIndex(i);
        return;
      }
    }

    // Otherwise snap closest corner to clicked point
    const clickPixel = cctvCanvasToImagePixel(pos.x, pos.y, layout, imageSize, cctvZoom, cctvPan);
    let minDistance = Infinity;
    let closestIndex = 0;
    for (let i = 0; i < 4; i++) {
      const dist = Math.hypot(clickPixel.x - corners[i].x, clickPixel.y - corners[i].y);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    const newCorners = [...corners];
    newCorners[closestIndex] = clickPixel;
    setCorners(newCorners);
    setCctvDragIndex(closestIndex);
  };

  const handleCctvMouseMove = (e) => {
    if (cctvDragIndex === DRAG_NONE || !imageLoaded) return;
    const canvas = cctvCanvasRef.current;
    const layout = resolveCctvLayout();
    if (!layout) return;
    const pos = getMousePosOnCanvas(e, canvas);

    if (cctvDragIndex === DRAG_PAN) {
      const dx = pos.x - lastCctvMouse.x;
      const dy = pos.y - lastCctvMouse.y;
      setCctvPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastCctvMouse({ x: pos.x, y: pos.y });
      return;
    }

    const pixel = cctvCanvasToImagePixel(pos.x, pos.y, layout, imageSize, cctvZoom, cctvPan);
    const newCorners = [...corners];
    newCorners[cctvDragIndex] = pixel;
    setCorners(newCorners);
  };

  const handleCctvMouseUp = () => setCctvDragIndex(DRAG_NONE);

  const handleCeilingMouseDown = (e) => {
    const canvas = ceilingCanvasRef.current;
    const pos = getMousePosOnCanvas(e, canvas);
    setLastCeilingMouse({ x: pos.x, y: pos.y });

    const { roomToCeilingCanvas } = createCeilingMappers(roomW, roomL, ceilingZoom, ceilingPan);
    const ptCctv = roomToCeilingCanvas(ceilingCctv.x, ceilingCctv.y, canvas.width, canvas.height);
    const ptNozzle = roomToCeilingCanvas(ceilingNozzle.x, ceilingNozzle.y, canvas.width, canvas.height);
    const ptFire = roomToCeilingCanvas(simulatedFire.x, simulatedFire.y, canvas.width, canvas.height);

    if (isDemoImage && Math.hypot(pos.x - ptFire.cx, pos.y - ptFire.cy) <= CLICK_RADIUS + 4) {
      setCeilingDragIndex(CEILING_DRAG_FIRE);
      return;
    }
    if (Math.hypot(pos.x - ptCctv.cx, pos.y - ptCctv.cy) <= CLICK_RADIUS) {
      setCeilingDragIndex(CEILING_DRAG_CCTV);
      return;
    }
    if (Math.hypot(pos.x - ptNozzle.cx, pos.y - ptNozzle.cy) <= CLICK_RADIUS) {
      setCeilingDragIndex(CEILING_DRAG_NOZZLE);
      return;
    }
    setCeilingDragIndex(CEILING_DRAG_PAN);
  };

  const handleCeilingMouseMove = (e) => {
    if (ceilingDragIndex === DRAG_NONE) return;
    const canvas = ceilingCanvasRef.current;
    const pos = getMousePosOnCanvas(e, canvas);

    if (ceilingDragIndex === CEILING_DRAG_PAN) {
      const dx = pos.x - lastCeilingMouse.x;
      const dy = pos.y - lastCeilingMouse.y;
      setCeilingPan(prev => clampCeilingPan(prev, dx, dy, canvas.width, canvas.height, roomW, roomL, ceilingZoom));
      setLastCeilingMouse({ x: pos.x, y: pos.y });
      return;
    }

    const clampedMouseX = Math.max(0, Math.min(canvas.width, pos.x));
    const clampedMouseY = Math.max(0, Math.min(canvas.height, pos.y));
    const { ceilingCanvasToRoom } = createCeilingMappers(roomW, roomL, ceilingZoom, ceilingPan);
    const room = ceilingCanvasToRoom(clampedMouseX, clampedMouseY, canvas.width, canvas.height);

    if (ceilingDragIndex === CEILING_DRAG_CCTV) setCeilingCctv(room);
    else if (ceilingDragIndex === CEILING_DRAG_NOZZLE) setCeilingNozzle(room);
    else if (ceilingDragIndex === CEILING_DRAG_FIRE && isDemoImage) setSimulatedFire(room);
  };

  const handleCeilingMouseUp = () => setCeilingDragIndex(DRAG_NONE);

  const handleResetCalibration = () => {
    if (!imageSize?.w) return;
    setCorners(getInitialCorners(imageSize.w, imageSize.h));
    setActiveCornerCount(4);
    setCctvInteractionMode('points');
    const defaults = getScaledCeilingDefaults(roomW, roomL);
    setCeilingCctv(defaults.ceilingCctv);
    setCeilingNozzle(defaults.ceilingNozzle);
    setSimulatedFire(defaults.simulatedFire);
    setTargets([]);
    setCeilingZoom(1.0);
    setCeilingPan({ x: 0, y: 0 });
    setCctvZoom(1.0);
    setCctvPan({ x: 0, y: 0 });
    showToast('Đã khôi phục các điểm hiệu chuẩn mặc định.', 'info');
  };

  const handleStartSequentialPlacement = () => {
    if (!imageLoaded) return;
    setActiveCornerCount(0);
    setCctvInteractionMode('points');
    showToast('Vui lòng click 4 điểm trên ảnh để định vị 4 góc sàn (C1 -> C4).', 'info');
  };

  const handleProcessTargeting = async () => {
    if (!imageLoaded) return;
    if (activeCornerCount < 4) {
      showToast('Vui lòng chấm đủ 4 điểm hiệu chuẩn góc sàn trước khi thực hiện nhắm bắn.', 'warning');
      return;
    }
    setLoading(true);
    setRawOutput('Đang kết nối API xử lý ngắm bắn...');
    showToast('Đang phân tích định vị mục tiêu...', 'info');
    try {
      let fileToSend = fileBlob;
      if (!fileToSend && imageSrc) {
        const res = await fetch(imageSrc);
        fileToSend = await res.blob();
      }
      if (!fileToSend) {
        showToast('Không tìm thấy ảnh nền để phân tích.', 'error');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', fileToSend);
      formData.append('room_width', roomW);
      formData.append('room_length', roomL);
      formData.append('room_height', roomH);
      formData.append('corners_json', JSON.stringify(corners.map(c => [c.x, c.y])));
      formData.append('nozzle_json', JSON.stringify([nozzlePixel.x, nozzlePixel.y]));
      formData.append('cctv_json', JSON.stringify([cctvPixel.x, cctvPixel.y]));
      formData.append('nozzle_z', nozZ);
      formData.append('camera_z', camZ);
      formData.append('conf', conf);
      formData.append('iou', iou);
      formData.append('mock_detect', isDemoImage ? 'true' : 'false');
      formData.append('targeting_mode', targetingMode);
      formData.append('esp32_ip', esp32Ip);
      formData.append('auto_pump', autoPumpEnabled ? 'true' : 'false');
      if (isDemoImage && jsHInv) {
        const simPixel = projectRealToPixel(simulatedFire.x, simulatedFire.y, jsHInv);
        formData.append('simulated_fire_json', JSON.stringify([simPixel.x, simPixel.y]));
      }

      const res = await fetch('/api/process', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setTargets(data.targets || []);
        if (data.plot_3d) setPlot3d(data.plot_3d);
        if (data.targets?.length > 0) {
          const target = data.targets[0];
          setSerialCommand(target.serial);

          const logMsg =
            `[SUCCESS] Đã bắn mục tiêu hỏa hoạn!\n` +
            `- Lớp phát hiện: ${target.class_name}\n` +
            `- Tọa độ Oxy: [${target.real[0].toFixed(2)}, ${target.real[1].toFixed(2)}]m\n` +
            `- Góc Pan: ${Number(target.pan).toFixed(2)}° | Góc Tilt: ${Number(target.tilt).toFixed(2)}°\n` +
            `- Delta Pan: ${target.pan_dir || ''}${Number(target.pan_delta || 0).toFixed(1)}° | Delta Tilt: ${target.tilt_dir || ''}${Number(target.tilt_delta || 0).toFixed(1)}°\n` +
            `- Lệnh Serial gửi đi: ${target.serial}`;

          setRawOutput(logMsg);
          showToast('Nhắm bắn mục tiêu thành công!', 'success');

          if (targetingMode === 'server') {
            setSerialStatus(`Đã truyền (Server-side)`);
            setSerialStatusClass('bg-emerald-950/20 text-emerald-400 border border-emerald-900/20');
            showToast('Lệnh ngắm bắn đang được Server tự động truyền tới ESP32.', 'info');
          } else {
            // Tự động truyền lệnh điều khiển motor tới ESP32 qua API (Client-side)
            const cmd = target.serial;
            if (cmd) {
              setSerialStatus(`Đang gửi lệnh tới ESP32...`);
              setSerialStatusClass('bg-[#181a24] text-sky-400 border border-sky-900/50 animate-pulse');

              try {
                // 1. Tắt máy bơm nước trước khi xoay servo (tránh phun nước lung tung khi di chuyển)
                await fetch('/api/esp32/control', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    esp32_ip: esp32Ip,
                    action: 'pump',
                    status: 'off'
                  })
                });
                setPumpOn(false);

                // 2. Cập nhật trạng thái hiển thị
                setSerialStatus(`Đang xoay motor...`);
                setSerialStatusClass('bg-[#181a24] text-sky-400 border border-sky-900/50 animate-pulse');

                // 3. Gửi lệnh quay servo qua backend proxy (chờ cho tới khi xoay xong toàn bộ)
                const response = await fetch('/api/serial/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    command: cmd,
                    esp32_ip: esp32Ip
                  })
                });
                if (!response.ok) {
                  const errData = await response.json();
                  throw new Error(errData.detail || `HTTP error! status: ${response.status}`);
                }
                
                // 4. Bật máy bơm nước dập lửa sau khi đã quay xong mục tiêu (nếu được bật tự động)
                if (autoPumpEnabled) {
                  const pumpRes = await fetch('/api/esp32/control', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      esp32_ip: esp32Ip,
                      action: 'pump',
                      status: 'on'
                    })
                  });
                  if (pumpRes.ok) {
                    setPumpOn(true);
                    setSerialStatus(`Đã truyền & Bật bơm: ${cmd}`);
                  }
                } else {
                  setSerialStatus(`Đã truyền: ${cmd}`);
                }
                
                setSerialStatusClass('bg-emerald-950/20 text-emerald-400 border border-emerald-900/20');
                showToast('Đã đồng bộ lệnh điều khiển tới ESP32.', 'success');
              } catch (e) {
                setSerialStatus(`Lỗi gửi: ${e.message}`);
                setSerialStatusClass('bg-red-950/20 text-red-400 border border-red-900/20');
                showToast(`Lỗi truyền thông tới ESP32: ${e.message}`, 'error');
              }
            }
          }
        } else {
          setRawOutput('[SUCCESS] Hoàn thành phân tích: Không phát hiện ngọn lửa/khói nào.');
          showToast('Hoàn tất phân tích. Không phát hiện hỏa hoạn.', 'success');
        }
      } else {
        setRawOutput(`[ERROR] Phản hồi API lỗi: ${data.detail || 'Không rõ nguyên nhân'}`);
        showToast('Lỗi từ API ngắm bắn.', 'error');
      }
    } catch (e) {
      setRawOutput(`[ERROR] Lỗi kết nối Inference Server: ${e.message}`);
      showToast('Lỗi kết nối tới server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLog = () => {
    navigator.clipboard.writeText(rawOutput);
    showToast('Đã sao chép log ngắm bắn!', 'success');
  };

  const handleSendSerialMock = async () => {
    if (!serialCommand) return;
    setSerialStatus('Đang gửi lệnh serial...');
    setSerialStatusClass('bg-[#181a24] text-sky-400 border border-sky-900/50 animate-pulse');
    try {
      const res = await fetch('/api/serial/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: serialCommand, esp32_ip: esp32Ip })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setSerialStatus(`Đã truyền: ${serialCommand}`);
        setSerialStatusClass('bg-emerald-950/20 text-emerald-400 border border-emerald-900/20');
        showToast('Lệnh điều khiển servo đã được truyền đi!', 'success');
      } else {
        setSerialStatus(`Lỗi gửi: ${data.detail || 'Cổng bị chiếm'}`);
        setSerialStatusClass('bg-red-950/20 text-red-400 border border-red-900/20');
        showToast('Lỗi truyền thông Serial.', 'error');
      }
    } catch (e) {
      setSerialStatus(`Lỗi kết nối: ${e.message}`);
      setSerialStatusClass('bg-red-950/20 text-red-400 border border-red-900/20');
      showToast('Lỗi kết nối Serial.', 'error');
    }
  };

  const handleResetServo = async () => {
    try {
      const url = esp32Ip
        ? `/api/servo/reset?esp32_ip=${encodeURIComponent(esp32Ip)}`
        : '/api/servo/reset';
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setPumpOn(false);
        setSerialCommand(data.serial);
        setRawOutput(
          `[SERVO RESET] Servo đã quay về gốc (0°, 0°)\n` +
          `- Vị trí trước: Pan=${data.previous_pan}°, Tilt=${data.previous_tilt}°\n` +
          `- Lệnh Serial: ${data.serial}`
        );
        showToast('Servo đã reset về vị trí gốc (0°, 0°).', 'success');
      } else {
        showToast('Lỗi reset servo.', 'error');
      }
    } catch (e) {
      showToast(`Lỗi kết nối: ${e.message}`, 'error');
    }
  };

  const handleTogglePump = async () => {
    if (!esp32Ip) {
      showToast('Vui lòng nhập IP ESP32.', 'warning');
      return;
    }
    const nextStatus = !pumpOn;
    setPumpOn(nextStatus);
    setPumpLoading(true);
    try {
      const response = await fetch('/api/esp32/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          esp32_ip: esp32Ip,
          action: 'pump',
          status: nextStatus ? 'on' : 'off'
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || `HTTP error! status: ${response.status}`);
      }
      showToast(`Mô tơ đã được ${nextStatus ? 'bật' : 'tắt'}!`, 'success');
    } catch (err) {
      setPumpOn(!nextStatus);
      showToast(`Lỗi kết nối tới ESP32: ${err.message}`, 'error');
    } finally {
      setPumpLoading(false);
    }
  };

  useEffect(() => {
    loadDemoImage();
  }, []);

  const resetCeilingView = () => {
    setCeilingZoom(1.0);
    setCeilingPan({ x: 0, y: 0 });
  };

  const resetCctvView = () => {
    setCctvZoom(1.0);
    setCctvPan({ x: 0, y: 0 });
  };

  return {
    roomW, setRoomW,
    roomL, setRoomL,
    roomH, setRoomH,
    camZ, setCamZ,
    nozZ, setNozZ,
    imageLoaded,
    imageSize,
    imageSrc,
    ceilingZoom,
    ceilingPan,
    cctvZoom,
    cctvPan,
    cctvDragIndex,
    DRAG_NONE,
    nearestCornerInfo,
    cameraOffset,
    nozzleReal,
    loading,
    targets,
    rawOutput,
    plot3d,
    active3DTab,
    setActive3DTab,
    serialCommand,
    serialStatus,
    serialStatusClass,
    imageRef,
    cctvCanvasRef,
    ceilingCanvasRef,
    ceilingWrapRef,
    threeContainerRef,
    loadDemoImage,
    handleFileUpload,
    handleImageLoaded,
    handleCctvMouseDown,
    handleCctvMouseMove,
    handleCctvMouseUp,
    handleCeilingMouseDown,
    handleCeilingMouseMove,
    handleCeilingMouseUp,
    handleResetCalibration,
    handleProcessTargeting,
    handleCopyLog,
    handleSendSerialMock,
    handleResetServo,
    resetCeilingView,
    resetCctvView,
    singleTarget: targets.length > 0 ? targets[0] : null,
    esp32Ip, setEsp32Ip,
    pumpOn, setPumpOn,
    pumpLoading, handleTogglePump,
    targetingMode, setTargetingMode,
    autoPumpEnabled, setAutoPumpEnabled,
    activeCornerCount, setActiveCornerCount,
    cctvInteractionMode, setCctvInteractionMode,
    handleStartSequentialPlacement,
    
    // Video streaming states/handlers for calibration background
    streamSource, setStreamSource,
    customUrl, setCustomUrl,
    activeStreamType,
    handleStartWebSocket, handleStartMJPEG, handleStopStream,
    videoRef, wsCapCanvasRef,
    uploading, uploadProgress, handleVideoUpload
  };
}
