import { useRef, useState, useEffect, useCallback } from 'react';
import { ZoomIn, Plus, Camera } from 'lucide-react';

const CardPreview = ({
  canvasRef,
  isLoading,
  onPreviewClick,
  visibleDaySlots,
  imageDatas,
  imageOffsets,
  onUploadForDay,
  onOffsetChange,
  onDragEnd,
  slotTransform,
}) => {
  const fileInputRef = useRef(null);
  const [uploadDayKey, setUploadDayKey] = useState(null);
  const [canvasDisplaySize, setCanvasDisplaySize] = useState({ width: 0, height: 0 });
  const [draggingKey, setDraggingKey] = useState(null);
  const dragState = useRef(null);

  // Track canvas rendered size for overlay positioning.
  useEffect(() => {
    const canvas = canvasRef?.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      setCanvasDisplaySize({ width: canvas.offsetWidth, height: canvas.offsetHeight });
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef]);

  const handleUploadClick = useCallback((dayKey, e) => {
    e.stopPropagation();
    setUploadDayKey(dayKey);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file && uploadDayKey && onUploadForDay) {
        onUploadForDay(file, uploadDayKey);
      }
    },
    [uploadDayKey, onUploadForDay],
  );

  // Map template slot coordinates to display pixel position on screen.
  const getSlotOverlayStyle = (slot) => {
    const canvas = canvasRef?.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0 || canvasDisplaySize.width === 0) return null;
    const displayScaleX = canvasDisplaySize.width / canvas.width;
    const displayScaleY = canvasDisplaySize.height / canvas.height;
    const { scaleX = 1, scaleY = 1 } = slotTransform || {};
    return {
      left: slot.x * scaleX * displayScaleX,
      top: slot.y * scaleY * displayScaleY,
      width: slot.width * scaleX * displayScaleX,
      height: slot.height * scaleY * displayScaleY,
      displayScaleX,
      displayScaleY,
    };
  };

  // Drag-to-pan handlers.
  const handlePointerDown = useCallback(
    (e, slotKey, tpp) => {
      e.stopPropagation();
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      const rawOffset = imageOffsets?.[slotKey] ?? { x: 0, y: 0 };
      const ox = typeof rawOffset === 'object' ? rawOffset.x : rawOffset;
      const oy = typeof rawOffset === 'object' ? rawOffset.y : 0;
      dragState.current = {
        key: slotKey,
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX: ox,
        startOffsetY: oy,
        tpp,
      };
      setDraggingKey(slotKey);
    },
    [imageOffsets],
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!dragState.current) return;
      const { key, startX, startY, startOffsetX, startOffsetY, tpp } = dragState.current;
      const newX = Math.round(startOffsetX + (e.clientX - startX) * tpp);
      const newY = Math.round(startOffsetY + (e.clientY - startY) * tpp);
      onOffsetChange?.(key, newX, newY);
    },
    [onOffsetChange],
  );

  const handlePointerUp = useCallback(() => {
    if (dragState.current) {
      dragState.current = null;
      setDraggingKey(null);
      onDragEnd?.();
    }
  }, [onDragEnd]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative bg-gray-50 rounded-xl p-4 w-full max-w-max mx-auto">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600 font-medium">載入中...</p>
            </div>
          </div>
        )}

        <div className="relative inline-block w-full">
          <canvas
            ref={canvasRef}
            onClick={onPreviewClick}
            className="w-full h-auto rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200 bg-white block"
            style={{ maxWidth: '100%', height: 'auto' }}
          />

          {visibleDaySlots &&
            visibleDaySlots.map((slot) => {
              const style = getSlotOverlayStyle(slot);
              if (!style) return null;
              const hasImage = !!(imageDatas?.[slot.key]);

              if (!hasImage) {
                return (
                  <button
                    key={slot.key}
                    type="button"
                    onClick={(e) => handleUploadClick(slot.key, e)}
                    className="absolute flex flex-col items-center justify-center gap-1 rounded border border-dashed border-white/50 bg-black/10 hover:bg-black/25 transition-all duration-200"
                    style={{ left: style.left, top: style.top, width: style.width, height: style.height }}
                    title={`上傳 ${slot.label} 照片`}
                  >
                    <Plus className="w-7 h-7 text-white/80 drop-shadow" />
                    <span className="text-white/80 text-xs font-medium drop-shadow">上傳照片</span>
                  </button>
                );
              }

              // Compute offsets in display-pixel space for CSS background-position.
              const rawOffset = imageOffsets?.[slot.key] ?? { x: 0, y: 0 };
              const offsetX = typeof rawOffset === 'object' ? rawOffset.x : rawOffset;
              const offsetY = typeof rawOffset === 'object' ? rawOffset.y : 0;
              const { scaleX = 1, scaleY = 1 } = slotTransform || {};
              const dispOffX = offsetX * scaleX * style.displayScaleX;
              const dispOffY = offsetY * scaleY * style.displayScaleY;

              // tpp: how many template units per 1 display pixel dragged.
              const tpp = style.width > 0 ? slot.width / style.width : 1;
              const isDragging = draggingKey === slot.key;

              return (
                <div
                  key={slot.key}
                  className="absolute group overflow-hidden"
                  style={{
                    left: style.left,
                    top: style.top,
                    width: style.width,
                    height: style.height,
                    // CSS background gives INSTANT visual feedback while canvas re-renders async.
                    backgroundImage: `url("${imageDatas[slot.key]}")`,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#d1d5db',
                    backgroundPosition: `calc(50% + ${dispOffX}px) calc(50% + ${dispOffY}px)`,
                    cursor: isLoading ? 'default' : isDragging ? 'grabbing' : 'grab',
                    pointerEvents: isLoading ? 'none' : 'auto',
                    userSelect: 'none',
                  }}
                  onPointerDown={(e) => handlePointerDown(e, slot.key, tpp)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  {/* Re-upload button – top-right, visible on hover */}
                  <button
                    type="button"
                    onClick={(e) => handleUploadClick(slot.key, e)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute top-1.5 right-1.5 bg-black/55 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
                    title="重新上傳"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>

                  {/* Coordinate display – bottom-left, visible during drag or hover */}
                  <div
                    className={`absolute bottom-1.5 left-1.5 text-[10px] font-mono bg-black/60 text-white/90 px-1.5 py-0.5 rounded pointer-events-none transition-opacity duration-150
                      ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  >
                    {offsetX >= 0 ? '+' : ''}{offsetX}, {offsetY >= 0 ? '+' : ''}{offsetY}
                  </div>

                  {/* Drag hint – bottom-right, visible on hover when not dragging */}
                  {!isDragging && (
                    <div className="absolute bottom-1.5 right-1.5 text-[10px] bg-black/50 text-white/80 px-1.5 py-0.5 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      拖曳移動
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {!isLoading && (
          <div className="absolute top-6 right-6 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <ZoomIn className="w-4 h-4" />
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500 mt-4 text-center">
        拖曳圖片可調整位置，右上角相機圖示可重新上傳
      </p>
    </div>
  );
};

export default CardPreview;