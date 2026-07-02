import { Camera, FileImage, Grid, Settings, Upload } from 'lucide-react';

export function SetupRow({
  roomW, setRoomW,
  roomL, setRoomL,
  roomH, setRoomH,
  camZ, setCamZ,
  nozZ, setNozZ,
  nearestCornerInfo,
  cameraOffset,
  nozzleReal,
  handleFileUpload,
  loadDemoImage,
  streamSource, setStreamSource,
  customUrl, setCustomUrl,
  activeStreamType,
  handleStartWebSocket, handleStartMJPEG, handleStopStream,
  uploading, uploadProgress, handleVideoUpload
}) {
  const handleInputChange = (val, setter, defaultVal) => {
    if (val === '') {
      setter('');
      return;
    }
    if (val.endsWith('.') || val === '-') {
      setter(val);
      return;
    }
    const parsed = parseFloat(val);
    if (isNaN(parsed)) {
      setter(defaultVal);
    } else {
      setter(parsed);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="glass-panel rounded-lg p-4 flex flex-col justify-start space-y-3">
        <div className="flex items-center gap-2 pb-0.5 text-slate-200">
          <div className="p-1.5 bg-sky-500/10 rounded-lg">
            <FileImage className="w-4 h-4 text-sky-400 shrink-0" />
          </div>
          <h2 className="font-bold text-sm">Nguồn Nền Hiệu Chuẩn</h2>
        </div>

        <div className="space-y-1.5">
          <select
            value={streamSource}
            onChange={(e) => {
              setStreamSource(e.target.value);
              handleStopStream();
            }}
            disabled={activeStreamType !== 'none'}
            className="w-full bg-[#181a24] rounded-lg px-2 py-1.5 text-slate-200 text-[10px] font-semibold border border-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="upload">Ảnh tĩnh tải lên</option>
            <option value="demo">Dùng ảnh Demo phòng</option>
            <option value="browser-cam">Camera của laptop</option>
            <option value="videos/file.mp4">Video mẫu</option>
            <option value="custom">Cổng RTSP / URL Tùy chọn</option>
          </select>
        </div>

        {streamSource === 'custom' && activeStreamType === 'none' && (
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="rtsp://192.168.1.x:554/stream"
            className="w-full bg-[#181a24] rounded-lg px-2.5 py-1 text-[10px] text-slate-200 focus:outline-none border border-slate-800"
          />
        )}

        {streamSource === 'videos/file.mp4' && activeStreamType === 'none' && (
          <div className="space-y-1.5">
            <div className="border border-dashed border-[#27273a] hover:border-sky-500/30 rounded-lg p-2 flex flex-col items-center justify-center bg-[#181a24]/40 text-center relative cursor-pointer">
              <input
                type="file"
                accept="video/mp4"
                onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-3.5 h-3.5 text-slate-500 mb-0.5" />
              <span className="text-[9px] font-bold text-slate-400">Tải video mới lên (.mp4)</span>
            </div>
            {uploading && (
              <div className="space-y-1">
                <div className="w-full h-1 bg-[#181a24] rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-1">
          {streamSource === 'upload' && (
            <div className="border-2 border-dashed border-[#27273a] hover:border-sky-500/30 rounded-lg p-2.5 transition-all duration-300 flex flex-col items-center justify-center bg-[#181a24] text-center relative cursor-pointer shadow-inner">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-4 h-4 text-slate-500 mb-1" />
              <span className="text-[10px] font-bold text-slate-400">Tải ảnh CCTV lên</span>
            </div>
          )}

          {streamSource === 'demo' && (
            <button
              type="button"
              onClick={loadDemoImage}
              className="w-full md3-btn-secondary py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5 text-sky-400" /> Nạp Ảnh Demo
            </button>
          )}

          {streamSource !== 'upload' && streamSource !== 'demo' && (
            <div>
              {activeStreamType === 'none' ? (
                streamSource === 'browser-cam' ? (
                  <button
                    onClick={handleStartWebSocket}
                    className="w-full md3-btn-primary py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Bật Webcam laptop
                  </button>
                ) : (
                  <button
                    onClick={handleStartMJPEG}
                    className="w-full md3-btn-primary py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Kết Nối Stream AI
                  </button>
                )
              ) : (
                <button
                  onClick={() => handleStopStream()}
                  className="w-full md3-btn-secondary py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 text-red-400 border-red-900/20 cursor-pointer"
                >
                  Dừng Stream Video
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-lg p-4 flex flex-col justify-start space-y-3">
        <div className="flex items-center gap-2 pb-0.5 text-slate-200">
          <div className="p-1.5 bg-sky-500/10 rounded-lg">
            <Settings className="w-4 h-4 text-sky-400 shrink-0" />
          </div>
          <h2 className="font-bold text-sm">Thông Số Phòng</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Rộng W (m):</label>
            <input
              type="number" step="1" min="1" max="50"
              value={roomW} onChange={e => handleInputChange(e.target.value, setRoomW, 6.0)}
              className="w-full bg-[#181a24] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-semibold focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Dài L (m):</label>
            <input
              type="number" step="1" min="1" max="50"
              value={roomL} onChange={e => handleInputChange(e.target.value, setRoomL, 6.0)}
              className="w-full bg-[#181a24] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-semibold focus:outline-none"
            />
          </div>
        </div>
        <div className="text-[11px] space-y-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Chiều Cao Trần H (m):</label>
          <input
            type="number" step="0.1" min="1" max="15"
            value={roomH} onChange={e => handleInputChange(e.target.value, setRoomH, 3.0)}
            className="w-full bg-[#181a24] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-semibold focus:outline-none"
          />
        </div>
      </div>

      <div className="glass-panel rounded-lg p-4 flex flex-col justify-start space-y-3">
        <div className="flex items-center gap-2 pb-0.5 text-slate-200">
          <div className="p-1.5 bg-sky-500/10 rounded-lg">
            <Camera className="w-4 h-4 text-sky-400 shrink-0" />
          </div>
          <h2 className="font-bold text-sm">Vị Trí Thiết Bị (3D)</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Cao CCTV Z_c (m):</label>
            <input
              type="number" step="0.1" min="0.5" max="15"
              value={camZ} onChange={e => handleInputChange(e.target.value, setCamZ, 3.0)}
              className="w-full bg-[#181a24] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-semibold focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Cao Vòi Z_s (m):</label>
            <input
              type="number" step="0.1" min="0.5" max="15"
              value={nozZ} onChange={e => handleInputChange(e.target.value, setNozZ, 3.0)}
              className="w-full bg-[#181a24] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-semibold focus:outline-none"
            />
          </div>
        </div>

        <div className="device-coords-box text-[10px] bg-[#181a24] p-2 rounded-lg space-y-0.5 font-mono text-slate-400 shadow-inner">
          <div className="flex justify-between">
            <span className="text-amber-500 font-semibold">Góc CCTV:</span>
            <span className="text-slate-300 font-bold truncate max-w-[130px]">{nearestCornerInfo || 'N/A'}</span>
          </div>
          <p><span className="text-amber-500 font-semibold">Camera:</span> dX={cameraOffset.x.toFixed(2)}m, dY={cameraOffset.y.toFixed(2)}m</p>
          <p><span className="text-pink-500 font-semibold">Vòi Phun:</span> ({nozzleReal[0].toFixed(2)}, {nozzleReal[1].toFixed(2)})m</p>
        </div>
      </div>
    </div>
  );
}
