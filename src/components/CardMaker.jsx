import { useCallback, useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { Settings as SettingIcon } from 'lucide-react';
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
    handleTitleImageUpload,
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
    // 2026.4.24 Blackcat: 關閉QRCode顯示，部分臉書社團對於宣傳有些疑慮
    if (formData.showQRCode === undefined || formData.showQRCode === null) {
      updateFormData('showQRCode', false);
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
    <div className="container mx-auto px-4 py-2">
      <nav class="flex items-center justify-between p-4 text-white">
        {/* <!-- Left Side: Logo From favicon.ico --> */}
        <div class="flex items-center gap-2">
          <img src="/favicon.ico" alt="Logo" class="w-8 h-8" />
          <span class="font-bold text-lg text-gray-800">場次預定製作工具</span>
        </div>
      </nav>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左側設定面板 */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl shadow-xl card-shadow p-6 h-full">
            <h2 className="text-2xl text-gray-800 text-center mb-6 flex items-center justify-center gap-2">
              <SettingIcon className="w-6 h-6 text-blue-600" />
              內容設定
            </h2>

            <div className="mb-6">
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1" role="tablist" aria-label="內容設定分頁">
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
              </div>
            </div>

            {activeSettingsTab === 'basic' && (
              <>
                {/* 活動標題圖上傳 */}
                <div className="mb-4">
                  <ImageUpload
                    label="活動圖片"
                    onImageUpload={handleTitleImageUpload}
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

                {/* 身分選擇 */}
                <div className="mb-6">
                  <label className="block text-sm text-gray-700 mb-3">
                    身分
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {['COSER', '攝影', '官方', '路人'].map((category) => (
                      <button
                        key={category}
                        onClick={() => updateFormData('category', category)}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 font-medium text-sm ${
                          formData.category === category
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
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
            <h2 className="text-2xl text-gray-800 text-center mb-6 flex items-center justify-center gap-2">
              <ImageIcon className="w-6 h-6 text-blue-600" />
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