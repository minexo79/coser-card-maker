import { Info } from 'lucide-react';

const About = () => {
  return (
    <div className="container mx-auto px-4 pb-4 pt-10 md:pt-16">
      <div className="mx-auto max-w-2xl animate-fade-up">
        <div className="mb-8">
          <p className="eyebrow mb-4">Anicon DIVA CardMaker</p>
          <h1 className="text-4xl leading-tight text-fg flex items-center gap-3">
            <Info className="w-8 h-8 text-accent" />
            關於本專案
          </h1>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-6 h-full">
          <div className="space-y-4 text-sm text-fg-soft leading-relaxed">
            <p>
              以 React.JS + Python FastAPI 為網站架構的場次預定圖製作工具。
            </p>
            <p>
              只需填入暱稱與留言、選擇身分、上傳角色圖片，網站會即時預覽結果並下載 PNG 合成檔案。
            </p>
            <p className="text-xs mb-1">Developed by Blackcat.</p>
            <p className="text-xs mb-1">Web Icon by Flaticon / Font by LINE Seed.</p>
            <p className="text-xs mb-1">Default Figure Vectors by Vecteezy.</p>
            <p className="text-xs mb-1 text-accent">本專案採用 MIT License 授權。</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
