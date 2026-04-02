import { useCallback, useEffect } from 'react';
import { Image as ImageIcon, Download } from 'lucide-react';
import { useCardMaker } from '../hooks/useCardMaker';
import { ASPECT_RATIOS } from '../models/cardTemplates';
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
    updateFormData,
    updateDayDetail,
    handleImageUpload,
    updateImageOffset,
    getCurrentTemplate,
    renderCanvas,
    renderCanvasSilent,
    setDayCount,
    setShowModal,
    aspectRatio,
    setAspectRatio,
    slotTransform
  } = useCardMaker();

  const template = getCurrentTemplate();
  const daySlots = template.imageSlots;
  const visibleDaySlots = daySlots.slice(0, dayCount);

  const resetToCurrentUrl = useCallback(() => {
    updateFormData('websiteUrl', window.location.href);
  }, [updateFormData]);

  // 當資料變化時重新渲染
  useEffect(() => {
    if (formData.showQRCode === undefined || formData.showQRCode === null) {
      updateFormData('showQRCode', true);
    }
    if (!formData.websiteUrl || formData.websiteUrl.trim() === '') {
      resetToCurrentUrl();
    }
    renderCanvas();
  }, [dayCount, dayDetails, formData, imageDatas, aspectRatio, renderCanvas, resetToCurrentUrl, updateFormData]);

  // Only re-render canvas when drag ends (not on every pointer-move).
  const handleDragEnd = useCallback(() => {
    renderCanvasSilent();
  }, [renderCanvasSilent]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'coser-card.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [canvasRef]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左側設定面板 */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl shadow-xl card-shadow p-6 h-full flex flex-col">
            <h2 className="text-2xl text-gray-800 text-center mb-6 flex items-center justify-center gap-2">
              <ImageIcon className="w-6 h-6 text-blue-600" />
              圖片內容設定
            </h2>

            {/* 比例選擇 */}
            <div className="mb-5">
              <label className="block text-sm text-gray-700 mb-2">輸出比例</label>
              <div className="flex gap-2">
                {Object.entries(ASPECT_RATIOS).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAspectRatio(key)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      aspectRatio === key
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 天數選擇 */}
            <div className="mb-5">
              <label className="block text-sm text-gray-700 mb-2">天數</label>
              <div className="flex gap-2">
                {supportedDayCounts.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setDayCount(count)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      dayCount === count
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {count}天
                  </button>
                ))}
              </div>
            </div>

            {/* 活動名稱 */}
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2">活動名稱</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="輸入活動名稱"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200"
              />
            </div>

            {/* 暱稱 */}
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2">暱稱</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => updateFormData('nickname', e.target.value)}
                placeholder="輸入暱稱"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200"
              />
            </div>

            {/* 類別選擇 */}
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2">類別</label>
              <div className="flex gap-4">
                {['COSER', '攝影', '官方'].map((val) => (
                  <label key={val} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={val}
                      checked={formData.category === val}
                      onChange={(e) => updateFormData('category', e.target.value)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">{val}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 留言內容 */}
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2">留言內容</label>
              <textarea
                value={formData.message}
                onChange={(e) => updateFormData('message', e.target.value)}
                placeholder="輸入留言內容"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg input-focus resize-none transition-all duration-200"
              />
            </div>

            {/* 各天角色名稱 */}
            <div className="mb-4">
              {visibleDaySlots.map((slot) => {
                const dayKey = slot.key;
                const dayNumber = getDayNumberFromKey(dayKey);
                return (
                  <div key={dayKey} className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600 whitespace-nowrap w-20 shrink-0">第{dayNumber}天角色</span>
                    <input
                      type="text"
                      value={dayDetails[dayKey]?.cosrole || ''}
                      onChange={(e) => updateDayDetail(dayKey, 'cosrole', e.target.value)}
                      placeholder="填入角色名稱"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200 text-sm"
                    />
                  </div>
                );
              })}
            </div>

            {/* 問題反饋連結 */}
            <div className="text-right text-sm/6 text-gray-500 mt-auto pt-4">
              <a href="https://forms.gle/ddpGAjKPXj1TsYVP9" target="_blank" rel="noopener noreferrer">
                遇到問題請點我反饋!
              </a>
            </div>
          </div>
        </div>

        {/* 右側預覽區域 */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl shadow-xl card-shadow p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1" />
              <h2 className="text-2xl text-gray-800">圖片預覽</h2>
              <div className="flex-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
                  title="下載圖片"
                >
                  <Download className="w-4 h-4" />
                  下載
                </button>
              </div>
            </div>

            <CardPreview
              canvasRef={canvasRef}
              isLoading={isLoading}
              onPreviewClick={() => setShowModal(true)}
              visibleDaySlots={visibleDaySlots}
              imageDatas={imageDatas}
              imageOffsets={imageOffsets}
              onUploadForDay={handleImageUpload}
              onOffsetChange={updateImageOffset}
              onDragEnd={handleDragEnd}
              slotTransform={slotTransform}
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
