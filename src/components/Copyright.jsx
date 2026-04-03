import { Upload as ImageIcon } from 'lucide-react';

const Copyright = () => {

  return (
    <div className="mb-2">
      <div className="text-center text-sm/6 text-gray-500 mt-8">
        {/* 版權聲明 */}
        <p>AniconDIVA CardMaker 2026 @ Designed & Developed By Blackcat.</p>
        <p href="https://www.vecteezy.com/free-vector/figure" class="text-xs">Figure Vectors by Vecteezy.</p>
        <hr />
        {/* GitHub 連結 */}
        <a href="https://github.com/minexo79/coser-card-maker" target="_blank" rel="noopener noreferrer">
          <img src="/github.svg" alt="GitHub" className="inline-block w-6 h-6" />
        </a>
      </div>
    </div>
  );
};

export default Copyright;