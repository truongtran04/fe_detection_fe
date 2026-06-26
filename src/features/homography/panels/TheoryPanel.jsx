import { HelpCircle } from 'lucide-react';

export function TheoryPanel() {
  return (
    <div className="glass-panel rounded-lg p-6 text-left">
      <h4 className="font-extrabold text-sm text-slate-200 pb-2 mb-3 flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-indigo-400" /> Nguyên Lý Tính Toán & Điều Khiển Servo ESP32
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-10 gap-6 text-xs text-slate-400 leading-relaxed font-mono">
        <div className="md:col-span-4 space-y-2">
          <p className="text-slate-200 font-bold text-xs uppercase tracking-wider">Hệ Toạ Độ & Các Điểm:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Hệ trục Oxyz:</strong> Gốc O(0,0,0) tại tâm sàn. Ox là trục ngang, Oy trục dọc, Oz trục đứng hướng lên trần.</li>
            <li><strong>Vòi Phun S:</strong> Toạ độ không gian thực <code className="text-pink-400">(X_s, Y_s, Z_s)</code>.</li>
            <li><strong>Điểm Đám Cháy F:</strong> Toạ độ thực sàn <code className="text-red-400">(X_f, Y_f, 0)</code> tìm được thông qua ánh xạ Homography H từ ảnh CCTV.</li>
            <li><strong>Góc Pan (θ):</strong> arctan2(Y_f - Y_s, X_f - X_s) → [-180°, 180°] <span className="text-slate-500">(Trục X cục bộ của vòi phun hướng về bên phải)</span></li>
            <li><strong>Góc Tilt (α):</strong> arctan2(Z_s, D) → [0°, 90°] <span className="text-slate-500">(0° = song song mặt sàn, 90° = thẳng đứng hướng xuống sàn)</span></li>
          </ul>
        </div>

        <div className="md:col-span-6 space-y-3 bg-[#0b0c10] p-5 rounded-lg border border-slate-900/50 shadow-inner">
          <p className="text-indigo-400 font-bold text-xs uppercase tracking-wider">Chế Độ Điều Khiển ESP32 — Góc Tương Đối (Delta)</p>
          <div className="space-y-2.5 text-[11px]">
            <div>
              <span className="text-slate-200 font-bold">Nguyên lý hoạt động:</span>
              <p className="text-slate-500 pl-4 mt-0.5">
                Backend theo dõi <strong className="text-indigo-400">vị trí servo hiện tại</strong> và tính <strong className="text-emerald-400">delta (chênh lệch)</strong> giữa góc mục tiêu và góc hiện tại. 
                ESP32 nhận lệnh quay tương đối thông qua API WiFi.
              </p>
            </div>
            <div>
              <span className="text-slate-200 font-bold">Pan (quay ngang):</span>
              <p className="text-slate-500 pl-4 mt-0.5">
                <code className="text-emerald-400">L</code> = quay trái (chiều dương), <code className="text-red-400">R</code> = quay phải (chiều âm).
                <br/>Ví dụ: Vị trí 0° → mục tiêu -63° → <code className="text-yellow-400">R63</code>. Tiếp mục tiêu 140° → delta = 203° → <code className="text-yellow-400">L203</code>.
              </p>
            </div>
            <div>
              <span className="text-slate-200 font-bold">Tilt (nghiêng dọc):</span>
              <p className="text-slate-500 pl-4 mt-0.5">
                <code className="text-emerald-400">D</code> = nghiêng xuống sàn (→ 90°), <code className="text-red-400">U</code> = nghiêng hướng lên trần (→ 0°).
                <br/>Ví dụ: Vị trí 90° (thẳng đứng) → mục tiêu 30° (nghiêng lên) → delta = -60° → <code className="text-yellow-400">U60</code>. Tiếp mục tiêu 70° (nghiêng xuống) → delta = +40° → <code className="text-yellow-400">D40</code>.
              </p>
            </div>
            <div>
              <span className="text-slate-200 font-bold">Format API Lệnh:</span>
              <p className="text-slate-500 pl-4 mt-0.5">
                <code className="text-yellow-400 text-sm">&lt;R63,D57&gt;</code> — Pan quay Right 63°, Tilt quay Down 57°. Nút <strong className="text-pink-400">Reset Servo</strong> sẽ gửi lệnh HOME để motor đưa thiết bị về vị trí ban đầu (0°, 0°).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
