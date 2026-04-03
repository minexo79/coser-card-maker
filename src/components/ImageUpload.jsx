import { useRef } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

const ImageUpload = ({ onImageUpload, label = '上傳圖片' }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    console.log('> File change triggered');
    const file = e.target.files?.[0];
    
    if (file) {
      console.log('> File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      onImageUpload(file);
    } else {
      console.log('> No file selected');
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    console.log('> Click triggered');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="mb-2">
      <label className="block text-sm text-gray-700 mb-2">
        {label}
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
            <ImageIcon className="w-6 h-6 text-blue-600" />
            <p className="text-xs font-medium">點擊上傳圖片 (支援 JPG, PNG 格式)</p>
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