export const TAB_IDS = ['live', 'predict', 'targeting', 'history'];

export const TAB_META = {
  live: {
    title: 'Luồng camera trực tuyến',
    subtitle: 'Webcam hoặc video stream thời gian thực, nhận diện khói lửa và xem nhật ký cảnh báo.'
  },
  predict: {
    title: 'Phân tích khói lửa từ ảnh và video',
    subtitle: 'Upload các file ảnh và video có sẵn để chạy nhận dạng AI khói lửa và trả về kết quả.'
  },
  targeting: {
    title: 'Hiệu Chuẩn Homography & Nhắm Bắn 3D',
    subtitle: 'Hiệu chuẩn 4 góc sàn trên ảnh camera, tính phép biến đổi Homography để mô phỏng tọa độ Oxy thực tế và góc bắn servo.'
  },
  history: {
    title: 'Lịch sử cảnh báo hệ thống',
    subtitle: 'Xem danh sách đầy đủ tất cả các sự cố khói lửa được phát hiện và lưu trữ trên PostgreSQL & Supabase.'
  }
};

export const parseTabFromPath = () => {
  const path = window.location.pathname.replace(/^\//, '');
  return TAB_IDS.includes(path) ? path : 'live';
};
