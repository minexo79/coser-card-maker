import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import PropertyPanel from '../../../components/templateEditor/PropertyPanel.jsx';

describe('PropertyPanel 圓角', () => {
  afterEach(() => {
    cleanup();
  });

  it('圖片槽不再個別顯示圓角欄位（改由編輯器共用設定）', () => {
    render(
      <PropertyPanel
        element={{
          id: 'imageSlots.0',
          label: '圖片槽 1',
          group: 'imageSlots',
          box: { x: 0, y: 0, width: 200, height: 300, radius: 12 }
        }}
        onUpdate={vi.fn()}
      />
    );
    expect(screen.queryByText(/圓角/)).toBeNull();
  });
});
