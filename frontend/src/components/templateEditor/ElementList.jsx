import { Layers, Plus, Trash2 } from 'lucide-react';
import { groupColor, GROUP_LABELS } from './constants.js';

const groupOrder = ['titleImage', 'imageSlots', 'dateRole', 'textPositions', 'categorySelection'];
const groupLabel = (group) => GROUP_LABELS[group] || group;

const ElementList = ({ elements, selectedId, onSelect, onAddCategory, onRemoveCategory }) => {
  const groups = groupOrder
    .map((group) => ({
      group,
      items: elements.filter((element) => element.group === group)
    }))
    .filter((entry) => entry.items.length > 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Layers className="h-4 w-4 text-gray-400" />
          版面樹
          <span className="text-xs text-gray-400">({elements.length})</span>
        </h3>
        <button
          type="button"
          onClick={onAddCategory}
          className="flex items-center gap-1 rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50"
          title="新增身分圈選框"
        >
          <Plus className="h-3 w-3" />
          圈選
        </button>
      </div>

      {groups.length === 0 && (
        <p className="py-3 text-center text-xs text-gray-400">
          尚無任何元素
          <br />
          從上方「＋ 新增元素」開始
        </p>
      )}

      {groups.map(({ group, items }) => (
        <div key={group} className="space-y-1">
          <p className="px-1 text-[11px] font-medium tracking-wide text-gray-400 uppercase">
            {groupLabel(group)}
          </p>
          <div className="space-y-0.5">
            {items.map((element) => {
              const active = element.id === selectedId;
              return (
                <div
                  key={element.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(element.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(element.id);
                    }
                  }}
                  className="group flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-gray-100"
                  style={active ? { background: `${groupColor(element.group)}22` } : undefined}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: groupColor(element.group) }}
                  />
                  <span className="flex-1 truncate text-gray-700">{element.label}</span>
                  {element.deletable !== false && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCategory?.(element.id);
                      }}
                      className="text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                      title="刪除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ElementList;
