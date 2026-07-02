import { useState } from 'react';
import { CheckCircle2, History, X } from 'lucide-react';

export function AlertsHistory({ alerts, loadingAlerts, handleClearAlertLogs }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(alerts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAlerts = alerts.slice(startIndex, startIndex + itemsPerPage);

  if (currentPage > 1 && startIndex >= alerts.length) {
    setCurrentPage(1);
  }

  return (
    <div className="glass-panel rounded-3xl p-6 text-left">
      <div className="flex justify-between items-center pb-4 mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2 text-slate-200">
          <div className="p-2 bg-sky-500/10 rounded-xl">
            <History className="w-5 h-5 text-sky-400" />
          </div>
          {/* Only first word capitalized */}
          <h3 className="font-bold text-sm">Cảnh báo hệ thống gần đây</h3>
        </div>
        <div className="flex gap-2">
          {alerts.length > 0 && (
            <button
              onClick={() => {
                handleClearAlertLogs();
                setCurrentPage(1);
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-[10px] font-bold transition-all cursor-pointer"
            >
              Xóa log
            </button>
          )}
        </div>
      </div>

      {/* Table container — no rounded corners, just a flat bordered box */}
      <div className="overflow-hidden border border-[#27273a]/30 rounded-xl">
        {loadingAlerts ? (
          <div className="flex items-center justify-center p-12 text-slate-500 text-xs">
            <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            Đang đồng bộ dữ liệu cảnh báo...
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-center space-y-2.5 animate-fade-in min-h-[160px]">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-signal" />
            <p className="font-semibold text-slate-300 text-xs">An toàn — Không có cảnh báo</p>
            <p className="text-[10px] text-slate-500">Hệ thống đang hoạt động an toàn và ổn định.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="overflow-y-auto max-h-[350px] overflow-x-auto text-[11px]">
              <table className="w-full text-slate-300 border-collapse">
                <thead className="sticky top-0 z-10 alert-table-head">
                  <tr className="text-slate-400 text-[9px] font-bold uppercase tracking-wider border-b border-[#27273a]/30">
                    <th className="px-6 py-3.5 text-left">Ngày</th>
                    <th className="px-6 py-3.5 text-left">Thời gian</th>
                    <th className="px-6 py-3.5 text-left">Mức độ</th>
                    <th className="px-6 py-3.5 text-left">Ảnh</th>
                    <th className="px-6 py-3.5 text-left">Nội dung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27273a]/20">
                  {paginatedAlerts.map((al) => {
                    const alertDate = al.date || al.timestamp?.split(' ')[0] || new Date().toLocaleDateString('sv');
                    const alertTime = al.time || al.timestamp?.split(' ')[1] || al.timestamp || '00:00:00';

                    return (
                      <tr key={al.id} className="alert-table-row transition">
                        <td className="px-6 py-3.5 font-mono text-slate-400 whitespace-nowrap">{alertDate}</td>
                        <td className="px-6 py-3.5 font-mono text-slate-400 whitespace-nowrap">{alertTime}</td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-md font-bold uppercase text-[8px] ${
                            al.level === 'emergency' ? 'bg-red-500/15 text-red-400' :
                            al.level === 'warning' ? 'bg-amber-500/15 text-amber-400' :
                            'bg-slate-500/15 text-slate-400'
                          }`}>{al.level}</span>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          {al.image_url ? (
                            <img
                              src={al.image_url}
                              className="w-12 h-8 object-cover rounded border border-slate-700/80 hover:border-sky-500/50 hover:scale-105 transition-all cursor-zoom-in"
                              onClick={() => setSelectedImage(al.image_url)}
                              alt="ảnh sự cố"
                            />
                          ) : (
                            <span className="text-[9px] text-slate-500 italic">Không có</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-slate-200 font-semibold">{al.message}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-between items-center p-4 border-t border-[#27273a]/20 text-[10px] text-slate-400 alert-pagination select-none">
                <div>
                  Hiển thị {startIndex + 1} – {Math.min(startIndex + itemsPerPage, alerts.length)} / {alerts.length}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="alert-page-btn px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition disabled:opacity-30"
                  >
                    Trước
                  </button>
                  <span className="font-bold">Trang {currentPage} / {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="alert-page-btn px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition disabled:opacity-30"
                  >
                    Tiếp
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] bg-[#121318] p-2 rounded-2xl border border-slate-800 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute -top-12 right-0 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              className="max-w-full max-h-[75vh] object-contain rounded-xl"
              alt="Ảnh sự cố phóng to"
            />
          </div>
        </div>
      )}
    </div>
  );
}
