import React, { useEffect } from 'react';
import { Download, Upload, Image as ImageIcon } from 'lucide-react';
import { useCardMaker } from '../hooks/useCardMaker';
import ImageUpload from './ImageUpload';
import CardPreview from './CardPreview';
import PreviewModal from './PreviewModal';

const CardMaker = () => {
  const {
    formData,
    imageData,
    isLoading,
    showModal,
    canvasRef,
    updateFormData,
    handleImageUpload,
    renderCanvas,
    setShowModal
  } = useCardMaker();

  const resetToCurrentUrl = () => {
    updateFormData('websiteUrl', window.location.href);
  };

  // 當資料變化時重新渲染
  useEffect(() => {
    // 預設開啟 QR Code 顯示
    if (formData.showQRCode === undefined || formData.showQRCode === null) {
      updateFormData('showQRCode', true);
    }
    
    // 如果沒有網址或網址為空，則設定為當前網址
    if (!formData.websiteUrl || formData.websiteUrl.trim() === '') {
      resetToCurrentUrl();
    }

    const timer = setTimeout(() => {
      renderCanvas();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [formData, imageData, renderCanvas]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左側設定面板 */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl shadow-xl card-shadow p-6 h-full">
            <h2 className="text-2xl text-gray-800 text-center mb-6 flex items-center justify-center gap-2">
              <ImageIcon className="w-6 h-6 text-blue-600" />
              圖片內容設定
            </h2>
            
            {/* 活動輸入 */}
            <div className="mb-4">
              <label className="block text-sm  text-gray-700 mb-2">
                活動名稱
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="輸入活動名稱"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200"
              />
            </div>

            {/* 暱稱輸入 */}
            <div className="mb-4">
              <label className="block text-sm  text-gray-700 mb-2">
                暱稱
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => updateFormData('nickname', e.target.value)}
                placeholder="輸入暱稱"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200"
              />
            </div>
            
            {/* 類別選擇 */}
            <div className="mb-6">
              <label className="block text-sm  text-gray-700 mb-3">
                類別
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value="COSER"
                    checked={formData.category === 'COSER'}
                    onChange={(e) => updateFormData('category', e.target.value)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">COSER</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value="攝影"
                    checked={formData.category === '攝影'}
                    onChange={(e) => updateFormData('category', e.target.value)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">攝影</span>
                </label>
                  <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value="官方"
                    checked={formData.category === '官方'}
                    onChange={(e) => updateFormData('category', e.target.value)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">官方</span>
                </label>
              </div>
            </div>

            {/* 留言內容 */}
            <div className="mb-4">
              <label className="block text-sm  text-gray-700 mb-2">
                留言內容
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => updateFormData('message', e.target.value)}
                placeholder="輸入留言內容"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg input-focus resize-none transition-all duration-200"
              />
            </div>
          

            {/* D1 的資訊框，左方日期，右方角色名稱 */}
            <div className="mb-4 grid grid-cols-2">
              {/* 日期 */}
              <div className="mb-4">
                <label className="block text-sm  text-gray-700 mb-2">
                  日期
                </label>
                <input
                  type="date"
                  id="start"
                  name="trip-start"
                  value={formData.date}
                  onChange={(e) => updateFormData('date', e.target.value)}
                  min="2001-01-01" 
                  max="2099-12-31">
                </input>
              </div>

              {/* 角色 */}
              <div className="mb-4">
                <label className="block text-sm  text-gray-700 mb-2">
                  角色名稱
                </label>
                <input
                  type="text"
                  value={formData.cosrole}
                  onChange={(e) => updateFormData('cosrole', e.target.value)}
                  placeholder="輸入角色名稱"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200"
                />
              </div>
            </div>

            {/* 圖片上傳 */}
            <ImageUpload onImageUpload={handleImageUpload} />
            
            {/* 圖片位置調整 */}
            {imageData && (
              <div className="mb-6">
                <label className="block text-sm  text-gray-700 mb-2">
                  圖片左右位置調整
                </label>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={formData.imageOffsetX}
                  onChange={(e) => updateFormData('imageOffsetX', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>左</span>
                  <span>中</span>
                  <span>右</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  拖動調整圖片在框內的左右位置
                </p>
              </div>
            )}
            
          </div>
        </div>

        {/* 右側預覽區域 */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-xl card-shadow p-6 h-full">
            <h2 className="text-2xl text-gray-800 text-center mb-6">
              圖片預覽
            </h2>
            
            <CardPreview
              canvasRef={canvasRef}
              isLoading={isLoading}
              onPreviewClick={() => setShowModal(true)}
            />
          </div>
        </div>
      </div>

      {/* 預覽模態框 */}
      <PreviewModal
        show={showModal}
        canvasRef={canvasRef}
        onClose={() => setShowModal(false)}
      />

      {/* 版權聲明 */}
      <div className="text-center text-sm/6 text-gray-500 mt-8">
        <p>AniconDIVA CardMaker 2026 @ Designed & Developed By Blackcat.</p>
      </div>
    </div>
  );
};

export default CardMaker;