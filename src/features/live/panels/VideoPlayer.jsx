import { Camera, Film } from 'lucide-react';
import { STREAM_TYPES } from '../constants.js';

export function VideoPlayer({
  activeStreamType,
  videoRef,
  wsCapCanvasRef,
  getActiveStreamUrl,
  wsImage
}) {
  return (
    <div className="lg:col-span-3">
      <div className="glass-panel rounded-3xl p-6 flex flex-col h-full min-h-[420px]">
        <div className="flex justify-between items-center pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Film className="w-5 h-5 text-indigo-400" /> Luồng Live Camera Giám Sát
            </h3>
            <span className="text-[10px] text-slate-500 block mt-0.5">Nhận diện và khoanh vùng khói lửa theo thời gian thực từ camera kết nối.</span>
          </div>
          {activeStreamType !== STREAM_TYPES.NONE && (
            <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-bold bg-emerald-950/20 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-signal"></span>
              DANH SÁCH LIVE AI
            </div>
          )}
        </div>

        <div className="flex-1 bg-[#0b0c10] rounded-2xl flex items-center justify-center relative overflow-hidden min-h-[340px] shadow-inner">
          <video ref={videoRef} className="hidden" width="640" height="360" playsInline muted></video>
          <canvas ref={wsCapCanvasRef} className="hidden" width="640" height="360"></canvas>

          {activeStreamType === STREAM_TYPES.NONE && (
            <div className="text-center p-8 text-slate-600 flex flex-col items-center gap-3 animate-fade-in">
              <div className="p-4 bg-slate-900/40 rounded-full">
                <Camera className="w-10 h-10 text-slate-600 animate-pulse" />
              </div>
              <p className="text-xs font-bold text-slate-400">Chưa có luồng camera nào được kích hoạt</p>
              <p className="text-[10px] text-slate-600">Vui lòng thiết lập nguồn camera ở thanh bên trái và bấm Bắt đầu Stream.</p>
            </div>
          )}

          {activeStreamType === STREAM_TYPES.MJPEG && (
            <div className="w-full max-h-full aspect-video rounded-2xl overflow-hidden flex items-center justify-center bg-black">
              <img
                src={getActiveStreamUrl()}
                className="w-full h-full object-contain"
                alt="MJPEG Active Stream"
                onError={() => console.warn('MJPEG stream error or slow loading. Retrying...')}
              />
            </div>
          )}

          {activeStreamType === STREAM_TYPES.WEBSOCKET && (
            <div className="w-full max-h-full aspect-video rounded-2xl overflow-hidden flex items-center justify-center bg-black">
              {wsImage ? (
                <img src={wsImage} className="w-full h-full object-contain" alt="WebSocket Active Stream" />
              ) : (
                <div className="text-center p-6 text-slate-500 flex flex-col items-center gap-2 animate-fade-in">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-semibold">Đang liên kết thiết bị webcam...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
