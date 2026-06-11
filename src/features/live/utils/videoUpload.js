export const uploadSampleVideo = (file, { onProgress, onSuccess, onError }) => {
  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/upload-sample', true);

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      onProgress(Math.round((e.loaded / e.total) * 100));
    }
  };

  xhr.onload = () => {
    if (xhr.status === 200) onSuccess();
    else onError();
  };

  xhr.onerror = onError;
  xhr.send(formData);
  return xhr;
};
