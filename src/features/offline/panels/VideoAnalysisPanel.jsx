import { AlertCircle, CheckCircle, Download, RefreshCw, Upload } from 'lucide-react';

export function VideoAnalysisPanel({
  videoFile, videoPreview, videoStatus, videoProgress,
  videoDownloadUrl, videoError,
  handleVideoChange, handleVideoProcess
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-10 gap-6 text-left">
      <div className="space-y-4 md:col-span-3">
        <h3 className="text-slate-200 font-bold text-sm">Tải Video Lên</h3>

        <div className="border-2 border-dashed border-[#27273a] hover:border-indigo-500/30 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center justify-center bg-[#181a24] text-center min-h-[220px] relative">
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            disabled={videoStatus === 'pending' || videoStatus === 'processing'}
            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <Upload className="w-8 h-8 text-indigo-400 mb-3" />
          <span className="text-xs font-semibold text-slate-300">Click hoặc kéo thả file video</span>
          <span className="text-[10px] text-slate-500 mt-1">Định dạng MP4, AVI, MOV tối đa 100MB</span>
        </div>

        {videoPreview && (
          <div className="bg-[#181a24] p-4 rounded-2xl space-y-4 shadow-inner">
            <div className="flex items-center justify-between gap-4">
              <div className="overflow-hidden">
                <span className="text-xs text-slate-200 font-medium truncate block">{videoFile?.name}</span>
                <span className="text-[10px] text-slate-500 block">{(videoFile?.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              {(videoStatus === 'none' || videoStatus === 'failed') && (
                <button onClick={handleVideoProcess} className="md3-btn-primary py-2.5 px-4 rounded-full text-xs shadow-md transition">
                  Bắt Đầu Xử Lý
                </button>
              )}
            </div>

            {videoStatus !== 'none' && (
              <div className="space-y-2 pt-2 text-left animate-fade-in">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400 flex items-center gap-1.5 text-[10px] tracking-wide">
                    {(videoStatus === 'pending' || videoStatus === 'processing') && <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />}
                    {videoStatus === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                    {videoStatus === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                    Trạng thái: <span className="text-slate-200 capitalize font-extrabold">{videoStatus === 'processing' ? 'Đang phân tích...' : videoStatus}</span>
                  </span>
                  <span className="text-indigo-400 font-mono text-[11px]">{videoProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#0b0c10] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-350 ${
                      videoStatus === 'failed' ? 'bg-red-500' : videoStatus === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500 animate-pulse'
                    }`}
                    style={{ width: `${videoProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {videoError && (
              <div className="text-[10px] bg-red-500/10 text-red-400 p-3 rounded-xl border border-red-500/10 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>Lỗi: {videoError}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col md:col-span-7">
        <h3 className="text-slate-200 font-bold text-sm mb-4">Video Kết Quả</h3>
        <div className="flex-1 bg-[#0b0c10] rounded-3xl overflow-hidden flex items-center justify-center min-h-[300px] relative shadow-inner">
          {videoDownloadUrl ? (
            <div className="w-full h-full flex flex-col justify-between">
              <video src={videoDownloadUrl} controls className="w-full flex-1 max-h-[340px]" />
              <div className="p-3 bg-[#181a24] flex justify-end">
                <a href={videoDownloadUrl} download className="md3-btn-primary py-2.5 px-4 rounded-full text-xs shadow-md transition flex items-center gap-1.5">
                  <Download className="w-4 h-4" /> Tải Video Kết Quả (H.264)
                </a>
              </div>
            </div>
          ) : videoPreview && (videoStatus === 'pending' || videoStatus === 'processing') ? (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs">Đang chạy nhận dạng AI khói lửa...</p>
            </div>
          ) : (
            <p className="text-xs text-slate-600 font-bold">Chưa có video kết quả</p>
          )}
        </div>
      </div>
    </div>
  );
}
