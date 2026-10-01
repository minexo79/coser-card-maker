import { Upload as ImageIcon } from 'lucide-react';

const Copyright = () => {

  return (
    <div className="mb-4">
      <div className="text-center text-sm/6 text-subtle mt-4">
        {/* 版權聲明 */}
        <p className="text-xs mb-2">AniconDIVA CardMaker @ Developed By Blackcat.</p>
        {/* GitHub 連結 */}
        <a href="https://github.com/minexo79/coser-card-maker" target="_blank" rel="noopener noreferrer">
          <img src="./github.svg" alt="GitHub" className="inline-block w-6 h-6 invert opacity-60 transition-opacity hover:opacity-100" />
        </a>
        {/* Kofi 連結 */}
        <a href="https://ko-fi.com/tsaixoblackcat" target="_blank" rel="noopener noreferrer" className="ml-4">
          <img src="./kofi.svg" alt="Ko-fi" className="inline-block w-6 h-6 invert opacity-60 transition-opacity hover:opacity-100" />
        </a>
      </div>
    </div>
  );
};

export default Copyright;