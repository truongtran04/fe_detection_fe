export const getInitialCorners = (w, h) => [
  { x: Math.round(w * 0.125), y: Math.round(h * 0.16) },
  { x: Math.round(w * 0.875), y: Math.round(h * 0.16) },
  { x: Math.round(w * 0.93), y: Math.round(h * 0.875) },
  { x: Math.round(w * 0.07), y: Math.round(h * 0.875) }
];

export const getScaledCeilingDefaults = (roomW, roomL) => {
  const scaleW = roomW / 6.0;
  const scaleL = roomL / 6.0;
  return {
    ceilingCctv: { x: -2.0 * scaleL, y: 2.0 * scaleW },
    ceilingNozzle: { x: 0.0 * scaleL, y: 0.0 * scaleW },
    simulatedFire: { x: 0.6 * scaleL, y: -0.6 * scaleW }
  };
};
