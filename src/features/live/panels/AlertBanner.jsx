import { AlertTriangle, ShieldAlert, Volume2, VolumeX } from 'lucide-react';

export function AlertBanner({ isAlertConfirmed, stats, isMuted, setIsMuted }) {
  if (!isAlertConfirmed) return null;

  const isFire = stats.fire_now > 0;

  return (
    <div className={`p-5 rounded-3xl flex items-center gap-4 transition-all duration-300 ${
      isFire ? 'bg-red-500/10 text-red-200 border-l-4 border-red-500 animate-pulse' : 'bg-amber-500/10 text-amber-200 border-l-4 border-amber-500'
    }`}>
      <div className="p-3 bg-white/5 rounded-2xl">
        {isFire ? (
          <ShieldAlert className="w-8 h-8 text-red-500 animate-bounce" />
        ) : (
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        )}
      </div>
      <div className="flex-1 text-left">
        <h3 className="font-extrabold text-base tracking-tight">
          {isFire ? 'BÁO ĐỘNG ĐÁM CHÁY: PHÁT HIỆN LỬA!' : 'CẢNH BÁO: PHÁT HIỆN CÓ KHÓI LỚN!'}
        </h3>
        <p className="text-[11px] opacity-80 mt-0.5">Hệ thống trí tuệ nhân tạo YOLO đã phát hiện sự cố nguy hiểm. Đang phát còi báo động.</p>
      </div>
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="bg-white/10 hover:bg-white/15 p-3 rounded-2xl text-slate-300 transition-all cursor-pointer"
      >
        {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-indigo-400 animate-pulse" />}
      </button>
    </div>
  );
}
