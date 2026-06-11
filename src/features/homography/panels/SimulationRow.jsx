import { Copy, Crosshair, Settings, Target, Terminal, Sliders, RotateCcw, RefreshCw } from 'lucide-react';

export function SimulationRow({
  active3DTab, setActive3DTab,
  threeContainerRef, singleTarget, plot3d,
  targets,
  rawOutput, handleCopyLog,
  serialCommand, handleSendSerialMock,
  serialStatus, serialStatusClass,
  loading, handleResetCalibration, handleResetServo, handleProcessTargeting
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="glass-panel rounded-lg p-6 flex flex-col min-h-[600px] lg:col-span-7">
        <div className="flex justify-between items-center pb-2 mb-4">
          <div className="flex items-center gap-2 text-slate-200">
            <Crosshair className="w-4.5 h-4.5 text-pink-400" />
            <h3 className="font-bold text-sm">Mô Phỏng Không Gian 3D</h3>
          </div>
          <div className="flex bg-[#0b0c10] p-1 rounded-lg text-[9px] font-bold shadow-inner">
            <button onClick={() => setActive3DTab('interactive')} className={`px-2.5 py-0.5 rounded transition-all duration-200 cursor-pointer ${active3DTab === 'interactive' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>3D Tương Tác</button>
            <button onClick={() => setActive3DTab('static')} className={`px-2.5 py-0.5 rounded transition-all duration-200 cursor-pointer ${active3DTab === 'static' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>3D Tĩnh</button>
          </div>
        </div>

        <div className="flex-1 bg-[#0b0c10] rounded-lg flex items-center justify-center overflow-hidden relative min-h-[480px] shadow-inner">
          {active3DTab === 'interactive' ? (
            <>
              <div ref={threeContainerRef} className="w-full h-[480px]" />

              {singleTarget && (
                <div className="absolute top-3 left-3 bg-[#0b0c10]/95 p-3.5 rounded-lg font-mono text-[9px] space-y-1.5 z-10 text-left shadow-lg border border-slate-800/40">
                  <div className="text-red-500 font-bold mb-1 flex items-center gap-1.5"><Target className="w-3 h-3 animate-pulse" /> TARGET HUD</div>
                  <div>Góc Pan (θ): <span className="text-indigo-400 font-bold">{singleTarget.pan}°</span></div>
                  <div>Góc Tilt (α): <span className="text-amber-500 font-bold">{singleTarget.tilt}°</span></div>
                  <div className="text-emerald-400 pt-1 mt-1 font-bold">Lệnh: {singleTarget.serial}</div>
                </div>
              )}

              <div className="absolute top-3 right-3 bg-[#0b0c10]/95 p-3.5 rounded-lg font-mono text-[9px] space-y-1.5 z-10 text-left shadow-lg border border-slate-800/40">
                <div className="text-white font-bold mb-1 flex items-center gap-1.5"><Settings className="w-3 h-3 text-indigo-400" /> CHÚ THÍCH GÓC 3D</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-sky-400 inline-block"></span>
                  <span>θ Pan: Cung ngang (XZ) tới đích</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-orange-400 inline-block"></span>
                  <span>α Tilt: Cung dọc từ trần xuống đích (0°→90°)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-pink-500 inline-block"></span>
                  <span>Màu Hồng: Vòi Phun</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-yellow-500 inline-block"></span>
                  <span>Màu Vàng: CCTV</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-indigo-400 inline-block"></span>
                  <span>TL/TR/BR/BL: Góc tường</span>
                </div>
              </div>
            </>
          ) : (
            plot3d
              ? <img src={plot3d} className="w-full h-full object-contain" alt="Matplotlib Static 3D" />
              : <p className="text-xs text-slate-500">Chưa có đồ thị 3D tĩnh (Hãy bấm Bắn Mục Tiêu để sinh đồ thị)</p>
          )}
        </div>
      </div>

      <div className="space-y-4 flex flex-col lg:col-span-3">
        {/* Hiệu Chuẩn & Nhắm Bắn */}
        <div className="glass-panel rounded-lg p-4 flex flex-col justify-start space-y-3">
          <div className="flex items-center gap-2.5 pb-1 text-slate-200">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Sliders className="w-5 h-5 text-indigo-400 shrink-0" />
            </div>
            <h2 className="font-bold text-base">Hiệu Chuẩn &amp; Nhắm Bắn</h2>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="text-xs text-slate-400 font-bold uppercase block tracking-wider font-semibold">Chế độ Servo:</label>
            <div className="w-full bg-[#181a24] rounded-lg px-3 py-2 text-xs font-semibold text-indigo-400 border border-indigo-900/30">
              ESP32 Delta (Góc tương đối)
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">
              Lệnh Serial dạng <code className="text-yellow-400">&lt;U63,R87&gt;</code> — Pan/Tilt quay theo delta từ vị trí hiện tại.
            </p>
          </div>

          <div className="calibration-hints text-[10px] bg-[#181a24] p-3 rounded-lg space-y-1.5 text-slate-400 leading-normal shadow-inner font-mono">
            <p><span className="w-1.5 h-1.5 inline-block rounded-full bg-red-500 mr-1.5"></span> <span className="font-bold text-red-400">Chốt Đỏ C1–C4</span>: 4 góc sàn</p>
            <p><span className="w-1.5 h-1.5 inline-block rounded-full bg-pink-500 mr-1.5"></span> <span className="font-bold text-pink-400">Chốt Hồng</span>: Vị trí Vòi Phun</p>
            <p><span className="w-1.5 h-1.5 inline-block rounded-full bg-yellow-500 mr-1.5"></span> <span className="font-bold text-yellow-500">Chốt Vàng</span>: Vị trí CCTV</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button onClick={handleResetCalibration} className="w-full md3-btn-secondary py-2 text-[10.5px] font-bold rounded-lg cursor-pointer">
              Reset Điểm
            </button>
            <button
              onClick={handleResetServo}
              disabled={loading}
              className="w-full md3-btn-secondary py-2 text-[10.5px] font-bold rounded-lg flex items-center justify-center gap-1 text-pink-400 border-pink-900/30 hover:bg-pink-950/20 cursor-pointer"
              title="Reset servo về vị trí gốc (0°, 0°)"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Servo
            </button>
            <button
              onClick={handleProcessTargeting}
              disabled={loading}
              className="w-full md3-btn-primary py-2 text-[10.5px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-md cursor-pointer"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
              Bắn!
            </button>
          </div>
        </div>

        {/* Mục Tiêu Định Vị AI */}
        <div className="glass-panel rounded-lg p-4 flex flex-col">
          <h4 className="font-bold text-sm text-slate-200 pb-2 mb-2 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500 animate-pulse" /> Mục Tiêu Định Vị AI
          </h4>
          <div className="flex-1 overflow-x-auto text-[10.5px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#181a24] text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                  <th className="p-2 rounded-l-lg">Lớp</th>
                  <th className="p-2">Pixel (u, v)</th>
                  <th className="p-2">Thực Tế (m)</th>
                  <th className="p-2">Pan</th>
                  <th className="p-2">Tilt</th>
                  <th className="p-2 rounded-r-lg">Lệnh Serial</th>
                </tr>
              </thead>
              <tbody>
                {targets.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-slate-500">
                      Chưa phát hiện sự cố khói lửa nào cần định vị.
                    </td>
                  </tr>
                ) : (
                  targets.map((t, idx) => (
                    <tr key={idx} className="hover:bg-white/2 transition">
                      <td className="p-2">
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-400 font-bold rounded-full text-[8px] uppercase">
                          {t.class_name}
                        </span>
                      </td>
                      <td className="p-2 font-mono">[{t.pixel[0]}, {t.pixel[1]}]</td>
                      <td className="p-2 font-mono">[{t.real[0].toFixed(2)}, {t.real[1].toFixed(2)}]</td>
                      <td className="p-2 text-indigo-400 font-bold">{t.pan}°</td>
                      <td className="p-2 text-amber-500 font-bold">{t.tilt}°</td>
                      <td className="p-2 text-emerald-400 font-mono font-bold">{t.serial}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel rounded-lg p-4 space-y-3 flex flex-col justify-between flex-1">
          <div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-indigo-400" /> Log Kết Quả Bắn Laser (Console)
              </span>
              <button
                onClick={handleCopyLog}
                className="bg-white/5 hover:bg-white/10 p-2 rounded-lg text-slate-400 transition hover:text-slate-200 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <pre className="w-full bg-[#0b0c10] p-3 rounded-lg font-mono text-[9.5px] text-slate-400 leading-relaxed h-[140px] overflow-y-auto text-left whitespace-pre-wrap shadow-inner">
              {rawOutput}
            </pre>
          </div>

          <div className="flex gap-2 items-center flex-wrap pt-1 text-xs">
            <input
              type="text" readOnly value={serialCommand} placeholder="<Pan, Tilt>"
              className="bg-[#0b0c10] rounded-lg px-3 py-2 font-mono text-slate-200 max-w-[120px] focus:outline-none shadow-inner"
            />
            <button
              onClick={handleSendSerialMock} disabled={!serialCommand}
              className="md3-btn-primary py-2 px-4 rounded-full text-xs font-semibold disabled:opacity-50"
            >
              Gửi Serial
            </button>
            <span className={`flex-1 px-4 py-2 rounded-full font-mono text-[10px] text-center truncate ${serialStatusClass}`}>
              {serialStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
