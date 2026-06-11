import { useState, useEffect, useRef } from 'react';

export function useOfflineAnalysis({ conf, iou, showToast }) {
  const [activeSubTab, setActiveSubTab] = useState('image');

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageResult, setImageResult] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);

  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoStatus, setVideoStatus] = useState('none');
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDownloadUrl, setVideoDownloadUrl] = useState(null);
  const [videoError, setVideoError] = useState(null);
  const videoPollIntervalRef = useRef(null);

  useEffect(() => () => {
    if (videoPollIntervalRef.current) clearInterval(videoPollIntervalRef.current);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageResult(null);
    }
  };

  const handleImagePredict = async () => {
    if (!imageFile) return;
    setLoadingImage(true);
    setImageResult(null);
    showToast('Đang phân tích hình ảnh tĩnh...', 'info');

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('conf', conf);
    formData.append('iou', iou);

    try {
      const res = await fetch('/api/predict-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setImageResult(data);
        showToast('Phân tích hình ảnh thành công!', 'success');
      } else {
        showToast('Lỗi phân tích: ' + (data.detail || 'Không rõ nguyên nhân'), 'error');
      }
    } catch (err) {
      showToast('Không kết nối được API: ' + err.message, 'error');
    } finally {
      setLoadingImage(false);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setVideoStatus('none');
      setVideoProgress(0);
      setVideoDownloadUrl(null);
      setVideoError(null);
    }
  };

  const startPollingVideoStatus = (taskId) => {
    if (videoPollIntervalRef.current) clearInterval(videoPollIntervalRef.current);

    videoPollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/video-status/${taskId}`);
        const data = await res.json();
        if (res.ok) {
          setVideoStatus(data.status);
          setVideoProgress(data.progress);
          if (data.status === 'completed') {
            clearInterval(videoPollIntervalRef.current);
            setVideoDownloadUrl(data.download_url);
            showToast('Xử lý video hoàn tất thành công!', 'success');
          } else if (data.status === 'failed') {
            clearInterval(videoPollIntervalRef.current);
            setVideoError(data.error || 'Xử lý video thất bại.');
            showToast('Xử lý video thất bại.', 'error');
          }
        }
      } catch (err) {
        console.error('Lỗi polling status video:', err);
      }
    }, 2000);
  };

  const handleVideoProcess = async () => {
    if (!videoFile) return;
    setVideoStatus('pending');
    setVideoProgress(0);
    setVideoError(null);
    setVideoDownloadUrl(null);
    showToast('Đang bắt đầu xử lý video AI...', 'info');

    const formData = new FormData();
    formData.append('file', videoFile);
    formData.append('conf', conf);
    formData.append('iou', iou);

    try {
      const res = await fetch('/api/predict-video', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.task_id) {
        showToast('Đã khởi chạy tác vụ xử lý video nền.', 'success');
        startPollingVideoStatus(data.task_id);
      } else {
        setVideoStatus('failed');
        setVideoError(data.detail || 'Lỗi khởi chạy tác vụ xử lý video.');
        showToast('Lỗi khởi chạy tác vụ xử lý video.', 'error');
      }
    } catch (err) {
      setVideoStatus('failed');
      setVideoError(err.message);
      showToast('Lỗi: ' + err.message, 'error');
    }
  };

  const handleCopyJSON = () => {
    if (!imageResult) return;
    navigator.clipboard.writeText(JSON.stringify(imageResult.detections, null, 2));
    showToast('Đã sao chép dữ liệu kết quả JSON!', 'success');
  };

  return {
    activeSubTab, setActiveSubTab,
    imageFile, imagePreview, imageResult, loadingImage,
    handleImageChange, handleImagePredict, handleCopyJSON,
    videoFile, videoPreview, videoStatus, videoProgress,
    videoDownloadUrl, videoError,
    handleVideoChange, handleVideoProcess
  };
}
