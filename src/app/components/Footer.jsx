import { Info } from 'lucide-react';

export function Footer() {
  return (
    <footer className="h-10 flex items-center justify-between px-8 bg-[#0b0c10] text-[10px] text-slate-500 font-medium shrink-0">
      <span>&copy; 2026 AI Fire Defense Systems. Gộp dự án điều khiển dập lửa &amp; homography.</span>
      <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Version 3.0.0</span>
    </footer>
  );
}
