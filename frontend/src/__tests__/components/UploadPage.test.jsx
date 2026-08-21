import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import UploadPage from '../../components/UploadPage';

const mockUseCardMakerContext = vi.fn();

vi.mock('../../contexts/useCardMakerContext', () => ({
  useCardMakerContext: () => mockUseCardMakerContext()
}));

vi.mock('../../components/ImageUpload', () => ({
  default: ({ label, onImageUpload }) => (
    <div>
      <span>{label}</span>
      <button type="button" onClick={() => onImageUpload({ name: label })}>
        choose {label}
      </button>
    </div>
  )
}));

vi.mock('../../components/Copyright', () => ({
  default: () => <div>Copyright</div>
}));

describe('UploadPage 元件', () => {
  const buildState = (overrides = {}) => ({
    imageDatas: { d1: null, d2: '/uploads/x.png' },
    imageOffsets: { d1: 0, d2: 5 },
    dayCount: 2,
    getCurrentTemplate: () => ({
      imageSlots: [
        { key: 'd1', label: '第一天' },
        { key: 'd2', label: '第二天' }
      ]
    }),
    handleTitleImageUpload: vi.fn(),
    handleImageUpload: vi.fn(),
    saveCard: vi.fn().mockResolvedValue('card-123'),
    loadCard: vi.fn().mockResolvedValue(true),
    updateDayDetail: vi.fn(),
    titleImageData: null,
    ...overrides
  });

  beforeEach(() => {
    mockUseCardMakerContext.mockReturnValue(buildState());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('應顯示圖片上傳與雲端儲存區塊，包含每日上傳', () => {
    render(<UploadPage />);

    expect(screen.getByText('圖片上傳與雲端儲存')).toBeTruthy();
    expect(screen.getByText('上傳圖片 (第一天 DAY 1)')).toBeTruthy();
    expect(screen.getByText('上傳圖片 (第二天 DAY 2)')).toBeTruthy();
  });

  it('點擊儲存到伺服器應呼叫 saveCard 並顯示分享連結', async () => {
    const saveCard = vi.fn().mockResolvedValue('card-123');
    mockUseCardMakerContext.mockReturnValue(buildState({ saveCard }));

    render(<UploadPage />);
    fireEvent.click(screen.getByRole('button', { name: '儲存到伺服器' }));

    await vi.waitFor(() => {
      expect(screen.getByText('/card/card-123')).toBeTruthy();
    });
    expect(saveCard).toHaveBeenCalledOnce();
  });

  it('輸入 ID 後載入應呼叫 loadCard', async () => {
    const loadCard = vi.fn().mockResolvedValue(true);
    mockUseCardMakerContext.mockReturnValue(buildState({ loadCard }));

    const { rerender } = render(<UploadPage />);
    const input = screen.getByPlaceholderText('輸入卡片 ID');
    fireEvent.change(input, { target: { value: 'abc' } });
    rerender(<UploadPage />);

    fireEvent.click(screen.getByRole('button', { name: '載入' }));

    expect(loadCard).toHaveBeenCalledWith('abc');
  });
});