import { FileImage, FileVideo } from 'lucide-react';

export function SubTabSwitcher({ activeSubTab, setActiveSubTab }) {
  const btnClass = (tab) =>
    `flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${
      activeSubTab === tab
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
    }`;

  return (
    <div className="flex gap-4 border-b border-[#27273a]/40 pb-3">
      <button onClick={() => setActiveSubTab('image')} className={btnClass('image')}>
        <FileImage className="w-4 h-4" /> Nhận Diện Ảnh Tĩnh
      </button>
      <button onClick={() => setActiveSubTab('video')} className={btnClass('video')}>
        <FileVideo className="w-4 h-4" /> Xử Lý Video
      </button>
    </div>
  );
}
