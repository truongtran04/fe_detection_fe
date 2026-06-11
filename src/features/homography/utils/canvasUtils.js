export const getMousePosOnCanvas = (e, canvas) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / (rect.width || 1);
  const scaleY = canvas.height / (rect.height || 1);
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
};

export const drawPoint = (ctx, cx, cy, color, radius, label, coords) => {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${label} (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})m`, cx + radius + 4, cy + 3);
};

export const attachCanvasWheelZoom = (canvas, setZoom) => {
  const handleWheel = (e) => {
    e.preventDefault();
    setZoom(prev => {
      const nextZoom = e.deltaY < 0 ? prev * 1.1 : prev / 1.1;
      return Math.max(0.5, Math.min(5.0, nextZoom));
    });
  };
  canvas.addEventListener('wheel', handleWheel, { passive: false });
  return () => canvas.removeEventListener('wheel', handleWheel);
};
