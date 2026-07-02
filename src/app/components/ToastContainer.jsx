export function ToastContainer({ toasts }) {
  return (
    <div className="fixed top-24 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl transition-all duration-300 transform translate-y-0 glass-panel-elevated border-l-4 ${
            toast.type === 'success' ? 'border-emerald-500' :
            toast.type === 'error' ? 'border-red-500' :
            'border-sky-500'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${
            toast.type === 'success' ? 'bg-emerald-500' :
            toast.type === 'error' ? 'bg-red-500' :
            'bg-sky-500'
          }`} />
          <span className="text-[11px] font-bold text-white tracking-wide">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
