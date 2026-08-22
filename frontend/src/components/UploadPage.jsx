import { useState } from 'react';
import { Upload, Save, FolderOpen } from 'lucide-react';
import { useCardMakerContext } from '../contexts/useCardMakerContext';
import ImageUpload from './ImageUpload';
import Copyright from './Copyright';

const UploadPage = () => {
  const {
    handleBaseImageUpload,
    saveCard,
    loadCard
  } = useCardMakerContext();
  
  const [savedCardId, setSavedCardId] = useState(null);
  const [loadCardIdInput, setLoadCardIdInput] = useState('');

  const handleSaveToServer = async () => {
    const id = await saveCard();
    if (id) setSavedCardId(id);
  };

  const handleLoadFromServer = async (cardId) => {
    const id = cardId || loadCardIdInput.trim();
    if (!id) return;
    if (await loadCard(id)) setSavedCardId(id);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-xl card-shadow p-6">
        <h2 className="text-xl text-gray-800 text-center mb-6 flex items-center justify-center gap-2">
          <Upload className="w-6 h-6 text-blue-600" />
          圖片上傳與雲端儲存
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側：圖片上傳 */}
          <div>
            <h3 className="text-base font-medium text-gray-700 mb-4">
              活動圖片
            </h3>
            <div className="mb-4">
              <ImageUpload
                onImageUpload={handleBaseImageUpload}
              />
            </div>
          </div>

          {/* 右側：雲端儲存 */}
          <div>
            <h3 className="text-base font-medium text-gray-700 mb-4">
              雲端儲存
            </h3>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={handleSaveToServer}
className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-1"
              >
                <Save className="w-4 h-4" />
                儲存到伺服器
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={loadCardIdInput}
                onChange={(e) => setLoadCardIdInput(e.target.value)}
                placeholder="輸入卡片 ID"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg input-focus transition-all duration-200 text-sm"
              />
              <button
                type="button"
                onClick={() => handleLoadFromServer()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all duration-200"
              >
                <FolderOpen className="w-4 h-4 mr-1" />
                載入
              </button>
            </div>
            {savedCardId && (
              <p className="mt-3 text-xs text-gray-500 break-all">
                分享連結：
                <a href={`/card/${savedCardId}`} className="text-blue-600 hover:underline">
                  /card/{savedCardId}
                </a>
              </p>
            )}

            <div className="mt-8 border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500 leading-relaxed">
                上傳的圖片會直接儲存至後端伺服器，並套用至右側與首頁的即時預覽。
                完成後可將卡片儲存至伺服器，取得分享連結供他人檢視與下載。
              </p>
            </div>
          </div>
        </div>
      </div>

      <Copyright />
    </div>
  );
};

export default UploadPage;