import { CORNER_LABELS } from '../constants.js';
import { imagePixelToCctvCanvas } from '../utils/cctvCoords.js';

const drawCornerOrArrow = (ctx, pt, idx, labels, cW, cH) => {
  const MARGIN = 16;
  const isOut = pt.x < 0 || pt.x > cW || pt.y < 0 || pt.y > cH;
  if (!isOut) {
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#ef4444'; ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 8px Inter, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`C${idx + 1}·${labels[idx]}`, pt.x + 9, pt.y);
  } else {
    const clampedX = Math.max(MARGIN, Math.min(cW - MARGIN, pt.x));
    const clampedY = Math.max(MARGIN, Math.min(cH - MARGIN, pt.y));
    const angle = Math.atan2(pt.y - cH / 2, pt.x - cW / 2);
    ctx.save();
    ctx.translate(clampedX, clampedY);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(-14, 0); ctx.lineTo(0, 0);
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-7, -4); ctx.lineTo(-7, 4); ctx.closePath();
    ctx.fillStyle = '#ef4444'; ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 8px Inter, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(`C${idx + 1}·${labels[idx]}`, clampedX, clampedY + 6);
  }
};

export const drawCctvOverlay = (ctx, {
  layout,
  imageSize,
  cctvZoom,
  cctvPan,
  corners,
  cctvPixel,
  nozzlePixel,
  activeCornerCount = 4
}) => {
  const { cW, cH } = layout;
  ctx.clearRect(0, 0, cW, cH);

  const toCanvas = (pt) => imagePixelToCctvCanvas(pt, layout, imageSize, cctvZoom, cctvPan);
  const cCorners = corners.map(toCanvas);
  const cNozzle = toCanvas(nozzlePixel);
  const cCctv = toCanvas(cctvPixel);

  if (activeCornerCount > 0) {
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cCorners[0].x, cCorners[0].y);
    for (let i = 1; i < activeCornerCount; i++) {
      ctx.lineTo(cCorners[i].x, cCorners[i].y);
    }
    if (activeCornerCount === 4) {
      ctx.closePath();
      ctx.fillStyle = 'rgba(99,102,241,0.06)';
      ctx.fill();
    }
    ctx.stroke();
  }

  // Draw only the corners that have been placed
  for (let i = 0; i < activeCornerCount; i++) {
    drawCornerOrArrow(ctx, cCorners[i], i, CORNER_LABELS, cW, cH);
  }

  // Only draw targeting helper line and target markers if calibration is complete
  if (activeCornerCount === 4) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cCctv.x, cCctv.y); ctx.lineTo(cNozzle.x, cNozzle.y); ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath(); ctx.arc(cNozzle.x, cNozzle.y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#d946ef'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#d946ef'; ctx.font = 'bold 9px Inter';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('Vòi Phun', cNozzle.x + 11, cNozzle.y - 7);

    ctx.beginPath(); ctx.arc(cCctv.x, cCctv.y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#eab308'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#eab308'; ctx.font = 'bold 9px Inter';
    ctx.fillText('CCTV', cCctv.x + 11, cCctv.y - 7);
  }
};

