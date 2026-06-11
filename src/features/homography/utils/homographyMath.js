const solveGaussian = (A, b) => {
  const n = b.length;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
    }
    const tempRow = A[i]; A[i] = A[maxRow]; A[maxRow] = tempRow;
    const tempVal = b[i]; b[i] = b[maxRow]; b[maxRow] = tempVal;
    if (Math.abs(A[i][i]) < 1e-12) return null;
    for (let k = i + 1; k < n; k++) {
      const factor = A[k][i] / A[i][i];
      for (let j = i; j < n; j++) A[k][j] -= factor * A[i][j];
      b[k] -= factor * b[i];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) sum += A[i][j] * x[j];
    x[i] = (b[i] - sum) / A[i][i];
  }
  return x;
};

export const findHomography = (src, dst) => {
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const x = src[i][0], y = src[i][1], u = dst[i][0], v = dst[i][1];
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v]);
    b.push(v);
  }
  const h = solveGaussian(A, b);
  if (!h) return null;
  return [[h[0], h[1], h[2]], [h[3], h[4], h[5]], [h[6], h[7], 1.0]];
};

export const projectPoint = (x, y, H) => {
  if (!H) return null;
  const w = H[2][0] * x + H[2][1] * y + H[2][2];
  if (Math.abs(w) < 1e-9) return null;
  return {
    x: (H[0][0] * x + H[0][1] * y + H[0][2]) / w,
    y: (H[1][0] * x + H[1][1] * y + H[1][2]) / w
  };
};

export const projectPixelToReal = (u, v, H) => {
  const pt = projectPoint(u, v, H);
  return pt ? { x: pt.x, y: pt.y } : { x: 0, y: 0 };
};

export const projectRealToPixel = (x, y, HInv) => {
  const pt = projectPoint(x, y, HInv);
  return pt ? { x: Math.round(pt.x), y: Math.round(pt.y) } : { x: 0, y: 0 };
};

export const buildRoomHomography = (corners, roomW, roomL) => {
  const w_half = roomW / 2;
  const l_half = roomL / 2;
  const realCorners = [
    [-l_half, w_half],
    [l_half, w_half],
    [l_half, -w_half],
    [-l_half, -w_half]
  ];
  const pixelCorners = corners.map(c => [c.x, c.y]);
  const H = findHomography(pixelCorners, realCorners);
  const HInv = findHomography(realCorners, pixelCorners);
  return { H, HInv };
};
