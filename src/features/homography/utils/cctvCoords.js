export const getCctvImageLayout = (containerWidth, containerHeight, imageSize) => {
  if (!imageSize?.w) return null;
  const cW = containerWidth;
  const cH = containerHeight;
  const fitScale = Math.min(cW / imageSize.w, cH / imageSize.h);
  const imgDispW = imageSize.w * fitScale;
  const imgDispH = imageSize.h * fitScale;
  return {
    cW,
    cH,
    imgOffX: (cW - imgDispW) / 2,
    imgOffY: (cH - imgDispH) / 2,
    imgDispW,
    imgDispH
  };
};

export const imagePixelToCctvCanvas = (pt, layout, imageSize, cctvZoom, cctvPan) => {
  const { cW, cH, imgOffX, imgOffY, imgDispW, imgDispH } = layout;
  const centerX = cW / 2;
  const centerY = cH / 2;
  const baseCx = imgOffX + pt.x / imageSize.w * imgDispW;
  const baseCy = imgOffY + pt.y / imageSize.h * imgDispH;
  return {
    x: (baseCx - centerX) * cctvZoom + centerX + cctvPan.x,
    y: (baseCy - centerY) * cctvZoom + centerY + cctvPan.y
  };
};

export const cctvCanvasToImagePixel = (cx, cy, layout, imageSize, cctvZoom, cctvPan) => {
  const { imgOffX, imgOffY, imgDispW, imgDispH, cW, cH } = layout;
  const centerX = cW / 2;
  const centerY = cH / 2;
  const baseCx = (cx - cctvPan.x - centerX) / cctvZoom + centerX;
  const baseCy = (cy - cctvPan.y - centerY) / cctvZoom + centerY;
  return {
    x: Math.round((baseCx - imgOffX) / imgDispW * imageSize.w),
    y: Math.round((baseCy - imgOffY) / imgDispH * imageSize.h)
  };
};

export const getCctvCornerHitPos = (pt, cW, cH) => {
  const MARGIN = 16;
  const isOut = pt.x < 0 || pt.x > cW || pt.y < 0 || pt.y > cH;
  if (!isOut) return pt;
  return {
    x: Math.max(MARGIN, Math.min(cW - MARGIN, pt.x)),
    y: Math.max(MARGIN, Math.min(cH - MARGIN, pt.y))
  };
};
