import * as THREE from 'three';

export const createTiltArcGeometry = (nx, ny, nz, tx, ty, tz, radius = 0.6) => {
  const points = [];
  // Hướng ngang từ nozzle tới target (chiếu lên mặt phẳng trần, Y=0 trong Three.js)
  const horizDir = new THREE.Vector3(tx - nx, 0, ty - ny);
  if (horizDir.lengthSq() < 1e-6) return null; // Target ngay dưới nozzle → tilt = 90°, không vẽ cung
  const startVec = horizDir.normalize(); // Bắt đầu từ đường ngang trên trần

  // Hướng thực tế từ nozzle xuống target (đường laser)
  const endVec = new THREE.Vector3(tx - nx, tz - nz, ty - ny).normalize();
  const angle = startVec.angleTo(endVec);
  const steps = 24;

  const axis = new THREE.Vector3().crossVectors(startVec, endVec).normalize();
  if (axis.lengthSq() < 1e-6) {
    return null;
  }

  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * angle;
    const pt = startVec.clone().applyAxisAngle(axis, theta).multiplyScalar(radius);
    points.push(new THREE.Vector3(nx + pt.x, nz + pt.y, ny + pt.z));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, 32, 0.012, 8, false);
};

export const createTextSprite = (text, color = '#f97316') => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color;
  ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.45, 0.45, 1.0);
  return sprite;
};
