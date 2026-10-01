import { useState } from 'react';
import { Settings as SettingsIcon, Type as TypeIcon, Trash2 } from 'lucide-react';
import { groupColor } from './constants.js';

const NumberField = ({ label, value, onChange }) => {
  const [text, setText] = useState(() => String(value ?? ''));
  const [prevValue, setPrevValue] = useState(value);

  if (prevValue !== value) {
    setPrevValue(value);
    setText(String(value ?? ''));
  }

  const commit = () => {
    const num = Number.parseFloat(text);
    if (Number.isNaN(num)) {
      setText(String(value ?? ''));
      return;
    }
    const next = Math.round(num);
    if (next !== value) {
      onChange(next);
      setText(String(next));
    } else {
      setText(String(value ?? ''));
    }
  };

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <input
        type="number"
        step="1"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        className="w-full rounded border border-line-strong px-2 py-1 text-sm"
      />
    </label>
  );
};

const Hint = ({ children, className = '' }) => (
  <div className={`rounded border px-2 py-1.5 text-xs ${className}`}>{children}</div>
);

const PropertyPanel = ({ element, onUpdate, onRemove }) => {
  if (!element) {
    return (
      <div className="space-y-4 text-sm text-muted">
        <div className="flex items-center gap-2 border-b border-line pb-2 text-fg-soft">
          <SettingsIcon className="h-4 w-4" />
          <span className="font-medium">未選取元素</span>
        </div>
        <p>請在左方畫布或清單中點選元素，即可在此編輯其位置與尺寸。</p>
      </div>
    );
  }

  const box = element.box || {};
  const color = groupColor(element.group);

  return (
    <div className="space-y-4 text-sm text-fg">
      <div className="flex items-center justify-between border-b border-line pb-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 shrink-0 rounded" style={{ background: color }} />
          <span className="font-medium">{element.label}</span>
        </div>
        {element.deletable !== false && (
          <button
            type="button"
            onClick={onRemove}
            className="flex shrink-0 items-center gap-1 rounded border border-danger/30 px-2 py-0.5 text-xs text-danger hover:bg-danger/10"
          >
            <Trash2 className="h-3 w-3" />
            刪除
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberField label="X" value={box.x} onChange={(v) => onUpdate({ x: v })} />
        <NumberField label="Y" value={box.y} onChange={(v) => onUpdate({ y: v })} />
        {/* <NumberField label="W" value={box.width} onChange={(v) => onUpdate({ width: v })} />
        <NumberField label="H" value={box.height} onChange={(v) => onUpdate({ height: v })} /> */}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {/* <NumberField label="X" value={box.x} onChange={(v) => onUpdate({ x: v })} />
        <NumberField label="Y" value={box.y} onChange={(v) => onUpdate({ y: v })} /> */}
        <NumberField label="W" value={box.width} onChange={(v) => onUpdate({ width: v })} />
        <NumberField label="H" value={box.height} onChange={(v) => onUpdate({ height: v })} />
      </div>

      <div className="space-y-2 border-t border-line pt-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <TypeIcon className="h-3.5 w-3.5" />
          進階樣式
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="字級"
            value={box.fontSize ?? 20}
            onChange={(v) => onUpdate({ fontSize: v })}
          />
          <NumberField
            label="行高"
            value={box.lineHeight ?? 20}
            onChange={(v) => onUpdate({ lineHeight: v })}
          />
        </div>
      </div>

      {element.group === 'imageSlots' && (
        <Hint className="border-warn/30 bg-warn/10 text-warn">
          圖片槽代表使用者上傳圖片的顯示範圍，可在下方「預覽照片」放圖檢視效果。
        </Hint>
      )}
      {element.group === 'categorySelection' && (
        <Hint className="border-mint/30 bg-mint/10 text-mint">
          身分圈選框：此方框代表對應該身分名稱時要反白顯示的區域。
        </Hint>
      )}
      {element.group === 'titleImage' && (
        <Hint className="border-accent/30 bg-accent/10 text-accent">
          標題圖的顯示位置，實際圖案請上傳標題圖片後檢視。
        </Hint>
      )}
    </div>
  );
};

export default PropertyPanel;
