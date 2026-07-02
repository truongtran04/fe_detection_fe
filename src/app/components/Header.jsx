import { Menu, Sun, Moon } from 'lucide-react';
import { TAB_META } from '../../shared/constants/tabs.js';

export function Header({ activeTab, sidebarOpen, toggleSidebar, isDarkMode, toggleTheme }) {
  const meta = TAB_META[activeTab];

  return (
    <header className="h-24 px-8 flex justify-between items-center bg-[#121318]/40 backdrop-blur-md z-10 shrink-0 border-b border-slate-900/10">
      <div className="flex items-center gap-4 text-left">
        <button
          onClick={toggleSidebar}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition cursor-pointer flex items-center justify-center border border-slate-800/20"
          title={sidebarOpen ? "Đóng thanh menu" : "Mở thanh menu"}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-extrabold text-white tracking-tight m-0">{meta.title}</h2>
          <span className="text-[10px] text-slate-400 font-semibold block mt-1">{meta.subtitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
      </div>
    </header>
  );
}

