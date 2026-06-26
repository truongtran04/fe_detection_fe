export const getMousePosOnCanvas = (e, canvas) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / (rect.width || 1);
  const scaleY = canvas.height / (rect.height || 1);
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
};

export const drawPoint = (ctx, cx, cy, color, radius, label, coords, align = 'right') => {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
  if (align === 'right') {
    ctx.textAlign = 'left';
    ctx.fillText(`${label} (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})m`, cx + radius + 4, cy + 3);
  } else if (align === 'left') {
    ctx.textAlign = 'right';
    ctx.fillText(`${label} (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})m`, cx - radius - 4, cy + 3);
  } else if (align === 'top') {
    ctx.textAlign = 'center';
    ctx.fillText(`${label} (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})m`, cx, cy - radius - 6);
  } else if (align === 'bottom') {
    ctx.textAlign = 'center';
    ctx.fillText(`${label} (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})m`, cx, cy + radius + 12);
  }
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
