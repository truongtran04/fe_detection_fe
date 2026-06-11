export const INITIAL_STATS = {
  frame: 0,
  total_detections: 0,
  fire_now: 0,
  smoke_now: 0,
  fire_accumulated: 0,
  smoke_accumulated: 0,
  max_fire_ratio: 0.0,
  max_smoke_ratio: 0.0,
  is_active: false
};

export const STREAM_TYPES = {
  NONE: 'none',
  MJPEG: 'mjpeg',
  WEBSOCKET: 'websocket'
};

export const DANGER_FRAME_THRESHOLD = {
  websocket: 15,
  mjpeg: 2
};
