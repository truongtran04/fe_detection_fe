import { Grid, Layers, RefreshCw, RotateCcw, Sliders, Target } from 'lucide-react';

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
  handleResetCalibration, handleProcessTargeting, handleResetServo
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-panel rounded-lg p-6 flex flex-col min-h-[575px]" ref={ceilingWrapRef}>
        <div className="flex justify-between items-center pb-2.5 mb-3.5">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-5 h-5 text-pink-400" /> Mặt Phẳng Trần Nhà (Ceiling View)
            </h3>
            <span className="text-[10px] text-slate-500 block mt-0.5">Cuộn để zoom, kéo nền để pan. Kéo thả Camera/Vòi Phun/Lửa để tính góc servo.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/30 px-2 py-1 rounded-lg">
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

      <div className="glass-panel rounded-lg p-6 flex flex-col min-h-[575px]">
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
