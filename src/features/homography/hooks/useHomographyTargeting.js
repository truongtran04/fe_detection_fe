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
  const [serialStatus, setSerialStatus] = useState('Cổng ảo Serial: Sẵn sàng');
  const [serialStatusClass, setSerialStatusClass] = useState('bg-[#0b0c10] text-slate-400');

  const [cctvDragIndex, setCctvDragIndex] = useState(DRAG_NONE);
  const [ceilingDragIndex, setCeilingDragIndex] = useState(DRAG_NONE);

  const imageRef = useRef(null);
  const cctvCanvasRef = useRef(null);
  const ceilingCanvasRef = useRef(null);
  const ceilingWrapRef = useRef(null);
  const prevRoomWRef = useRef(roomW);
  const prevRoomLRef = useRef(roomL);

  const { threeContainerRef } = useThreeSimulator({
    roomW, roomL, roomH, camZ, nozZ, ceilingNozzle, ceilingCctv, simulatedFire, targets, isDemoImage
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
    const prevW = prevRoomWRef.current;
    const prevL = prevRoomLRef.current;
    if (prevW !== roomW || prevL !== roomL) {
      const scaleW = roomW / (prevW || 1);
      const scaleL = roomL / (prevL || 1);
      setCeilingCctv(prev => ({ x: prev.x * scaleL, y: prev.y * scaleW }));
      setCeilingNozzle(prev => ({ x: prev.x * scaleL, y: prev.y * scaleW }));
      setSimulatedFire(prev => ({ x: prev.x * scaleL, y: prev.y * scaleW }));
      prevRoomWRef.current = roomW;
      prevRoomLRef.current = roomL;
    }
  }, [roomW, roomL]);

  useEffect(() => {
    if (!imageLoaded) return;
    const { HInv } = buildRoomHomography(corners, roomW, roomL);
    setJsHInv(HInv);
    if (HInv) {
      setCctvPixel(projectRealToPixel(ceilingCctv.x, ceilingCctv.y, HInv));
      setNozzlePixel(projectRealToPixel(ceilingNozzle.x, ceilingNozzle.y, HInv));
    }
  }, [imageLoaded, corners, ceilingCctv, ceilingNozzle, roomW, roomL]);

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
    setImageLoaded(true);
    setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
    setCorners(getInitialCorners(img.naturalWidth, img.naturalHeight));
    setCctvZoom(1.0);
    setCctvPan({ x: 0, y: 0 });
    const defaults = getScaledCeilingDefaults(roomW, roomL);
    setCeilingCctv(defaults.ceilingCctv);
    setCeilingNozzle(defaults.ceilingNozzle);
    setSimulatedFire(defaults.simulatedFire);
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
      nozzlePixel
    });
  }, [corners, cctvPixel, nozzlePixel, imageSize, imageLoaded, cctvZoom, cctvPan]);

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
      roomToCeilingCanvas
    });

    setCctvReal([ceilingCctv.x, ceilingCctv.y]);
    setNozzleReal([ceilingNozzle.x, ceilingNozzle.y]);
    setNearestCornerInfo(result.nearest.name);
    setCameraOffset(result.cameraOffset);
  }, [roomW, roomL, ceilingCctv, ceilingNozzle, simulatedFire, isDemoImage, ceilingZoom, ceilingPan]);

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
    setCctvDragIndex(DRAG_PAN);
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

  const handleProcessTargeting = async () => {
    if (!imageLoaded) return;
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
          setSerialCommand(data.targets[0].serial);
          setRawOutput(
            `[SUCCESS] Đã bắn mục tiêu hỏa hoạn!\n` +
            `- Lớp phát hiện: ${data.targets[0].class_name}\n` +
            `- Tọa độ Oxy: [${data.targets[0].real[0].toFixed(2)}, ${data.targets[0].real[1].toFixed(2)}]m\n` +
            `- Góc Pan: ${data.targets[0].pan}° | Góc Tilt: ${data.targets[0].tilt}°\n` +
            `- Delta Pan: ${data.targets[0].pan_dir || ''}${data.targets[0].pan_delta || 0}° | Delta Tilt: ${data.targets[0].tilt_dir || ''}${data.targets[0].tilt_delta || 0}°\n` +
            `- Lệnh Serial gửi đi: ${data.targets[0].serial}`
          );
          showToast('Nhắm bắn mục tiêu thành công!', 'success');
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
    setSerialStatusClass('bg-[#181a24] text-indigo-400 border border-indigo-900/50 animate-pulse');
    try {
      const res = await fetch('/api/serial/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: serialCommand })
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
      const res = await fetch('/api/servo/reset', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
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
    singleTarget: targets.length > 0 ? targets[0] : null
  };
}
