import React, { useRef, useState, useEffect } from 'react';
import { Film, Settings, Zap, Info, Play, Pause, Square, Upload } from 'lucide-react';
import { useStreamPublisher } from '../hooks/useStreamPublisher.js';

export default function VideoPublisher({ conf = 0.25, iou = 0.45 }) {
  const [resolution, setResolution] = useState('640x360');
  const [quality, setQuality] = useState(0.55);
  const [videoSrc, setVideoSrc] = useState('static/videos/sample.mp4'); // Default fallback path
  const [isPlaying, setIsPlaying] = useState(false);
  
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const handleStartStream = async () => {
    if (isStreaming) return;
    try {
      await startStream('video', videoRef.current);
      setIsPlaying(true);
    } catch (err) {
      alert('Không thể phát video mẫu: ' + err.message);
    }
  };

  const handleStopStream = () => {
    stopStream();
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current || !isStreaming) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(e => console.error(e));
      setIsPlaying(true);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      handleStopStream(); // Reset stream state if a new file is uploaded
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
            src={videoSrc}
            className="hidden"
            playsInline
            loop
            muted
          />

          {/* Hiển thị frame ảnh live nhận diện từ server */}
          {isStreaming && annotatedImage ? (
            <img
              src={annotatedImage}
              className="w-full h-full object-contain"
              alt="Live Video Stream"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-center p-8 z-10">
              <div className="p-5 bg-gradient-to-tr from-slate-900 to-sky-950/60 rounded-full border border-sky-500/20 shadow-lg group-hover:scale-105 transition-transform">
                <Film className="w-10 h-10 text-sky-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200">Đang tắt luồng video mẫu</p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Chọn video mẫu từ máy tính hoặc bấm "Bắt Đầu" để phát luồng mp4 giả lập nguồn camera.
                </p>
              </div>
            </div>
          )}

          {/* Lớp phủ trạng thái */}
          {isStreaming && (
            <div className="absolute top-4 left-4 flex gap-2 z-20">
              <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider px-3 py-1.5 rounded-full bg-slate-950/70 border border-slate-800 text-slate-200 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SIMULATED MP4
              </span>
              <span className={`text-[10px] font-bold tracking-wider px-3 py-1.5 rounded-full border backdrop-blur-md ${getStatusColor()}`}>
                {wsStatus.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Cụm nút bấm điều khiển phát/dừng */}
        <div className="flex gap-3">
          {!isStreaming ? (
            <button
              onClick={handleStartStream}
              className="flex-1 py-4 bg-gradient-to-r from-sky-600 to-violet-700 hover:from-sky-500 hover:to-violet-600 text-white rounded-2xl font-bold text-sm tracking-wide shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> Bắt Đầu Stream Video
            </button>
          ) : (
            <>
              <button
                onClick={handlePlayPause}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold text-sm tracking-wide shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 border border-slate-700/60"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 text-amber-400" /> Tạm dừng phát
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-emerald-400" /> Tiếp tục phát
                  </>
                )}
              </button>
              <button
                onClick={handleStopStream}
                className="py-4 px-6 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white rounded-2xl font-bold text-sm tracking-wide shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Square className="w-4 h-4" /> Dừng
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cột 3: Dashboard Cấu hình & Trạng thái */}
      <div className="flex flex-col gap-6">
        {/* Nạp Video từ máy tính */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-sky-400" /> Chọn nguồn video
          </h3>
          
          <input
            type="file"
            ref={fileInputRef}
            accept="video/mp4, video/x-m4v, video/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            className="w-full py-3 bg-slate-950/80 hover:bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Upload className="w-3.5 h-3.5" /> Tải lên video MP4 mẫu
          </button>
          <span className="text-[9px] text-slate-500 text-center block">
            Hỗ trợ file định dạng MP4/H.264 nhẹ cho tốc độ giải mã nhanh nhất.
          </span>
        </div>

        {/* Panel Cấu hình */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-sky-400" /> Cấu hình truyền tải
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block uppercase">Độ phân giải resize</label>
              <select
                value={resolution}
                disabled={isStreaming}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 disabled:opacity-50 transition-colors"
              >
                <option value="640x360">640 x 360 (Khuyên dùng - 16:9)</option>
                <option value="480x270">480 x 270 (Độ trễ siêu thấp)</option>
                <option value="1280x720">1280 x 720 (Độ nét cao - nặng)</option>
              </select>
            </div>

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

          <div className="mt-auto flex items-start gap-2 bg-sky-950/15 border border-sky-900/20 p-3 rounded-2xl">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-[9px] text-sky-400/80 leading-relaxed">
              Bạn có thể pause/play video để dừng tạm thời luồng phân tích. Hệ thống tự động skip frame khi pause để chống tràn buffer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
