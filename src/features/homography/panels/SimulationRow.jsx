import { Copy, Crosshair, Settings, Target, Terminal } from 'lucide-react';

export function SimulationRow({
  active3DTab, setActive3DTab,
  threeContainerRef, singleTarget, plot3d,
  targets,
  rawOutput, handleCopyLog
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      {/* COLUMN 1: Sidebar Control & Visualizations (lg:col-span-3) */}
      <div className="space-y-4 flex flex-col lg:col-span-3">
        {/* Mục Tiêu Định Vị AI */}
        <div className="glass-panel rounded-lg p-4 flex flex-col">
          <h4 className="font-bold text-sm text-slate-200 pb-2 mb-2 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500 animate-pulse" /> Mục Tiêu Định Vị AI
          </h4>
          <div className="flex-1 overflow-x-auto text-[10.5px]">
            <table className="w-full text-left min-w-[450px]">
              <thead>
                <tr className="bg-[#181a24] text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                  <th className="p-1.5 rounded-l-lg whitespace-nowrap">Lớp</th>
                  <th className="p-1.5 whitespace-nowrap">Pixel (u, v)</th>
                  <th className="p-1.5 whitespace-nowrap">Thực Tế (m)</th>
                  <th className="p-1.5 whitespace-nowrap">Pan</th>
                  <th className="p-1.5 whitespace-nowrap">Tilt</th>
                  <th className="p-1.5 rounded-r-lg whitespace-nowrap">Lệnh Serial</th>
                </tr>
              </thead>
              <tbody>
                {targets.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-slate-500 whitespace-nowrap">
                      Chưa phát hiện sự cố khói lửa nào cần định vị.
                    </td>
                  </tr>
                ) : (
                  targets.map((t, idx) => (
                    <tr key={idx} className="hover:bg-white/2 transition">
                      <td className="p-1.5 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 font-bold rounded-full text-[8px] uppercase">
                          {t.class_name}
                        </span>
                      </td>
                      <td className="p-1.5 font-mono whitespace-nowrap">[{t.pixel[0]}, {t.pixel[1]}]</td>
                      <td className="p-1.5 font-mono whitespace-nowrap">[{t.real[0].toFixed(2)}, {t.real[1].toFixed(2)}]</td>
                      <td className="p-1.5 text-indigo-400 font-bold whitespace-nowrap">{t.pan}°</td>
                      <td className="p-1.5 text-amber-500 font-bold whitespace-nowrap">{t.tilt}°</td>
                      <td className="p-1.5 text-emerald-400 font-mono font-bold whitespace-nowrap">{t.serial}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Console output (only outputs log result) */}
        <div className="glass-panel rounded-lg p-4 space-y-3 flex flex-col justify-start">
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
        </div>
      </div>

      {/* COLUMN 2: 3D Simulator Room (lg:col-span-7) */}
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
                  <span>C1/C2/C3/C4: Góc tường</span>
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
    </div>
  );
}
