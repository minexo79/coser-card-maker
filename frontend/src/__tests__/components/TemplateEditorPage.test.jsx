import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TemplateEditor from '../../components/templateEditor/TemplateEditor.jsx';

describe('components/templateEditor/TemplateEditor', () => {
  it('應渲染標題與工具列', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/template-editor']}>
          <TemplateEditor />
        </MemoryRouter>
      );
    });
    expect(screen.getByText(/模板編輯器/)).toBeTruthy();
    expect(screen.getByTestId('template-day-count')).toBeTruthy();
    // 應以空白為起點，不是內建模板
    expect(screen.getByText(/從空白開始/)).toBeTruthy();
  });

  it('應可新增圖片槽（天數連動更新）', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/template-editor']}>
          <TemplateEditor />
        </MemoryRouter>
      );
    });
    const countInput = screen.getByTestId('template-day-count');

    // 從 0 個圖片槽開始
    const before = Number(countInput.value);

    // 點選「＋新增元素」開啟選單
    fireEvent.click(screen.getByRole('button', { name: /新增元素/ }));
    // 點「圖片槽（每天一張）」
    fireEvent.click(screen.getByTestId('add-menu-image-slot'));

    // 新增後圖片槽數 +1
    expect(Number(countInput.value)).toBe(before + 1);
  });
});
