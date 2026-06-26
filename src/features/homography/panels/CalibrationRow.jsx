import { Grid, Layers, RefreshCw, RotateCcw, Sliders, Target, Wifi, Loader2, Power } from 'lucide-react';

export function CalibrationRow({
  loading,
  ceilingZoom, resetCeilingView,
  cctvZoom, resetCctvView,
  imageLoaded, imageSize,
  ceilingWrapRef, ceilingCanvasRef,
  handleCeilingMouseDown, handleCeilingMouseMove, handleCeilingMouseUp,
  imageRef, imageSrc, cctvCanvasRef,
  cctvPan, cctvDragIndex, DRAG_NONE,
  handleImageLoaded,
  handleCctvMouseDown, handleCctvMouseMove, handleCctvMouseUp,
  handleResetCalibration, handleProcessTargeting, handleResetServo,
  cctvInteractionMode, setCctvInteractionMode,
  activeCornerCount, handleStartSequentialPlacement,
  esp32Ip, setEsp32Ip,
  pumpOn, pumpLoading, handleTogglePump,
  targetingMode, setTargetingMode
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      {/* COLUMN 1: Sidebar Controls (lg:col-span-2) */}
      <div className="space-y-4 flex flex-col lg:col-span-2">
        {/* Kết Nối ESP32 & Thiết Bị Ngoại Vi */}
        <div className="glass-panel rounded-lg p-4 flex flex-col justify-start space-y-3">
          <div className="flex items-center gap-2 pb-0.5 text-slate-200">
            <div className="p-1.5 bg-sky-500/10 rounded-lg">
              <Wifi className="w-4 h-4 text-sky-400 shrink-0" />
            </div>
            <h2 className="font-bold text-xs">Kết Nối ESP32</h2>
          </div>

          <div className="space-y-3 text-[11px]">
            {/* IP Address Input */}
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider font-semibold">IP ESP32:</label>
              <input
                type="text"
                value={esp32Ip}
                onChange={(e) => setEsp32Ip(e.target.value)}
                placeholder="http://192.168.1.17"
                className="w-full bg-[#181a24] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-semibold border border-slate-800/60 focus:outline-none focus:border-sky-500/50 transition-all font-mono"
              />
            </div>

            {/* Targeting Mode Dropdown */}
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider font-semibold">Truyền lệnh:</label>
              <select
                value={targetingMode}
                onChange={(e) => setTargetingMode(e.target.value)}
                className="w-full bg-[#181a24] rounded-lg px-2 py-1.5 text-slate-200 text-[11px] font-semibold border border-slate-800/60 focus:outline-none focus:border-sky-500/50 transition-all cursor-pointer"
              >
                <option value="client">Client-side</option>
                <option value="server">Server-side</option>
              </select>
            </div>

            {/* Motor Pump manual control */}
            <div className="pt-1 flex flex-col gap-2 bg-[#181a24]/40 p-2 rounded-lg border border-slate-800/30">
              <div>
                <span className="text-[10px] font-bold text-slate-300 block">Bơm Nước</span>
              </div>
              <button
                type="button"
                onClick={handleTogglePump}
                disabled={pumpLoading}
                className={`w-full py-1.5 px-2 rounded text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all duration-300 shadow ${
                  pumpOn
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20'
                }`}
              >
                {pumpLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Power className="w-3 h-3" />
                )}
                {pumpOn ? 'Tắt Bơm' : 'Bật Bơm'}
              </button>
            </div>
          </div>
        </div>

        {/* Hiệu Chuẩn & Nhắm Bắn */}
        <div className="glass-panel rounded-lg p-4 flex flex-col justify-start space-y-3">
          <div className="flex items-center gap-2 pb-0.5 text-slate-200">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg">
              <Sliders className="w-4 h-4 text-indigo-400 shrink-0" />
            </div>
            <h2 className="font-bold text-xs">Hiệu Chuẩn</h2>
          </div>

          <div className="space-y-1 text-[11px]">
            <label className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider font-semibold">Chế độ Servo:</label>
            <div className="w-full bg-[#181a24] rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-indigo-400 border border-indigo-900/30">
              Delta (Tương đối)
            </div>
          </div>

          <div className="calibration-hints text-[9px] bg-[#181a24] p-2 rounded-lg space-y-1 text-slate-400 leading-normal shadow-inner font-mono">
            <p><span className="w-1.5 h-1.5 inline-block rounded-full bg-red-500 mr-1.5"></span> <span className="font-bold text-red-400">Đỏ C1–C4</span>: 4 góc sàn</p>
            <p><span className="w-1.5 h-1.5 inline-block rounded-full bg-pink-500 mr-1.5"></span> <span className="font-bold text-pink-400">Hồng</span>: Vòi Phun</p>
            <p><span className="w-1.5 h-1.5 inline-block rounded-full bg-yellow-500 mr-1.5"></span> <span className="font-bold text-yellow-500">Vàng</span>: CCTV</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <button onClick={handleResetCalibration} className="w-full md3-btn-secondary py-1 text-[10px] font-bold rounded-lg cursor-pointer">
              Reset Điểm
            </button>
            <button
              onClick={handleResetServo}
              disabled={loading}
              className="w-full md3-btn-secondary py-1 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 text-pink-400 border-pink-900/30 hover:bg-pink-950/20 cursor-pointer"
              title="Reset servo về vị trí gốc (0°, 0°)"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Servo
            </button>
            <button
              onClick={handleProcessTargeting}
              disabled={loading}
              className="w-full md3-btn-primary py-1 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-md cursor-pointer"
            >
              {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Target className="w-3 h-3" />}
              Bắn!
            </button>
          </div>
        </div>
      </div>

      {/* COLUMN 2: Ceiling View (lg:col-span-4) */}
      <div className="glass-panel rounded-lg p-6 flex flex-col min-h-[575px] lg:col-span-4" ref={ceilingWrapRef}>
        <div className="flex justify-between items-center pb-2.5 mb-3.5">
          <div>
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-pink-400" /> Mặt Phẳng Trần Nhà (Ceiling View)
            </h3>
            <span className="text-[10px] text-slate-500 block mt-0.5">Cuộn để zoom, kéo nền để pan. Kéo thả Camera/Vòi Phun/Lửa để tính góc.</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/30 px-2 py-0.5 rounded-lg">
              {Math.round(ceilingZoom * 100)}%
            </span>
            <button
              type="button"
              onClick={resetCeilingView}
              title="Reset zoom & pan"
              className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg text-slate-400 hover:text-slate-200 transition font-bold cursor-pointer"
            >
              ⟳
            </button>
          </div>
        </div>

        <div className="flex-1 bg-[#0b0c10] rounded-none relative overflow-hidden min-h-[450px] shadow-inner">
          <canvas
            ref={ceilingCanvasRef}
            onMouseDown={handleCeilingMouseDown}
            onMouseMove={handleCeilingMouseMove}
            onMouseUp={handleCeilingMouseUp}
            onMouseLeave={handleCeilingMouseUp}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            className="cursor-crosshair"
          />
        </div>
      </div>

      {/* COLUMN 3: CCTV Image (lg:col-span-4) */}
      <div className="glass-panel rounded-lg p-6 flex flex-col min-h-[575px] lg:col-span-4">
        <div className="flex justify-between items-center pb-2 mb-2">
          <div>
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Grid className="w-4 h-4 text-emerald-400" /> Hình Ảnh CCTV
            </h3>
            <span className="text-[10px] text-slate-500 block mt-0.5">Cuộn để zoom, kéo nền để pan. Kéo C1–C4 định vị góc sàn (có thể kéo ra ngoài ảnh).</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {imageLoaded && (
              <div className="text-[9px] bg-indigo-950/20 text-indigo-400 font-bold px-2 py-0.5 rounded-full font-mono">
                {imageSize.w}×{imageSize.h}
              </div>
            )}
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded-lg">
              {Math.round(cctvZoom * 100)}%
            </span>
            <button
              type="button"
              onClick={resetCctvView}
              title="Reset zoom & pan"
              className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg text-slate-400 hover:text-slate-200 transition font-bold cursor-pointer"
            >
              ⟳
            </button>
          </div>
        </div>

        {/* Toolbar for calibration settings */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#181a24]/50 border border-slate-800/30 p-2 rounded-lg mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chế độ tác động:</span>
            <div className="flex bg-[#0b0c10] p-0.5 rounded-lg text-[9px] font-bold shadow-inner border border-slate-800/40">
              <button
                type="button"
                onClick={() => setCctvInteractionMode('points')}
                className={`px-2.5 py-1 rounded-md transition-all duration-200 cursor-pointer ${
                  cctvInteractionMode === 'points' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'
                }`}
              >
                🎯 Điểm
              </button>
              <button
                type="button"
                onClick={() => setCctvInteractionMode('pan')}
                className={`px-2.5 py-1 rounded-md transition-all duration-200 cursor-pointer ${
                  cctvInteractionMode === 'pan' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'
                }`}
              >
                ✋ Kéo nền
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeCornerCount < 4 && (
              <span className="text-[10px] font-semibold text-amber-400 animate-pulse">
                Đã đặt {activeCornerCount}/4 góc
              </span>
            )}
            <button
              type="button"
              onClick={handleStartSequentialPlacement}
              className="text-[9px] bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2.5 py-1 rounded-lg text-indigo-400 hover:text-indigo-200 transition font-bold cursor-pointer"
            >
              Chấm lại 4 góc
            </button>
          </div>
        </div>

        <div className="flex-1 bg-[#0b0c10] rounded-lg flex items-center justify-center relative overflow-hidden shadow-inner select-none min-h-[450px]">
          {imageSrc ? (
            <img
              ref={imageRef}
              src={imageSrc}
              onLoad={handleImageLoaded}
              alt="CCTV"
              className="max-w-full max-h-full object-contain"
              style={{
                display: 'block',
                pointerEvents: 'none',
                transform: `translate(${cctvPan.x}px, ${cctvPan.y}px) scale(${cctvZoom})`,
                transformOrigin: 'center center',
                transition: cctvDragIndex === DRAG_NONE ? 'transform 0.05s ease-out' : 'none'
              }}
            />
          ) : (
            <span className="text-xs text-slate-600">Chưa có ảnh — tải ảnh CCTV ở cột bên trái</span>
          )}
          <canvas
            ref={cctvCanvasRef}
            onMouseDown={handleCctvMouseDown}
            onMouseMove={handleCctvMouseMove}
            onMouseUp={handleCctvMouseUp}
            onMouseLeave={handleCctvMouseUp}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            className="cursor-crosshair"
          />
        </div>
      </div>
    </div>
  );
}
