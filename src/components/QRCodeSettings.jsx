import React, { useState, useEffect } from 'react';
import { QrCode, Link, Eye, EyeOff } from 'lucide-react';

const QRCodeSettings = ({ formData, updateFormData }) => {
  const [] = useState(false);

  const resetToCurrentUrl = () => {
    updateFormData('websiteUrl', window.location.href);
  };

  // 元件載入時的初始化
  useEffect(() => {
    // 預設開啟 QR Code 顯示
    if (formData.showQRCode === undefined || formData.showQRCode === null) {
      updateFormData('showQRCode', true);
    }
    
    // 如果沒有網址或網址為空，則設定為當前網址
    if (!formData.websiteUrl || formData.websiteUrl.trim() === '') {
      resetToCurrentUrl();
    }
  }, []); // 空依賴陣列，只在元件首次載入時執行

//   return (
//     <div className="mb-6">
//       <label className="block text-sm font-semibold text-gray-700 mb-3">
//         <QrCode className="inline w-4 h-4 mr-1" />
//         QR Code 設定
//       </label>
      
//       {/* QR Code 開關 */}
//       <div className="mb-4">
//         <label className="flex items-center cursor-pointer">
//           <input
//             type="checkbox"
//             checked={formData.showQRCode || false} // 加上預設值避免 undefined
//             onChange={handleQRToggle}
//             className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
//           />
//           <span className="ml-2 text-sm font-medium text-gray-700 flex items-center gap-1">
//             {formData.showQRCode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
//             顯示 QR Code
//           </span>
//         </label>
//       </div>

//       {/* URL 輸入框 */}
//       {formData.showQRCode && (
//         <div className="space-y-3">
//           <div className="relative">
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <Link className="h-4 w-4 text-gray-400" />
//             </div>
//             <input
//               type="url"
//               value={formData.websiteUrl || ''} // 加上預設值避免 undefined
//               onChange={handleUrlChange}
//               onFocus={() => setUrlInputFocused(true)}
//               onBlur={() => setUrlInputFocused(false)}
//               placeholder="https://example.com"
//               className={`w-full pl-10 pr-4 py-2 border rounded-lg input-focus transition-all duration-200 ${
//                 urlInputFocused ? 'border-blue-500' : 'border-gray-300'
//               }`}
//             />
//           </div>
          
//           <div className="flex gap-2">
//             <button
//               type="button"
//               onClick={resetToCurrentUrl}
//               className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg transition-colors duration-200"
//             >
//               使用當前網址
//             </button>
//           </div>
          
//           <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
//             <p className="mb-1">💡 <strong>提示：</strong></p>
//             <ul className="list-disc list-inside space-y-1">
//               <li>QR Code 會顯示在卡片右下角</li>
//               <li>掃描後可直接訪問指定網址</li>
//               <li>支援任何有效的網址格式</li>
//             </ul>
//           </div>
//         </div>
//       )}
//     </div>
//   );
};

export default QRCodeSettings;