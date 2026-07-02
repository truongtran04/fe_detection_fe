import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook quản lý kết nối WebSocket và truyền tải frame ảnh dạng nhị phân từ trình duyệt lên FastAPI.
 * @param {object} options 
 * @param {number} options.conf - Confidence threshold cho YOLO
 * @param {number} options.iou - IoU threshold cho YOLO
 * @param {string} options.resolution - Kích thước resize (ví dụ: '640x360', '480x270')
 * @param {number} options.quality - Chất lượng nén ảnh JPEG (0.0 đến 1.0)
 */
export function useStreamPublisher({ conf = 0.25, iou = 0.45, resolution = '640x360', quality = 0.50 } = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [wsStatus, setWsStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected'
  const [sendFps, setSendFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [annotatedImage, setAnnotatedImage] = useState(null);
  const [detections, setDetections] = useState([]);
  const [fireLevel, setFireLevel] = useState('none');
  const [isAlerting, setIsAlerting] = useState(false);

  const wsRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas')); // Canvas ẩn để thực hiện resize
  const streamIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  // Cơ chế Backpressure: Chỉ gửi frame tiếp theo khi backend đã xử lý xong và phản hồi frame trước đó
  const isWaitingForAck = useRef(false);
  const frameSentTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  const fpsLastCheckedRef = useRef(Date.now());

  const stopStream = useCallback(() => {
    setIsStreaming(false);
    isWaitingForAck.current = false;
    
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      videoRef.current.pause();
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setWsStatus('disconnected');
    setSendFps(0);
    setLatency(0);
    setAnnotatedImage(null);
    setDetections([]);
    setFireLevel('none');
    setIsAlerting(false);
  }, []);

  const connectWebSocket = useCallback((mediaStream) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    setWsStatus('connecting');
    const loc = window.location;
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Sử dụng IP/Host hiện tại của Web Client để kết nối đồng bộ
    const host = loc.host;
    const wsUrl = `${protocol}//${host}/api/ws/predict?conf=${conf}&iou=${iou}`;
    
    console.log(`🔌 [PUBLISHER WS] Dang ket noi toi: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('connected');
      console.log('📡 [PUBLISHER WS] Da ket noi thanh cong!');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) return;

        // Reset khóa gửi frame (Nhận được ACK từ Backend)
        isWaitingForAck.current = false;
        
        // Tính độ trễ RTT (Round Trip Time) từ lúc gửi đến lúc nhận phản hồi
        if (frameSentTimeRef.current > 0) {
          const rtt = Date.now() - frameSentTimeRef.current;
          setLatency(rtt);
        }

        if (data.image) {
          setAnnotatedImage(data.image);
        }
        setDetections(data.detections || []);
        setFireLevel(data.fire_level || 'none');
        setIsAlerting(data.is_alerting || false);
      } catch (err) {
        console.error('Lỗi phân giải tin nhắn WebSocket:', err);
      }
    };

    ws.onerror = (e) => {
      console.error('Lỗi kết nối WebSocket:', e);
      setWsStatus('disconnected');
    };

    ws.onclose = () => {
      setWsStatus('disconnected');
      // Tự động kết nối lại sau 3s nếu người dùng chưa bấm Stop Stream
      if (isStreaming) {
        console.log('WebSocket publisher đóng. Đang thử kết nối lại sau 3s...');
        reconnectTimeoutRef.current = setTimeout(() => connectWebSocket(mediaStream), 3000);
      }
    };
  }, [conf, iou, isStreaming]);

  const startStream = useCallback(async (type, localVideoElement) => {
    stopStream();
    setIsStreaming(true);
    
    videoRef.current = localVideoElement;
    let stream = null;

    try {
      if (type === 'camera') {
        // Lấy luồng camera từ webcam
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: 1.7777777778
          }
        });
        if (localVideoElement) {
          localVideoElement.srcObject = stream;
          localVideoElement.play().catch(e => console.error("Lỗi play video webcam:", e));
        }
      } else if (type === 'video') {
        // Play video mẫu có sẵn trong thẻ
        if (localVideoElement) {
          localVideoElement.play().catch(e => console.error("Lỗi play video mẫu:", e));
        }
      }

      // Kết nối WebSocket
      connectWebSocket(stream);

      // Giải mã kích thước mong muốn từ cấu hình
      const [targetW, targetH] = resolution.split('x').map(Number);

      // Khởi động luồng chụp frame (Mục tiêu 15 FPS -> ~66ms một lần)
      streamIntervalRef.current = setInterval(() => {
        const video = videoRef.current;
        const ws = wsRef.current;
        const canvas = canvasRef.current;
        
        if (!video || !ws || ws.readyState !== WebSocket.OPEN) return;
        
        // Khóa Backpressure: Bỏ qua frame nếu frame trước đó chưa chạy xong
        if (isWaitingForAck.current) {
          return;
        }

        // Vẽ và resize trực tiếp lên canvas ẩn
        canvas.width = targetW || 640;
        canvas.height = targetH || 360;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Đánh dấu đã gửi và chuẩn bị gửi dữ liệu nhị phân (Binary Blob)
        isWaitingForAck.current = true;
        frameSentTimeRef.current = Date.now();
        
        canvas.toBlob((blob) => {
          if (blob && ws.readyState === WebSocket.OPEN) {
            blob.arrayBuffer().then((buf) => {
              if (ws.readyState === WebSocket.OPEN) {
                // Gửi ArrayBuffer nhị phân của ảnh JPEG đã nén
                ws.send(buf);
                frameCountRef.current += 1;
                
                // Tính toán FPS gửi thực tế mỗi 1 giây
                const now = Date.now();
                const diff = now - fpsLastCheckedRef.current;
                if (diff >= 1000) {
                  setSendFps(Math.round((frameCountRef.current * 1000) / diff));
                  frameCountRef.current = 0;
                  fpsLastCheckedRef.current = now;
                }
              } else {
                isWaitingForAck.current = false;
              }
            }).catch(() => {
              isWaitingForAck.current = false;
            });
          } else {
            isWaitingForAck.current = false;
          }
        }, 'image/jpeg', quality);

      }, 66); // Giới hạn tần suất kéo frame ở mức tối thiểu 66ms (~15 FPS)

    } catch (err) {
      console.error('Lỗi khi mở luồng stream:', err);
      setIsStreaming(false);
      throw err;
    }
  }, [connectWebSocket, resolution, quality, stopStream]);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  return {
    isStreaming,
    wsStatus,
    sendFps,
    latency,
    annotatedImage,
    detections,
    fireLevel,
    isAlerting,
    startStream,
    stopStream,
  };
}
