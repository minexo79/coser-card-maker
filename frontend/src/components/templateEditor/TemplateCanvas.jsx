import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import ElementOverlay from './ElementOverlay.jsx';
import { clamp, normalizeRect } from '../../utils/geometry.js';
import { resolveAssetUrl } from '../../services/api.js';
import { usePointerDrag } from './usePointerDrag.js';
import { computeSnap } from './snap.js';

const isUploadedAsset = (path) => {
  if (!path) return false;
  return /^(https?:|data:|blob:)/.test(path) || path.startsWith('/uploads/');
};

const MIN_SIZE = 8;

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

const SnapLines = ({ lines }) =>
  lines.map((line, i) =>
    line.type === 'vertical' ? (
      <div
        key={`sv-${i}`}
        className="pointer-events-none absolute top-0 h-full"
        style={{
          left: line.x,
          width: 1,
          backgroundColor: '#f43f5e',
          zIndex: 50
        }}
      />
    ) : (
      <div
        key={`sh-${i}`}
        className="pointer-events-none absolute left-0 w-full"
        style={{
          top: line.y,
          height: 1,
          backgroundColor: '#f43f5e',
          zIndex: 50
        }}
      />
    )
  );

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
  const [snapLines, setSnapLines] = useState([]);
  const {
    start,
    move: moveInteraction,
    end: endInteraction
  } = usePointerDrag();

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

  const applyMove = useCallback(
    (result) => {
      if (!result) return;
      const { meta, dx, dy } = result;
      const origin = meta.originBox;
      const others = elements.filter((el) => el.id !== meta.id);
      let nextBox;

      if (meta.mode === 'move') {
        const candidate = {
          x: clamp(Math.round(origin.x + dx), 0, Math.max(0, width - origin.width)),
          y: clamp(Math.round(origin.y + dy), 0, Math.max(0, height - origin.height)),
          width: origin.width,
          height: origin.height
        };
        const { box: snapped, lines } = computeSnap(candidate, others, 'move', null, width, height);
        nextBox = {
          ...snapped,
          x: clamp(snapped.x, 0, Math.max(0, width - snapped.width)),
          y: clamp(snapped.y, 0, Math.max(0, height - snapped.height))
        };
        setSnapLines(lines);
      } else {
        const resized = computeResizeBox(origin, dx, dy, meta.handle);
        const candidate = {
          ...resized,
          width: Math.max(resized.width, MIN_SIZE),
          height: Math.max(resized.height, MIN_SIZE)
        };
        const { box: snapped, lines } = computeSnap(candidate, others, 'resize', meta.handle, width, height);
        nextBox = {
          ...snapped,
          width: Math.max(snapped.width, MIN_SIZE),
          height: Math.max(snapped.height, MIN_SIZE)
        };
        setSnapLines(lines);
      }
      onElementChange?.(meta.id, nextBox);
    },
    [elements, height, onElementChange, width]
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
      setSnapLines([]);
      if (result) onElementChangeEnd?.();
    },
    [endInteraction, onElementChangeEnd]
  );

  const handleStartDrag = useCallback(
    (event, element, mode, handle = null) => {
      if (disabled) return;
      event.preventDefault();
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
            snapLines={snapLines}
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
  onStartDrag,
  snapLines = []
}) => (
  <div className="relative overflow-hidden bg-white" style={{ width, height }}>
    <BaseImage src={baseImagePath} />

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

    <SnapLines lines={snapLines} />
  </div>
);

export default TemplateCanvas;
