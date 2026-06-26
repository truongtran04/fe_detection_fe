import { CANVAS_ROOM_SCALE } from '../constants.js';

export const getCeilingCanvasSize = (wrapEl) => {
  const containerW = wrapEl ? Math.max(wrapEl.offsetWidth - 48, 200) : 300;
  const containerH = wrapEl ? Math.max(wrapEl.offsetHeight - 90, 200) : 450;
  return { w: containerW, h: containerH, scale: 1 };
};

export const createCeilingMappers = (roomW, roomL, ceilingZoom, ceilingPan) => {
  const roomToCeilingCanvas = (rx, ry, w, h) => {
    const scaleX = (w * CANVAS_ROOM_SCALE) / roomL;
    const scaleY = (h * CANVAS_ROOM_SCALE) / roomW;
    const scale = Math.min(scaleX, scaleY);
    const centerX = w / 2;
    const centerY = h / 2;
    const baseCx = centerX + rx * scale;
    const baseCy = centerY - ry * scale;
    const cx = (baseCx - centerX) * ceilingZoom + centerX + ceilingPan.x;
    const cy = (baseCy - centerY) * ceilingZoom + centerY + ceilingPan.y;
    return { cx, cy };
  };

  const ceilingCanvasToRoom = (cx, cy, w, h) => {
    const centerX = w / 2;
    const centerY = h / 2;
    const baseCx = (cx - ceilingPan.x - centerX) / ceilingZoom + centerX;
    const baseCy = (cy - ceilingPan.y - centerY) / ceilingZoom + centerY;
    const scaleX = (w * CANVAS_ROOM_SCALE) / roomL;
    const scaleY = (h * CANVAS_ROOM_SCALE) / roomW;
    const scale = Math.min(scaleX, scaleY);
    const rx = (baseCx - centerX) / scale;
    const ry = -(baseCy - centerY) / scale;
    return {
      x: Math.max(-roomL / 2, Math.min(roomL / 2, rx)),
      y: Math.max(-roomW / 2, Math.min(roomW / 2, ry))
    };
  };

  return { roomToCeilingCanvas, ceilingCanvasToRoom };
};

export const getNearestCorner = (rx, ry, roomW, roomL) => {
  const w_half = roomW / 2;
  const l_half = roomL / 2;
  const cornersList = [
    { name: 'Góc C1 (TL)', x: -l_half, y: w_half },
    { name: 'Góc C2 (TR)', x: l_half, y: w_half },
    { name: 'Góc C3 (BR)', x: l_half, y: -w_half },
    { name: 'Góc C4 (BL)', x: -l_half, y: -w_half }
  ];
  let minD = Infinity;
  let nearest = cornersList[0];
  cornersList.forEach(c => {
    const d = Math.hypot(rx - c.x, ry - c.y);
    if (d < minD) {
      minD = d;
      nearest = c;
    }
  });
  return nearest;
};

export const clampCeilingPan = (prev, dx, dy, cw, ch, roomW, roomL, ceilingZoom) => {
  const scaleX = cw / roomL;
  const scaleY = ch / roomW;
  const roomPxW = roomL * Math.min(scaleX, scaleY) * ceilingZoom;
  const roomPxH = roomW * Math.min(scaleX, scaleY) * ceilingZoom;
  const minVisible = 0.2;
  const maxPanX = cw * (1 - minVisible);
  const minPanX = -(roomPxW - cw * minVisible);
  const maxPanY = ch * (1 - minVisible);
  const minPanY = -(roomPxH - ch * minVisible);
  return {
    x: Math.max(minPanX, Math.min(maxPanX, prev.x + dx)),
    y: Math.max(minPanY, Math.min(maxPanY, prev.y + dy))
  };
};
