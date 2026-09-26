import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TemplateEditor from '../../components/templateEditor/TemplateEditor.jsx';

const apiMocks = vi.hoisted(() => ({
  getEventTemplate: vi.fn(),
  uploadImage: vi.fn(),
  saveEventTemplate: vi.fn(),
}));

vi.mock('../../services/api', () => apiMocks);

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

describe('components/templateEditor/TemplateEditor - 載入模板', () => {
  beforeEach(() => {
    apiMocks.getEventTemplate.mockReset();
    apiMocks.uploadImage.mockReset();
    apiMocks.saveEventTemplate.mockReset();
  });

  it('blur 活動 ID 時以 silent 載入模板，避免新模板觸發全域錯誤彈窗', async () => {
    apiMocks.getEventTemplate.mockRejectedValue({ status: 404 });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/template-editor']}>
          <TemplateEditor />
        </MemoryRouter>
      );
    });

    const input = screen.getByTestId('template-event-id');
    fireEvent.change(input, { target: { value: 'new-event' } });
    await act(async () => {
      fireEvent.blur(input);
    });

    expect(apiMocks.getEventTemplate).toHaveBeenCalledWith('new-event', { silent: true });
  });

  it('載入模板後應顯示活動名稱', async () => {
    apiMocks.getEventTemplate.mockResolvedValue({
      name: '開拓動漫祭 FF44',
      dayCount: 1,
      startDate: '2026-05-30',
      overWriteCanvas: { canvas: { width: 1220, height: 700 }, imageSlots: [] }
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/template-editor?event=ff44']}>
          <TemplateEditor />
        </MemoryRouter>
      );
    });

    expect(screen.getByTestId('template-event-name').value).toBe('開拓動漫祭 FF44');
    expect(screen.getByTestId('template-event-id').value).toBe('ff44');
    expect(screen.getByText('已載入：開拓動漫祭 FF44')).toBeTruthy();
  });

  it('未填活動名稱時不送出儲存', async () => {
    apiMocks.getEventTemplate.mockRejectedValue({ status: 404 });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/template-editor']}>
          <TemplateEditor />
        </MemoryRouter>
      );
    });

    fireEvent.change(screen.getByTestId('template-event-id'), { target: { value: 'ff44' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /儲存/ }));
    });

    expect(apiMocks.saveEventTemplate).not.toHaveBeenCalled();
    expect(screen.getByText('請輸入活動名稱')).toBeTruthy();
  });

  it('儲存時 payload 應帶上活動名稱', async () => {
    apiMocks.saveEventTemplate.mockResolvedValue({});

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/template-editor']}>
          <TemplateEditor />
        </MemoryRouter>
      );
    });

    fireEvent.change(screen.getByTestId('template-event-id'), { target: { value: 'ff44' } });
    fireEvent.change(screen.getByTestId('template-event-name'), { target: { value: ' 開拓動漫祭 ' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /儲存/ }));
    });

    expect(apiMocks.saveEventTemplate).toHaveBeenCalledTimes(1);
    const [id, payload] = apiMocks.saveEventTemplate.mock.calls[0];
    expect(id).toBe('ff44');
    expect(payload.name).toBe('開拓動漫祭');
  });

  it('照片圓角為共用設定，預設為 5', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/template-editor']}>
          <TemplateEditor />
        </MemoryRouter>
      );
    });

    const input = screen.getByTestId('template-image-radius').querySelector('input');
    expect(input.value).toBe('5');
  });
});
