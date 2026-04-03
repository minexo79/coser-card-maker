import { useCallback, useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useCardMaker } from '../hooks/useCardMaker';
import ImageUpload from './ImageUpload';
import CardPreview from './CardPreview';
import PreviewModal from './PreviewModal';
import Copyright from './Copyright';

const getDayNumberFromKey = (dayKey) => {
  const match = /^d(\d+)$/i.exec(dayKey || '');
  if (!match) return '?';
  return match[1];
};

const CardMaker = () => {
  const {
    formData,
    imageDatas,
    imageOffsets,
    dayDetails,
    dayCount,
    supportedDayCounts,
    isLoading,
    showModal,
    canvasRef,
    getCurrentDateString,
    updateFormData,
    updateDayDetail,
    handleImageUpload,
    getCurrentTemplate,
    renderCanvas,
    setDayCount,
    setShowModal
  } = useCardMaker();

  const template = getCurrentTemplate();
  const daySlots = template.imageSlots;
  const visibleDaySlots = daySlots.slice(0, dayCount);
  const [activeDayKey, setActiveDayKey] = useState('d1');
  const [activeSettingsTab, setActiveSettingsTab] = useState('basic');
  const activeSlot = visibleDaySlots.find((slot) => slot.key === activeDayKey) || visibleDaySlots[0] || null;
  const activeSlotKey = activeSlot?.key;

  const renderDaySlot = (slot) => {
    const dayKey = slot.key;
    const dayNumber = getDayNumberFromKey(dayKey);
    const detail = dayDetails[dayKey];
    const imageData = imageDatas[dayKey];
    const imageOffset = imageOffsets[dayKey] ?? 0;

    return (
      <div key={dayKey} className="mb-6 rounded-lg border border-gray-200 p-4">
        <div className="mb-2 gap-3">
          {/* <div>
            <label className="block text-xs mb-2">日期</label>
            <input
              type="text"
              value={detail?.date || getCurrentDateString()}
              readOnly
              placeholder='請在上方設定日期'
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-sm"
            />
          </div> */}
          <div>
            <label className="block text-xs text-gray-700 mb-2">{detail?.date || getCurrentDateString()} 角色名稱</label>
            <input
              type="text"
              value={detail?.cosrole || ''}
              onChange={(e) => updateDayDetail(dayKey, 'cosrole', e.target.value)}
              placeholder="輸入角色名稱"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200 text-sm"
            />
          </div>
        </div>

        <ImageUpload
          label={`上傳圖片 (${slot.label} DAY ${dayNumber})`}
          onImageUpload={(file) => handleImageUpload(file, dayKey)}
        />

        {imageData && (
          <div>
            <label className="block text-sm text-gray-700 mb-2">圖片左右位置調整</label>
            <input
              type="range"
              min="-50"
              max="50"
              step="1"
              value={imageOffset}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (dayKey === 'd1') {
                  updateFormData('imageOffsetX', value);
                } else {
                  updateDayDetail(dayKey, 'imageOffsetX', value);
                }
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>左</span>
              <span>中</span>
              <span>右</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">拖動調整圖片在框內的左右位置</p>
          </div>
        )}
      </div>
    );
  };

  const resetToCurrentUrl = useCallback(() => {
    updateFormData('websiteUrl', window.location.href);
  }, [updateFormData]);

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
  }, [dayCount, dayDetails, formData, imageDatas, imageOffsets, renderCanvas, resetToCurrentUrl, updateFormData]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左側設定面板 */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl shadow-xl card-shadow p-6 h-full">
            <h2 className="text-2xl text-gray-800 text-center mb-6 flex items-center justify-center gap-2">
              <ImageIcon className="w-6 h-6 text-blue-600" />
              內容設定
            </h2>

            <div className="mb-6">
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-100 p-1" role="tablist" aria-label="內容設定分頁">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeSettingsTab === 'basic'}
                  onClick={() => setActiveSettingsTab('basic')}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-all ${
                    activeSettingsTab === 'basic' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-white/70'
                  }`}
                >
                  基本資訊
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeSettingsTab === 'schedule'}
                  onClick={() => setActiveSettingsTab('schedule')}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-all ${
                    activeSettingsTab === 'schedule' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-white/70'
                  }`}
                >
                  預定資訊
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeSettingsTab === 'social'}
                  onClick={() => setActiveSettingsTab('social')}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-all ${
                    activeSettingsTab === 'social' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-white/70'
                  }`}
                >
                  社群資訊
                </button>
              </div>
            </div>

            {activeSettingsTab === 'basic' && (
              <>
                {/* 活動輸入 */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-700 mb-2">
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
              </>
            )}

            {activeSettingsTab === 'schedule' && (
              <>
                {/* 日期設定 & 天數切換 */}
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">起始日期</label>
                    <input
                      type="date"
                      value={dayDetails.d1?.date || new Date().toISOString().split('T')[0]} // 預設為今天
                      onChange={(e) => updateDayDetail('d1', 'date', e.target.value)}
                      min="2001-01-01"
                      max="2099-12-31"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200 text-base"
                      style={{ WebkitAppearance: 'none', appearance: 'none', color: '#000', backgroundColor: '#fff', colorScheme: 'light' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">天數</label>
                    <select
                      value={dayCount}
                      onChange={(e) => setDayCount(parseInt(e.target.value, 10))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200"
                      style={{ WebkitAppearance: 'none', appearance: 'none', color: '#000', backgroundColor: '#fff', colorScheme: 'light' }}
                      
                    >
                      {supportedDayCounts.map((count) => (
                        <option key={count} value={count}>{count}天</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* DaySlot 區塊：以 Tab 切換 Day X 設定 */}
                {visibleDaySlots.length > 1 && (
                  <div className="mb-4">
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1" role="tablist" aria-label="天數設定切換">
                      {visibleDaySlots.map((slot) => {
                        const isActive = activeSlotKey === slot.key;
                        const label = `${slot.label} DAY ${getDayNumberFromKey(slot.key)}`;

                        return (
                          <button
                            key={slot.key}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setActiveDayKey(slot.key)}
                            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                              isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-white/70'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeSlot && renderDaySlot(activeSlot)}
              </>
            )}

            {activeSettingsTab === 'social' && (
              <>
                <div className="mb-4">
                  <p>TODO</p>
                </div>
              </>
            )}

            {/* 問題反饋連結 */}
            <div className="text-right text-sm/6 text-gray-500 mt-8">
              <a href="https://forms.gle/ddpGAjKPXj1TsYVP9" target="_blank" rel="noopener noreferrer">
                遇到問題請點我反饋!
              </a>
            </div>
          </div>
        </div>

        {/* 右側預覽區域 */}
        <div className="lg:col-span-7">
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
      <Copyright />
    </div>
  );
};

export default CardMaker;