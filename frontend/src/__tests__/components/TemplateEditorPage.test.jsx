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
    expect(screen.getByText(/使用「＋新增」加入元素/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /上傳底圖/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /新增元素/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /儲存/ })).toBeTruthy();
  });

  it('應可新增圖片槽（天數連動更新）', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/template-editor']}>
          <TemplateEditor />
        </MemoryRouter>
      );
    });

    // 空白草稿：版面樹仍為空
    expect(screen.getByText(/尚無任何元素/)).toBeTruthy();

    // 點選「＋新增元素」開啟選單
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /新增元素/ }));
    });
    // 點「圖片槽（每天一張）」
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-menu-image-slot'));
    });

    // 新增後版面樹出現「圖片槽」群組，且第 1 天圖片槽已建立
    expect(screen.getByText('圖片槽')).toBeTruthy();
    expect(screen.getAllByText(/第1天/).length).toBeGreaterThan(0);
  });
});