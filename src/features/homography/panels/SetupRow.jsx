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
  loadDemoImage
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="glass-panel rounded-lg p-4 flex flex-col justify-start space-y-3">
        <div className="flex items-center gap-2 pb-0.5 text-slate-200">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg">
            <FileImage className="w-4 h-4 text-indigo-400 shrink-0" />
          </div>
          <h2 className="font-bold text-sm">Ảnh CCTV</h2>
        </div>

        <div className="border-2 border-dashed border-[#27273a] hover:border-indigo-500/30 rounded-lg p-2.5 transition-all duration-300 flex flex-col items-center justify-center bg-[#181a24] text-center relative cursor-pointer shadow-inner">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <Upload className="w-4 h-4 text-slate-500 mb-1" />
          <span className="text-[10px] font-bold text-slate-400">Tải ảnh CCTV lên</span>
        </div>

        <div className="pt-0.5">
          <button
            type="button"
            onClick={loadDemoImage}
            className="w-full md3-btn-secondary py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
          >
            <Grid className="w-3 h-3 text-indigo-400" /> Dùng Ảnh Demo Phòng
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-lg p-4 flex flex-col justify-start space-y-3">
        <div className="flex items-center gap-2 pb-0.5 text-slate-200">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg">
            <Settings className="w-4 h-4 text-indigo-400 shrink-0" />
          </div>
          <h2 className="font-bold text-sm">Thông Số Phòng</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Rộng W (m):</label>
            <input
              type="number" step="0.5" min="1" max="50"
              value={roomW} onChange={e => setRoomW(parseFloat(e.target.value) || 6.0)}
              className="w-full bg-[#181a24] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-semibold focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Dài L (m):</label>
            <input
              type="number" step="0.5" min="1" max="50"
              value={roomL} onChange={e => setRoomL(parseFloat(e.target.value) || 6.0)}
              className="w-full bg-[#181a24] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-semibold focus:outline-none"
            />
          </div>
        </div>
        <div className="text-[11px] space-y-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Chiều Cao Trần H (m):</label>
          <input
            type="number" step="0.1" min="1" max="15"
            value={roomH} onChange={e => setRoomH(parseFloat(e.target.value) || 3.0)}
            className="w-full bg-[#181a24] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-semibold focus:outline-none"
          />
        </div>
      </div>

      <div className="glass-panel rounded-lg p-4 flex flex-col justify-start space-y-3">
        <div className="flex items-center gap-2 pb-0.5 text-slate-200">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg">
            <Camera className="w-4 h-4 text-indigo-400 shrink-0" />
          </div>
          <h2 className="font-bold text-sm">Vị Trí Thiết Bị (3D)</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Cao CCTV Z_c (m):</label>
            <input
              type="number" step="0.1" min="0.5" max="15"
              value={camZ} onChange={e => setCamZ(parseFloat(e.target.value) || 3.0)}
              className="w-full bg-[#181a24] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-semibold focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Cao Vòi Z_s (m):</label>
            <input
              type="number" step="0.1" min="0.5" max="15"
              value={nozZ} onChange={e => setNozZ(parseFloat(e.target.value) || 3.0)}
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
