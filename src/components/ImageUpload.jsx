import React, { useRef } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

const ImageUpload = ({ onImageUpload }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    console.log('iOS - File change triggered');
    const file = e.target.files?.[0];
    
    if (file) {
      console.log('iOS - File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      onImageUpload(file);
    } else {
      console.log('iOS - No file selected');
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    console.log('iOS - Click triggered');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm text-gray-700 mb-2">
        上傳圖片
      </label>
      
      <div
        onClick={handleClick}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-9 bg-blue-100 rounded-full flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">點擊上傳圖片</p>
            <p className="text-xs text-gray-500">支援 JPG, PNG 格式</p>
          </div>
          <div className="flex items-center gap-1 text-blue-600">
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">選擇檔案</span>
          </div>
        </div>
      </div>
      
      {/* 簡化 input 屬性 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ImageUpload;