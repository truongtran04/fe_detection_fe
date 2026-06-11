export const createClientSideDemoBlob = () => new Promise((resolve) => {
  const tmp = document.createElement('canvas');
  tmp.width = 640; tmp.height = 480;
  const t = tmp.getContext('2d');
  t.fillStyle = '#1e293b'; t.fillRect(0, 0, 640, 480);
  t.strokeStyle = '#334155'; t.lineWidth = 1;
  for (let i = 0; i <= 640; i += 40) { t.beginPath(); t.moveTo(i, 0); t.lineTo(i, 480); t.stroke(); }
  for (let j = 0; j <= 480; j += 40) { t.beginPath(); t.moveTo(0, j); t.lineTo(640, j); t.stroke(); }
  t.strokeStyle = '#64748b'; t.lineWidth = 2;
  t.strokeRect(80, 80, 480, 340);
  t.beginPath(); t.arc(360, 310, 24, 0, 2 * Math.PI); t.fillStyle = '#f97316'; t.fill();
  t.beginPath(); t.arc(360, 310, 16, 0, 2 * Math.PI); t.fillStyle = '#ef4444'; t.fill();
  t.beginPath(); t.arc(360, 310, 8, 0, 2 * Math.PI); t.fillStyle = '#eab308'; t.fill();
  tmp.toBlob((blob) => resolve(blob), 'image/jpeg');
});

export const fetchDemoImageBlob = async () => {
  try {
    const res = await fetch('/api/demo-image-mock');
    if (res.ok) return await res.blob();
  } catch {
    // fall through to client-side demo
  }
  return createClientSideDemoBlob();
};
