import { FileImage, ShieldAlert, Target, Tv, Cpu, SlidersHorizontal, History } from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab, serverOnline, classes, conf, setConf, iou, setIou, sidebarOpen, models = [], activeModel = '', loadingModel = false, handleSelectModel }) {
  const tabClass = (tab) =>
    `w-full flex items-center transition-all duration-300 rounded-2xl text-[11px] font-bold uppercase tracking-wider cursor-pointer ${activeTab === tab
      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
    } ${sidebarOpen ? 'px-4 py-3.5 gap-3.5 justify-start' : 'p-3.5 justify-center'}`;

  const activeModelObj = models.find(m => m.path === activeModel);
  const activeModelName = activeModelObj ? activeModelObj.name : 'Fire Best';

  return (
    <aside className={`bg-[#121318]/95 flex flex-col shrink-0 text-left relative z-20 shadow-2xl transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-20'
      }`}>
      {/* Header Logo */}
      <div className={`p-6 flex items-center gap-3 transition-all duration-300 ${sidebarOpen ? 'justify-start' : 'justify-center'}`}>
        <div className="p-2.5 bg-red-500/10 rounded-2xl">
          <ShieldAlert className="w-7 h-7 text-red-500 animate-pulse shrink-0" />
        </div>
        {sidebarOpen && (
          <div className="animate-fade-in">
            <h1 className="font-extrabold text-sm tracking-tight text-white m-0">AI FIRE DEFENSE</h1>
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider mt-0.5">Hệ Thống Dập Lửa</span>
          </div>
        )}
      </div>

      {sidebarOpen && (
        <>
          {/* Server Status */}
          <div className="mx-4 my-2 px-4 py-3 bg-[#181a24] rounded-2xl flex flex-col gap-2 shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-500 animate-signal' : 'bg-red-500'}`}></span>
                Inference Server:
              </span>
              <span className={`font-bold text-[11px] ${serverOnline ? 'text-emerald-400' : 'text-red-500'}`}>
                {serverOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> Model:</span>
              <span className="truncate max-w-[130px] text-slate-400 font-bold" title={activeModelName}>{activeModelName}</span>
            </div>
          </div>

          {/* Mô hình AI nhận dạng */}
          {models.length > 0 && (
            <div className="mx-4 my-1 px-4 py-3 bg-[#181a24] rounded-2xl flex flex-col gap-2.5 shadow-inner shrink-0">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>Mô hình AI nhận dạng:</span>
              </div>
              <select
                value={activeModel}
                onChange={(e) => handleSelectModel(e.target.value)}
                disabled={loadingModel}
                className="w-full bg-[#121318] rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none cursor-pointer border border-slate-800/80 hover:border-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {models.map((model) => (
                  <option key={model.path} value={model.path}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Ngưỡng nhận diện */}
          <div className="mx-4 my-1 px-4 py-3 bg-[#181a24] rounded-2xl flex flex-col gap-3 shadow-inner shrink-0">
            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ngưỡng Nhận Diện:</span>
            </div>
            <div className="space-y-2.5 text-xs font-semibold">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Conf (Độ tin cậy):</span>
                  <span className="text-indigo-400 font-mono font-bold">{conf}</span>
                </div>
                <input
                  type="range" min="0.1" max="0.9" step="0.05" value={conf}
                  onChange={(e) => setConf(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>IOU (Trùng lặp):</span>
                  <span className="text-indigo-400 font-mono font-bold">{iou}</span>
                </div>
                <input
                  type="range" min="0.1" max="0.9" step="0.05" value={iou}
                  onChange={(e) => setIou(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Navigation menu */}
      <nav className={`flex-1 py-6 space-y-2.5 transition-all duration-300 ${sidebarOpen ? 'px-4' : 'px-3'}`}>
        <button
          onClick={() => setActiveTab('live')}
          className={tabClass('live')}
          title={sidebarOpen ? "" : "Giám Sát Live"}
        >
          <Tv className="w-4.5 h-4.5 shrink-0" />
          {sidebarOpen && <span>Giám Sát Live</span>}
        </button>
        <button
          onClick={() => setActiveTab('predict')}
          className={tabClass('predict')}
          title={sidebarOpen ? "" : "Phân Tích Ảnh, Video"}
        >
          <FileImage className="w-4.5 h-4.5 shrink-0" />
          {sidebarOpen && <span>Phân Tích Ảnh, Video</span>}
        </button>
        <button
          onClick={() => setActiveTab('targeting')}
          className={tabClass('targeting')}
          title={sidebarOpen ? "" : "Homography & 3D"}
        >
          <Target className="w-4.5 h-4.5 shrink-0" />
          {sidebarOpen && <span>Homography &amp; 3D</span>}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={tabClass('history')}
          title={sidebarOpen ? "" : "Lịch Sử Cảnh Báo"}
        >
          <History className="w-4.5 h-4.5 shrink-0" />
          {sidebarOpen && <span>Lịch Sử Cảnh Báo</span>}
        </button>
      </nav>

      {sidebarOpen && (
        <div className="p-5 mx-4 mb-6 bg-[#181a24] rounded-2xl text-[10px] shadow-inner">
          <span className="text-slate-500 font-bold block uppercase tracking-wider mb-2">Đối Tượng Nhận Diện:</span>
          <div className="flex flex-wrap gap-1.5">
            {classes.length > 0 ? (
              classes.map((cls, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-slate-800/80 text-slate-300 rounded-lg font-medium uppercase font-mono text-[9px]">
                  {cls}
                </span>
              ))
            ) : (
              <span className="text-slate-600">Đang đồng bộ từ YOLO...</span>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
