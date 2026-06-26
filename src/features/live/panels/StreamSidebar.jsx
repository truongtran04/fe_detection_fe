import { Activity, Camera, Play, Square, Upload, Cpu } from 'lucide-react';
import { STREAM_TYPES } from '../constants.js';

export function StreamSidebar({
  streamSource, setStreamSource,
  customUrl, setCustomUrl,
  activeStreamType,
  uploading, uploadProgress,
  isDragActive,
  stats,
  handleStartWebSocket, handleStartMJPEG, handleStopStream,
  handleFileSubmit, handleDrag, handleDrop,
}) {
  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="glass-panel rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-2.5 pb-2 text-slate-200">
          <div className="p-2 bg-indigo-500/10 rounded-xl">
            <Camera className="w-5 h-5 text-indigo-400 shrink-0" />
          </div>
          <h2 className="font-bold text-sm">Nguồn Camera & AI</h2>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Chọn Luồng Vào:</label>
          <select
            value={streamSource}
            onChange={(e) => setStreamSource(e.target.value)}
            disabled={activeStreamType !== STREAM_TYPES.NONE}
            className="w-full bg-[#181a24] rounded-2xl px-3.5 py-3 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="browser-cam">📷 Camera của laptop</option>
            <option value="videos/file.mp4">🎞️ Video mẫu (file.mp4)</option>
            <option value="custom">🔗 Cổng RTSP / URL Tùy chọn</option>
          </select>
        </div>

        {streamSource === 'custom' && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Đường Dẫn RTSP:</label>
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="rtsp://192.168.1.x:554/stream"
              className="w-full bg-[#181a24] rounded-2xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
            />
          </div>
        )}

        {streamSource === 'videos/file.mp4' && (
          <div className="space-y-2.5 animate-fade-in">
            <label className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Tải Lên Video Mẫu Mới:</label>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-300 ${
                isDragActive ? 'border-indigo-400 bg-indigo-500/5' : 'border-[#27273a] hover:border-indigo-500/30'
              }`}
              onClick={() => document.getElementById('video-uploader').click()}
            >
              <input
                type="file"
                id="video-uploader"
                accept="video/mp4"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSubmit(e.target.files[0])}
              />
              <Upload className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
              <p className="text-[10px] font-semibold text-slate-300">Kéo thả hoặc Click để tải video lên</p>
              <p className="text-[9px] text-slate-500 mt-1">Hỗ trợ file .mp4</p>
            </div>
            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                  <span>Đang tải lên...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1 bg-[#181a24] rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-2">
          {activeStreamType === STREAM_TYPES.NONE ? (
            streamSource === 'browser-cam' ? (
              <button onClick={handleStartWebSocket} className="w-full md3-btn-primary py-3 px-4 rounded-full text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer">
                <Play className="w-3.5 h-3.5" /> Bật Webcam Trình Duyệt
              </button>
            ) : (
              <button onClick={handleStartMJPEG} className="w-full md3-btn-primary py-3 px-4 rounded-full text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer">
                <Play className="w-3.5 h-3.5" /> Khởi Động Stream AI
              </button>
            )
          ) : (
            <button onClick={handleStopStream} className="w-full md3-btn-secondary py-3 px-4 rounded-full text-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
              <Square className="w-3.5 h-3.5" /> Dừng Giám Sát Camera
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 pb-1 text-slate-200">
          <div className="p-2 bg-emerald-500/10 rounded-xl">
            <Activity className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <h2 className="font-bold text-sm">Chỉ Số Realtime</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center text-xs font-mono">
          <div className="bg-[#181a24] p-3 rounded-2xl shadow-inner">
            <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Frames</span>
            <span className="text-sm font-bold text-slate-200 mt-0.5 block">{stats.frame}</span>
          </div>
          <div className="bg-[#181a24] p-3 rounded-2xl shadow-inner">
            <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Nhận diện</span>
            <span className="text-sm font-bold text-slate-200 mt-0.5 block">{stats.total_detections}</span>
          </div>
          <div className="bg-[#181a24] p-3 rounded-2xl shadow-inner">
            <span className="text-[9px] text-red-400 block uppercase tracking-wider">🔥 Lửa Hiện Tại</span>
            <span className={`text-sm font-bold mt-0.5 block ${(stats.fire_now || 0) > 0 ? 'text-red-500' : 'text-slate-400'}`}>{stats.fire_now || 0}</span>
          </div>
          <div className="bg-[#181a24] p-3 rounded-2xl shadow-inner">
            <span className="text-[9px] text-amber-400 block uppercase tracking-wider">💨 Khói Hiện Tại</span>
            <span className={`text-sm font-bold mt-0.5 block ${(stats.smoke_now || 0) > 0 ? 'text-amber-500' : 'text-slate-400'}`}>{stats.smoke_now || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
