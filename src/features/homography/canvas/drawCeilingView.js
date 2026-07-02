import { drawPoint } from '../utils/canvasUtils.js';
import { getNearestCorner } from '../utils/ceilingCoords.js';

export const drawCeilingView = (ctx, w, h, {
  roomW,
  roomL,
  ceilingCctv,
  ceilingNozzle,
  simulatedFire,
  isDemoImage,
  roomToCeilingCanvas,
  targets = []
}) => {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(11,12,16,1)';
  ctx.fillRect(0, 0, w, h);

  const spacing = 1.0;
  const gridExtX = roomL;
  const gridExtY = roomW;

  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([]);

  for (let rx = -gridExtX; rx <= gridExtX + 0.01; rx += spacing) {
    const pT = roomToCeilingCanvas(rx, gridExtY, w, h);
    const pB = roomToCeilingCanvas(rx, -gridExtY, w, h);
    ctx.beginPath(); ctx.moveTo(pT.cx, pT.cy); ctx.lineTo(pB.cx, pB.cy); ctx.stroke();
  }
  for (let ry = -gridExtY; ry <= gridExtY + 0.01; ry += spacing) {
    const pL = roomToCeilingCanvas(-gridExtX, ry, w, h);
    const pR = roomToCeilingCanvas(gridExtX, ry, w, h);
    ctx.beginPath(); ctx.moveTo(pL.cx, pL.cy); ctx.lineTo(pR.cx, pR.cy); ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(99,102,241,0.15)';
  ctx.lineWidth = 1;
  const axX0 = roomToCeilingCanvas(-gridExtX, 0, w, h);
  const axX1 = roomToCeilingCanvas(gridExtX, 0, w, h);
  ctx.beginPath(); ctx.moveTo(axX0.cx, axX0.cy); ctx.lineTo(axX1.cx, axX1.cy); ctx.stroke();
  const axY0 = roomToCeilingCanvas(0, gridExtY, w, h);
  const axY1 = roomToCeilingCanvas(0, -gridExtY, w, h);
  ctx.beginPath(); ctx.moveTo(axY0.cx, axY0.cy); ctx.lineTo(axY1.cx, axY1.cy); ctx.stroke();

  // Vẽ nhãn trục Ox, Oy rõ ràng
  ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = 'rgba(99,102,241,0.85)';
  
  // Trục Ox ở cuối bên phải
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Ox', axX1.cx + 8, axX1.cy);

  // Trục Oy ở trên cùng màn hình
  const topY = axY0.cy < axY1.cy ? axY0 : axY1;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Oy', topY.cx, topY.cy - 8);

  ctx.font = '8px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = 'rgba(100,116,139,0.7)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let rx = -gridExtX; rx <= gridExtX + 0.01; rx += spacing) {
    if (rx === 0) continue;
    const p = roomToCeilingCanvas(rx, 0, w, h);
    ctx.fillText(`${rx > 0 ? '+' : ''}${rx.toFixed(0)}`, p.cx, p.cy + 3);
  }
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let ry = -gridExtY; ry <= gridExtY + 0.01; ry += spacing) {
    if (ry === 0) continue;
    const p = roomToCeilingCanvas(0, ry, w, h);
    ctx.fillText(`${ry > 0 ? '+' : ''}${ry.toFixed(0)}`, p.cx - 3, p.cy);
  }

  const c1 = roomToCeilingCanvas(-roomL / 2, roomW / 2, w, h);
  const c2 = roomToCeilingCanvas(roomL / 2, roomW / 2, w, h);
  const c3 = roomToCeilingCanvas(roomL / 2, -roomW / 2, w, h);
  const c4 = roomToCeilingCanvas(-roomL / 2, -roomW / 2, w, h);

  ctx.fillStyle = 'rgba(99,102,241,0.06)';
  ctx.beginPath();
  ctx.moveTo(c1.cx, c1.cy); ctx.lineTo(c2.cx, c2.cy);
  ctx.lineTo(c3.cx, c3.cy); ctx.lineTo(c4.cx, c4.cy);
  ctx.closePath(); ctx.fill();

  ctx.strokeStyle = 'rgba(99,102,241,0.5)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(c1.cx, c1.cy); ctx.lineTo(c2.cx, c2.cy);
  ctx.lineTo(c3.cx, c3.cy); ctx.lineTo(c4.cx, c4.cy);
  ctx.closePath(); ctx.stroke();

  const cMidTop = roomToCeilingCanvas(0, roomW / 2, w, h);
  const cMidLeft = roomToCeilingCanvas(-roomL / 2, 0, w, h);
  ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = 'rgba(99,102,241,0.7)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText(`L=${roomL}m`, cMidTop.cx, cMidTop.cy - 3);
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText(`W=${roomW}m`, cMidLeft.cx - 4, cMidLeft.cy);

  const cornerLabels2D = [
    { pt: c1, label: 'C1', align: 'right', baseline: 'bottom' },
    { pt: c2, label: 'C2', align: 'left', baseline: 'bottom' },
    { pt: c3, label: 'C3', align: 'left', baseline: 'top' },
    { pt: c4, label: 'C4', align: 'right', baseline: 'top' },
  ];
  cornerLabels2D.forEach(({ pt, label, align, baseline }) => {
    const ox = align === 'left' ? 5 : -5;
    const oy = baseline === 'top' ? 5 : -5;
    ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillStyle = 'rgba(99,102,241,0.85)';
    ctx.fillText(label, pt.cx + ox, pt.cy + oy);
  });
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  const ptCctv = roomToCeilingCanvas(ceilingCctv.x, ceilingCctv.y, w, h);
  const ptNozzle = roomToCeilingCanvas(ceilingNozzle.x, ceilingNozzle.y, w, h);
  const ptFire = roomToCeilingCanvas(simulatedFire.x, simulatedFire.y, w, h);

  const nearest = getNearestCorner(ceilingCctv.x, ceilingCctv.y, roomW, roomL);
  const ptNearest = roomToCeilingCanvas(nearest.x, nearest.y, w, h);
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = 'rgba(234,179,8,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ptNearest.cx, ptNearest.cy); ctx.lineTo(ptCctv.cx, ptCctv.cy); ctx.stroke();
  ctx.setLineDash([]);

  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#0ea5e9';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ptCctv.cx, ptCctv.cy); ctx.lineTo(ptNozzle.cx, ptNozzle.cy); ctx.stroke();
  ctx.setLineDash([]);

  drawPoint(ctx, ptNozzle.cx, ptNozzle.cy, '#d946ef', 9, 'Vòi Phun', ceilingNozzle);
  drawPoint(ctx, ptCctv.cx, ptCctv.cy, '#eab308', 9, 'CCTV', ceilingCctv);

  let activeFirePt = null;
  if (isDemoImage) {
    activeFirePt = ptFire;
    drawPoint(ctx, ptFire.cx, ptFire.cy, '#ef4444', 11, '🔥 Lửa Mock', simulatedFire);
  } else if (targets && targets.length > 0) {
    targets.forEach((t) => {
      if (t.real && t.real.length >= 2) {
        const ptRealFire = roomToCeilingCanvas(t.real[0], t.real[1], w, h);
        if (!activeFirePt) {
          activeFirePt = ptRealFire;
        }
        drawPoint(
          ctx,
          ptRealFire.cx,
          ptRealFire.cy,
          '#ef4444',
          11,
          `🔥 ${t.class_name === 'fire' ? 'Lửa' : t.class_name === 'smoke' ? 'Khói' : t.class_name}`,
          { x: t.real[0], y: t.real[1] }
        );
      }
    });
  }

  if (activeFirePt) {
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ptNozzle.cx, ptNozzle.cy);
    ctx.lineTo(activeFirePt.cx, activeFirePt.cy);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  return {
    nearest,
    cameraOffset: { x: ceilingCctv.x - nearest.x, y: ceilingCctv.y - nearest.y }
  };
};
