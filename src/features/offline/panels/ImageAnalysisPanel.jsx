import { Code, Copy, FileImage, RefreshCw, Upload } from 'lucide-react';

export function ImageAnalysisPanel({
  imageFile, imagePreview, imageResult, loadingImage,
  handleImageChange, handleImagePredict, handleCopyJSON
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
      <div className="space-y-4 lg:col-span-1">
        <h3 className="text-slate-200 font-bold text-sm">Tải Ảnh Lên</h3>

        <div className="border-2 border-dashed border-[#27273a] hover:border-sky-500/30 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center justify-center bg-[#181a24] text-center min-h-[160px] relative">
          <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          <Upload className="w-8 h-8 text-sky-400 mb-2" />
          <span className="text-xs font-semibold text-slate-300">Click hoặc kéo thả file ảnh</span>
          <span className="text-[10px] text-slate-500 mt-1">Định dạng JPG, PNG, WEBP tối đa 10MB</span>
        </div>

        {imagePreview && (
          <div className="bg-[#181a24] p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img src={imagePreview} className="w-10 h-10 object-cover rounded-lg" alt="Preview" />
              <div className="overflow-hidden">
                <span className="text-xs text-slate-200 font-medium truncate block">{imageFile?.name}</span>
                <span className="text-[10px] text-slate-500 block">{(imageFile?.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
            <button
              onClick={handleImagePredict}
              disabled={loadingImage}
              className="md3-btn-primary py-2 px-4 rounded-full text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
            >
              {loadingImage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Phân Tích'}
            </button>
          </div>
        )}

        {imageResult && (
          <div className="bg-[#181a24] p-4 rounded-2xl space-y-3 shadow-inner">
            <h4 className="text-xs font-bold text-slate-300">Nhãn Phát Hiện ({imageResult.detections?.length || 0}):</h4>
            {imageResult.detections?.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {imageResult.detections.map((det, index) => (
                  <div key={index} className="flex justify-between items-center bg-[#0b0c10] px-3.5 py-2.5 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[8px] ${
                        det.class_name === 'fire' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
                      }`}>{det.class_name}</span>
                      <span className="text-slate-400 text-[10px]">Độ tin cậy:</span>
                    </div>
                    <span className="text-slate-200 font-bold font-mono text-[11px]">{(det.confidence * 100).toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-2">Không phát hiện ngọn lửa hoặc khói trong ảnh.</p>
            )}
          </div>
        )}
      </div>

      <div className="lg:col-span-2 space-y-6 flex flex-col">
        <div className="bg-[#181a24] rounded-3xl p-5 space-y-3 shadow-inner">
          <h3 className="text-slate-200 font-bold text-sm">Ảnh Kết Quả Bounding Box</h3>
          <div className="bg-[#0b0c10] rounded-2xl overflow-hidden flex items-center justify-center min-h-[320px] relative">
            {loadingImage && (
              <div className="absolute inset-0 bg-[#0b0c10]/80 flex flex-col items-center justify-center text-slate-400 gap-2 z-10">
                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-semibold">Đang suy luận mô hình AI...</p>
              </div>
            )}
            {imageResult ? (
              <img src={imageResult.image} className="max-w-full max-h-[400px] object-contain rounded" alt="Predict Result" />
            ) : imagePreview ? (
              <img src={imagePreview} className="max-w-full max-h-[400px] object-contain opacity-30 rounded" alt="Uploaded Preview" />
            ) : (
              <div className="text-center p-8 text-slate-600 flex flex-col items-center gap-2.5">
                <FileImage className="w-8 h-8 text-slate-600" />
                <p className="text-xs font-bold text-slate-400">Chưa có ảnh nào được phân tích</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#181a24] rounded-3xl p-5 space-y-3 shadow-inner">
          <div className="flex justify-between items-center">
            <h3 className="text-slate-200 font-bold text-sm flex items-center gap-1.5">
              <Code className="w-4.5 h-4.5 text-sky-400" /> Dữ Liệu Kết Quả JSON
            </h3>
            {imageResult && (
              <button
                onClick={handleCopyJSON}
                className="bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full text-slate-300 hover:text-slate-100 transition text-[9px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-sky-400" /> Sao Chép JSON
              </button>
            )}
          </div>
          <div className="bg-[#0b0c10] rounded-2xl p-4 font-mono text-[10px] overflow-y-auto max-h-[240px] relative text-left">
            {imageResult ? (
              <pre className="text-emerald-400 font-semibold leading-relaxed">{JSON.stringify(imageResult.detections, null, 2)}</pre>
            ) : (
              <div className="h-16 flex items-center justify-center text-slate-600 text-xs">
                <span>Thông tin nhãn dạng JSON sẽ hiển thị sau khi suy luận thành công.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
