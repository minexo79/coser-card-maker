import { Info } from 'lucide-react';

const About = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="rounded-2xl p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl text-gray-800 mb-1 flex items-center justify-center gap-2">
            <Info className="w-6 h-6 text-orange-600" />
            關於本專案
          </h1>
          <p className="text-sm text-gray-500">Anicon DIVA CardMaker</p>
        </div>
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl card-shadow p-6 h-full">
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              以 React.JS + Python FastAPI 為網站架構的場次預定圖製作工具。
            </p>
            <p>
              只需填入暱稱與留言、選擇身分、上傳角色圖片，網站會即時預覽結果並下載 PNG 合成檔案。
            </p>
            <p className="text-xs mb-1">Developed by Blackcat.</p>
            <p className="text-xs mb-1">Web Icon by Flaticon / Font by LINE Seed.</p>
            <p className="text-xs mb-1">Default Figure Vectors by Vecteezy.</p>
            <p className="text-xs mb-1 text-orange-500">本專案採用 MIT License 授權。</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
