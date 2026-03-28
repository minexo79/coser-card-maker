import React from 'react';
import { ZoomIn } from 'lucide-react';

const CardPreview = ({ canvasRef, isLoading, onPreviewClick }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative bg-gray-50 rounded-xl p-4 w-full max-w-md mx-auto">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600 font-medium">生成中...</p>
            </div>
          </div>
        )}
        
        <canvas
          ref={canvasRef}
          onClick={onPreviewClick}
          className="w-full h-auto rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200 bg-white"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        {!isLoading && (
          <div className="absolute top-6 right-6 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200">
            <ZoomIn className="w-4 h-4" />
          </div>
        )}
      </div>
      
      <p className="text-sm text-gray-500 mt-4 text-center">
        點擊圖片可放大預覽與下載
      </p>
    </div>
  );
};

export default CardPreview;