import Loader from './Loader';

const CardPreview = ({ canvasRef, imageLayerRef, isLoading, onPreviewClick }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      {/* 預覽區容器，直接把圖片放大到跟Container一樣大 (max-w-md -> max-w-max) */}
      <div className="relative bg-ink border border-line rounded-xl p-4 w-full max-w-max mx-auto">
        {isLoading && (
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
            <div className="flex flex-col items-center gap-3">
              <Loader label="生成中…" />
            </div>
          </div>
        )}
        
        <canvas
          ref={canvasRef}
          onClick={onPreviewClick}
          className="w-full h-auto rounded-lg cursor-pointer transition-shadow duration-200 bg-white"
        />

        <canvas
          ref={imageLayerRef}
          style={{ display: 'none' }}
        />
        
      </div>
      
      <p className="text-sm text-muted mt-4 text-center">
        點擊圖片可放大預覽與下載
      </p>
    </div>
  );
};

export default CardPreview;