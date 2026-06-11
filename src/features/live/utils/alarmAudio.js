export const createAlarmController = (isMutedRef) => {
  let audioCtx = null;
  let alarmInterval = null;
  let currentLevel = null;

  const start = (level = 'warning') => {
    if (isMutedRef.current) return;
    
    // Nếu đang chạy và mức độ âm thanh giống nhau, bỏ qua
    if (alarmInterval && currentLevel === level) return;
    
    // Dừng còi cũ để thay đổi tần số/tốc độ còi mới
    stop();
    currentLevel = level;

    let intervalTime = 600;
    let startFreq = 850;
    let endFreq = 450;
    let type = 'sawtooth';
    let duration = 0.38;

    if (level === 'emergency') {
      intervalTime = 250;  // Dồn dập cảnh báo di tản
      startFreq = 1200;    // Cao độ chói tai kích thích hành động khẩn cấp
      endFreq = 600;
      duration = 0.2;
    } else if (level === 'early' || level === 'warning') {
      intervalTime = 1200; // Tần suất chậm để cảnh giác nhẹ
      startFreq = 500;     // Cao độ thấp, êm dịu hơn
      endFreq = 300;
      type = 'sine';       
      duration = 0.5;
    } else {
      // moderate - cháy vừa
      intervalTime = 600;
      startFreq = 850;
      endFreq = 450;
      duration = 0.38;
    }

    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }

      alarmInterval = setInterval(() => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration - 0.03);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration - 0.01);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      }, intervalTime);
    } catch (e) {
      console.error(e);
    }
  };

  const stop = () => {
    if (alarmInterval) {
      clearInterval(alarmInterval);
      alarmInterval = null;
    }
    currentLevel = null;
  };

  return { start, stop };
};
