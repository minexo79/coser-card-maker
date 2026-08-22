import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import ElementOverlay from './ElementOverlay.jsx';
import { clamp, normalizeRect } from '../../utils/geometry.js';
import { resolveAssetUrl } from '../../services/api.js';
import { usePointerDrag } from './usePointerDrag.js';

const isUploadedAsset = (path) => {
  if (!path) return false;
  return /^(https?:|data:|blob:)/.test(path) || path.startsWith('/uploads/');
};

const MIN_SIZE = 8;

// 依縮放手把與拖曳位移，計算新的矩形（邏輯座標）。
function computeResizeBox(origin, dx, dy, handle) {
  let { x, y, width, height } = origin;
  if (handle.includes('e')) width = origin.width + dx;
  if (handle.includes('s')) height = origin.height + dy;
  if (handle.includes('w')) {
    x = origin.x + dx;
    width = origin.width - dx;
  }
  if (handle.includes('n')) {
    y = origin.y + dy;
    height = origin.height - dy;
  }
  return normalizeRect({ x, y, width, height }).rect;
}

const checkerboard = {
  backgroundImage:
    'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0'
};

const BaseImage = ({ src }) => {
  if (!src) {
    return (
      <div
        data-testid="template-canvas-placeholder"
        className="absolute inset-0 flex items-center justify-center text-sm text-gray-400"
      >
        尚未上傳底圖，前往上方「上傳底圖」或於工具列載入
      </div>
    );
  }
  const cover = isUploadedAsset(src);
  return (
    <img
      data-testid="template-canvas-base-image"
      src={resolveAssetUrl(src)}
      alt="底圖"
      draggable={false}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: cover ? 'cover' : 'fill',
        pointerEvents: 'none',
        userSelect: 'none'
      }}
    />
  );
};

const TemplateCanvas = ({
  width = 1200,
  height = 700,
  elements = [],
  selectedId = null,
  baseImagePath = '',
  slotImages = {},
  disabled = false,
  onSelect,
  onElementChange,
  onElementChangeEnd,
  showLabels = true
}) => {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  const {
    start,
    move: moveInteraction,
    end: endInteraction
  } = usePointerDrag();

  // 依容器寬度算出縮放比（此渲染僅 LOGO/佔位用，繪圖統一用邏輯座標）。
  useLayoutEffect(() => {
    const node = wrapRef.current;
    if (!node) return () => {};
    const update = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0) setScale(rect.width / width);
    };
    update();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(update);
      observer.observe(node);
      return () => observer.disconnect();
    }
    return undefined;
  }, [width]);

  // 由拖曳位移計算下一個方塊（指派 onElementChange）。
  const applyMove = useCallback(
    (result) => {
      if (!result) return;
      const { meta, dx, dy } = result;
      const origin = meta.originBox;
      let nextBox;
      if (meta.mode === 'move') {
        nextBox = {
          x: clamp(Math.round(origin.x + dx), 0, Math.max(0, width - origin.width)),
          y: clamp(Math.round(origin.y + dy), 0, Math.max(0, height - origin.height)),
          width: origin.width,
          height: origin.height
        };
      } else {
        const resized = computeResizeBox(origin, dx, dy, meta.handle);
        nextBox = {
          ...resized,
          width: Math.max(resized.width, MIN_SIZE),
          height: Math.max(resized.height, MIN_SIZE)
        };
      }
      onElementChange?.(meta.id, nextBox);
    },
    [height, onElementChange, width]
  );

  const handlePointerMove = useCallback(
    (event) => {
      applyMove(moveInteraction(event));
    },
    [applyMove, moveInteraction]
  );

  const handlePointerEnd = useCallback(
    (event) => {
      const result = endInteraction(event);
      // 只在「曾有拖曳」時通知結束，避免多餘的 onElementChangeEnd
      if (result) onElementChangeEnd?.();
    },
    [endInteraction, onElementChangeEnd]
  );

  // 開始拖曳（移動或縮放）。
  const handleStartDrag = useCallback(
    (event, element, mode, handle = null) => {
      if (disabled) return;
      event.preventDefault();
      // 避免拖曳時選取到文字
      event.stopPropagation();
      start(event, {
        id: element.id,
        mode,
        handle,
        originBox: { ...element.box }
      });
      onSelect?.(element.id);
    },
    [disabled, onSelect, start]
  );

  return (
    <div
      ref={wrapRef}
      data-testid="template-canvas"
      className="w-full"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      <div
        data-testid="template-canvas-inner"
        className="relative w-full overflow-hidden rounded-md border border-gray-300"
        style={{ ...checkerboard, aspectRatio: `${width} / ${height}` }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            onSelect?.(null);
          }
        }}
      >
        {/* 實際邏輯畫布；外面縮放，內部維持邏輯座標。 */}
        <div
          className="absolute left-0 top-0"
          style={{
            width,
            height,
            transformOrigin: 'top left',
            transform: `scale(${scale})`
          }}
        >
          <CanvasInner
            width={width}
            height={height}
            baseImagePath={baseImagePath}
            elements={elements}
            slotImages={slotImages}
            selectedId={selectedId}
            disabled={disabled}
            showLabels={showLabels}
            onStartDrag={handleStartDrag}
          />
        </div>
      </div>
    </div>
  );
};

const CanvasInner = ({
  width,
  height,
  baseImagePath,
  elements,
  slotImages,
  selectedId,
  disabled,
  showLabels,
  onStartDrag
}) => (
  <div className="relative overflow-hidden bg-white" style={{ width, height }}>
    <BaseImage src={baseImagePath} />

    {/* 每日照片預覽（僅預覽用） */}
    {elements
      .filter((element) => element.group === 'imageSlots' && slotImages[element.id])
      .map((element) => (
        <div
          key={element.id}
          data-testid={`slot-preview-${element.id}`}
          className="overflow-hidden"
          style={{
            position: 'absolute',
            left: element.box.x,
            top: element.box.y,
            width: element.box.width,
            height: element.box.height,
            pointerEvents: 'none'
          }}
        >
          <img
            src={slotImages[element.id]}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      ))}

    {/* 可互動元素 */}
    {elements.map((element) => (
      <ElementOverlay
        key={element.id}
        element={element}
        box={element.box}
        selected={selectedId === element.id}
        disabled={disabled}
        showLabel={showLabels}
        onStartDrag={onStartDrag}
      />
    ))}
  </div>
);

export default TemplateCanvas;
