import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';

const PreviewModal = ({ show, canvasRef, onClose }) => {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `card-preview-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL('image/png', 1.0);
      link.click();
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] overflow-auto">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg text-gray-800">卡片預覽</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="btn-primary py-2 px-3 text-sm flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              下載
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* 圖片內容 */}
        <div className="p-6 flex items-center justify-center">
          {canvasRef.current && (
            <img
              src={canvasRef.current.toDataURL()}
              alt="卡片預覽"
              className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
              onClick={onClose}
              style={{ cursor: 'pointer' }}
            />
          )}
        </div>
        
        <div className="p-4 text-center border-t border-gray-200">
          <p className="text-sm text-gray-500">
            點擊圖片或關閉按鈕關閉預覽
          </p>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;