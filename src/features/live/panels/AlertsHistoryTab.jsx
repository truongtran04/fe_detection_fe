import { useState, useEffect, Fragment } from 'react';
import { CheckCircle2, History, AlertTriangle, X, Trash2, ShieldAlert } from 'lucide-react';
import { fetchAlertsHistory, clearAlertsHistory } from '../utils/alertsApi.js';

export function AlertsHistoryTab({ showToast }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.ceil(alerts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAlerts = alerts.slice(startIndex, startIndex + itemsPerPage);

  if (currentPage > 1 && startIndex >= alerts.length) {
    setCurrentPage(1);
  }

  const loadHistory = async () => {
    try {
      const data = await fetchAlertsHistory();
      setAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleClear = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử cảnh báo này không?')) return;
    try {
      const res = await clearAlertsHistory();
      if (res.ok) {
        setAlerts([]);
        showToast('Đã xóa sạch lịch sử cảnh báo.', 'info');
      } else {
        showToast('Không thể xóa lịch sử.', 'error');
      }
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Panel */}
      <div className="glass-panel rounded-3xl p-6 flex justify-between items-center flex-wrap gap-4 text-left">
        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-indigo-500/10 rounded-2xl">
            <History className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg tracking-tight text-white m-0">NHẬT KÝ BÁO ĐỘNG HỎA HOẠN</h2>
            <p className="text-[11px] text-slate-400 mt-1">Lưu trữ tập trung và dài hạn sự cố khói/lửa trên hệ thống PostgreSQL &amp; Supabase Storage</p>
          </div>
        </div>
        {alerts.length > 0 && (
          <button
            onClick={handleClear}
            className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-lg shadow-red-600/20 flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Xóa Lịch Sử
          </button>
        )}
      </div>

      {/* Table Panel */}
      <div className="glass-panel rounded-3xl p-6 text-left">
        <div className="bg-[#0b0c10] rounded-2xl overflow-hidden min-h-[300px] shadow-inner">
          {loading ? (
            <div className="flex items-center justify-center p-20 text-slate-400 text-xs font-semibold">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3"></div>
              Đang tải danh sách sự cố từ PostgreSQL...
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-slate-500 text-center space-y-3.5">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-signal" />
              <div>
                <p className="font-bold text-slate-200 text-sm">Hệ Thống An Toàn</p>
                <p className="text-[11px] text-slate-500 mt-1">Không phát hiện sự cố khói lửa nào được ghi nhận trong lịch sử.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="overflow-x-auto">
              <table className="w-full text-slate-350 border-collapse">
                <thead>
                  <tr className="bg-[#181a24] text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4 text-left">Ngày</th>
                    <th className="px-6 py-4 text-left">Thời Gian</th>
                    <th className="px-6 py-4 text-left">Mức Độ</th>
                    <th className="px-6 py-4 text-left">Ảnh Chụp</th>
                    <th className="px-6 py-4 text-left">Nội Dung Sự Cố</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181a24] text-[11px] font-semibold">
                  {(() => {
                    let lastDate = null;
                    return paginatedAlerts.map((al) => {
                      const alertDate = al.date || al.timestamp?.split(' ')[0] || new Date().toLocaleDateString('sv');
                      const alertTime = al.time || al.timestamp?.split(' ')[1] || al.timestamp || '00:00:00';
                      
                      const isNewDate = alertDate !== lastDate;
                      lastDate = alertDate;

                      return (
                        <Fragment key={al.id}>
                          {isNewDate && (
                            <tr className="bg-indigo-950/20 text-indigo-400 font-bold border-y border-[#181a24] select-none">
                              <td className="px-6 py-3.5 text-left whitespace-nowrap">
                                <span className="flex items-center gap-2 text-xs text-indigo-300 font-bold uppercase tracking-wider">
                                  📅 Ngày {alertDate}
                                </span>
                              </td>
                              <td colSpan="4" className="px-6 py-3.5"></td>
                            </tr>
                          )}
                          <tr className="hover:bg-white/2 transition">
                            <td className="px-6 py-4 whitespace-nowrap"></td>
                            <td className="px-6 py-4 font-mono text-slate-300 whitespace-nowrap">{alertTime}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                                al.level === 'emergency' ? 'bg-red-500/15 text-red-400' :
                                al.level === 'warning' ? 'bg-amber-500/15 text-amber-400' :
                                'bg-slate-800 text-slate-400'
                              }`}>
                                {al.level === 'emergency' ? '🔥 Emergency' : '⚠️ Warning'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {al.image_url ? (
                                <img
                                  src={al.image_url}
                                  className="w-16 h-10 object-cover rounded-lg border border-slate-700/80 hover:border-indigo-500/50 hover:scale-105 transition-all cursor-zoom-in"
                                  onClick={() => setSelectedImage(al.image_url)}
                                  alt="ảnh sự cố"
                                  title="Click để phóng to ảnh"
                                />
                              ) : (
                                <span className="text-[10px] text-slate-500 italic font-medium">Không có ảnh</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-slate-200 font-semibold text-left max-w-md break-words">
                              {al.message}
                            </td>
                          </tr>
                        </Fragment>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {alerts.length > 0 && (
              <div className="flex justify-between items-center p-5 border-t border-[#181a24] text-xs text-slate-400 bg-[#0f1015]/40 select-none flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span>Số dòng mỗi trang:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-[#181a24] text-slate-200 border border-[#27273a] rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer font-bold"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <span>
                    Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, alerts.length)} trên tổng số {alerts.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3.5 py-2 rounded-xl bg-[#181a24] hover:bg-indigo-600/20 text-slate-200 disabled:opacity-30 disabled:hover:bg-[#181a24] cursor-pointer transition font-bold"
                    >
                      Trước
                    </button>
                    <span className="font-bold text-slate-300 px-1">
                      Trang {currentPage} / {totalPages || 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-3.5 py-2 rounded-xl bg-[#181a24] hover:bg-indigo-600/20 text-slate-200 disabled:opacity-30 disabled:hover:bg-[#181a24] cursor-pointer transition font-bold"
                    >
                      Tiếp
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Lightbox / Image Zoom Modal */}
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
