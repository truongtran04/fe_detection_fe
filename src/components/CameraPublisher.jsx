import React, { useRef, useState } from 'react';
import { Camera, RefreshCw, Zap, ShieldAlert, MonitorPlay, Settings, Info } from 'lucide-react';
import { useStreamPublisher } from '../hooks/useStreamPublisher.js';

export default function CameraPublisher({ conf = 0.25, iou = 0.45 }) {
  const [resolution, setResolution] = useState('640x360');
  const [quality, setQuality] = useState(0.55);
  
  const videoRef = useRef(null);
  
  const {
    isStreaming,
    wsStatus,
    sendFps,
    latency,
    annotatedImage,
    detections,
    fireLevel,
    isAlerting,
    startStream,
    stopStream
  } = useStreamPublisher({ conf, iou, resolution, quality });

  const handleToggleStream = async () => {
    if (isStreaming) {
      stopStream();
    } else {
      try {
        await startStream('camera', videoRef.current);
      } catch (err) {
        alert('Không thể mở camera: ' + err.message);
      }
    }
  };

  // Màu sắc trạng thái WebSocket
  const getStatusColor = () => {
    switch (wsStatus) {
      case 'connected': return 'text-emerald-400 bg-emerald-950/30 border-emerald-500/30';
      case 'connecting': return 'text-amber-400 bg-amber-950/30 border-amber-500/30';
      default: return 'text-rose-400 bg-rose-950/30 border-rose-500/30';
    }
  };

  // Màu sắc cấp độ cảnh báo hỏa hoạn
  const getAlertBadge = () => {
    if (!isAlerting) return 'text-slate-400 bg-slate-800/40';
    switch (fireLevel) {
      case 'emergency': return 'text-rose-500 bg-rose-950/50 border-rose-500 animate-pulse border';
      case 'moderate': return 'text-orange-500 bg-orange-950/40 border-orange-500/40 border';
      default: return 'text-amber-500 bg-amber-950/40 border-amber-500/40 border';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
      {/* Cột 1 & 2: Giao diện phát Video */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="relative aspect-video w-full rounded-3xl bg-slate-950 border border-slate-800/60 overflow-hidden shadow-2xl flex items-center justify-center group">
          <video
            ref={videoRef}
            className="hidden"
            playsInline
            muted
          />

          {/* Canvas vẽ ảnh live nhận diện từ server */}
          {isStreaming && annotatedImage ? (
            <img
              src={annotatedImage}
              className="w-full h-full object-contain"
              alt="Live Detection Stream"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-center p-8 z-10 transition-all duration-300">
              <div className="p-5 bg-gradient-to-tr from-slate-900 to-sky-950/60 rounded-full border border-sky-500/20 shadow-lg group-hover:scale-105 transition-transform">
                <Camera className="w-10 h-10 text-sky-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200">Đang tắt luồng Camera webcam</p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Nhấp vào nút khởi động để cấp quyền truy cập máy ảnh và bắt đầu truyền dữ liệu nhận diện thời gian thực.
                </p>
              </div>
            </div>
          )}

          {/* Lớp phủ thông số thời gian thực đè lên góc trên ảnh */}
          {isStreaming && (
            <div className="absolute top-4 left-4 flex gap-2 z-20">
              <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider px-3 py-1.5 rounded-full bg-slate-950/70 border border-slate-800 text-slate-200 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                LIVE WEB
              </span>
              <span className={`text-[10px] font-bold tracking-wider px-3 py-1.5 rounded-full border backdrop-blur-md ${getStatusColor()}`}>
                {wsStatus.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Nút bấm điều khiển chính */}
        <button
          onClick={handleToggleStream}
          className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 ${
            isStreaming
              ? 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-red-900/20'
              : 'bg-gradient-to-r from-sky-600 to-violet-700 hover:from-sky-500 hover:to-violet-600 text-white shadow-sky-950/40'
          }`}
        >
          {isStreaming ? (
            <>
              <span className="w-2 h-2 bg-white rounded-full animate-ping" />
              Dừng Live Camera Stream
            </>
          ) : (
            <>
              <MonitorPlay className="w-4 h-4" />
              Bắt Đầu Live Camera Stream
            </>
          )}
        </button>
      </div>

      {/* Cột 3: Dashboard Điều khiển & Thông số */}
      <div className="flex flex-col gap-6">
        {/* Panel Cấu hình */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-sky-400" /> Cấu hình truyền tải
          </h3>

          <div className="space-y-4">
            {/* Cấu hình Resolution */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block uppercase">Độ phân giải resize</label>
              <select
                value={resolution}
                disabled={isStreaming}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 disabled:opacity-50 transition-colors"
              >
                <option value="640x360">640 x 360 (Khuyên dùng - 16:9)</option>
                <option value="480x270">480 x 270 (Độ trễ thấp nhất)</option>
                <option value="1280x720">1280 x 720 (Độ nét cao - nặng)</option>
              </select>
            </div>

            {/* Cấu hình Nén JPEG */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase">
                <span>Chất lượng JPEG (Nén)</span>
                <span className="text-sky-400 font-mono text-xs">{quality}</span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.80"
                step="0.05"
                value={quality}
                disabled={isStreaming}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 disabled:opacity-50"
              />
              <span className="text-[9px] text-slate-600 block leading-tight">
                Giảm chất lượng nén xuống dưới 0.60 giúp tải gói tin nhẹ đi 60%, tăng đáng kể độ mượt mà.
              </span>
            </div>
          </div>
        </div>

        {/* Panel Dashboard Thống kê */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 shadow-xl flex-1 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" /> Thông số hiệu năng
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/70 border border-slate-800/40 rounded-2xl p-3 text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">FPS Gửi đi</span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
                {isStreaming ? sendFps : 0}
              </span>
              <span className="text-[8px] text-slate-600 font-bold">Mục tiêu: 15 FPS</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/40 rounded-2xl p-3 text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">Độ trễ (RTT)</span>
              <span className={`text-2xl font-black font-mono mt-1 block ${
                latency > 150 ? 'text-rose-400' : latency > 80 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {isStreaming ? `${latency}ms` : '0ms'}
              </span>
              <span className="text-[8px] text-slate-600 font-bold">Server phản hồi</span>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/40 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cảnh báo hệ thống</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getAlertBadge()}`}>
                {isAlerting ? fireLevel.toUpperCase() : 'BÌNH THƯỜNG'}
              </span>
            </div>

            <div className="flex justify-between items-center border-t border-slate-800/60 pt-2 text-xs">
              <span className="text-slate-500">Số vật thể phát hiện:</span>
              <span className="font-bold text-slate-300 font-mono">
                {isStreaming ? detections.length : 0}
              </span>
            </div>
          </div>

          {/* Dòng ghi chú thông tin */}
          <div className="mt-auto flex items-start gap-2 bg-sky-950/15 border border-sky-900/20 p-3 rounded-2xl">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-[9px] text-sky-400/80 leading-relaxed">
              Cơ chế truyền tải nhị phân tối ưu tích hợp bộ lọc backpressure: Frame tiếp theo chỉ được gửi khi server đã xử lý xong frame trước. Đảm bảo độ trễ tích tụ = 0ms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
