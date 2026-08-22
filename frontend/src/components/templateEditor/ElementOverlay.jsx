import { groupColor } from './constants.js';

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const cursorForHandle = (handle) => {
  const map = {
    n: 'ns-resize',
    s: 'ns-resize',
    e: 'ew-resize',
    w: 'ew-resize',
    ne: 'nesw-resize',
    sw: 'nesw-resize',
    nw: 'nwse-resize',
    se: 'nwse-resize'
  };
  return map[handle] || 'default';
};

const handlePosStyle = (handle) => {
  const base = {
    position: 'absolute',
    width: 10,
    height: 10,
    background: '#ffffff',
    border: '2px solid #3b82f6',
    borderRadius: 2,
    boxSizing: 'border-box',
    zIndex: 10
  };
  if (handle.includes('n')) base.top = -5;
  if (handle.includes('s')) base.bottom = -5;
  if (handle.includes('w')) base.left = -5;
  if (handle.includes('e')) base.right = -5;
  if (!handle.includes('n') && !handle.includes('s')) {
    base.top = '50%';
    base.marginTop = -5;
  }
  if (!handle.includes('w') && !handle.includes('e')) {
    base.left = '50%';
    base.marginLeft = -5;
  }
  return base;
};

// 純展示元件：負責方框的視覺描繪，並把指標事件原封不動往上丟。
// 所有互動（選取／拖曳／縮放）由 TemplateCanvas 統一處理。
const ElementOverlay = ({
  element,
  box,
  selected = false,
  disabled = false,
  showLabel = true,
  onStartDrag
}) => {
  if (!element || !box) return null;
  const color = groupColor(element.group);
  const resizable = element.resizable !== false;

  return (
    <div
      data-testid={`element-overlay-${element.id}`}
      data-element-id={element.id}
      onPointerDown={(event) => onStartDrag?.(event, element, 'move')}
      className={`absolute box-border ${selected ? 'z-20' : 'z-10'}`}
      style={{
        left: box.x,
        top: box.y,
        width: Math.max(box.width || 0, 1),
        height: Math.max(box.height || 0, 1),
        cursor: disabled ? 'default' : 'move'
      }}
    >
      <div
        className="absolute"
        style={{
          inset: 0,
          border: `1.5px solid ${color}`,
          background: selected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.02)',
          boxSizing: 'border-box'
        }}
      />
      {showLabel && (
        <div
          className="absolute overflow-hidden truncate whitespace-nowrap px-1 py-0.5 text-[10px] leading-none text-white"
          style={{ bottom: '100%', left: 0, maxWidth: 150, background: color, zIndex: 30 }}
        >
          {element.label}
        </div>
      )}
      {!disabled && resizable && selected
        && HANDLES.map((handle) => (
          <div
            key={handle}
            data-testid={`resize-handle-${handle}`}
            onPointerDown={(event) => {
              event.stopPropagation();
              onStartDrag?.(event, element, 'resize', handle);
            }}
            style={{ ...handlePosStyle(handle), cursor: cursorForHandle(handle) }}
          />
        ))}
    </div>
  );
};

export default ElementOverlay;
