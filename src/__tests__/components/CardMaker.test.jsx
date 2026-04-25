import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CardMaker from '../../components/CardMaker';

const mockUseCardMaker = vi.fn();

vi.mock('../../hooks/useCardMaker', () => ({
  useCardMaker: () => mockUseCardMaker()
}));

vi.mock('../../components/ImageUpload', () => ({
  default: ({ label, onImageUpload }) => (
    <div>
      <span>{label}</span>
      <button type="button" onClick={() => onImageUpload({ name: label })}>
        upload {label}
      </button>
    </div>
  )
}));

vi.mock('../../components/CardPreview', () => ({
  default: () => <div>CardPreview</div>
}));

vi.mock('../../components/PreviewModal', () => ({
  default: () => null
}));

describe('CardMaker - DIY View UI', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const buildHookState = (dayCount, overrides = {}) => {
    const state = {
      formData: {
        title: '',
        nickname: '',
        message: '',
        category: 'COSER',
        showQRCode: true,
        websiteUrl: 'https://example.com'
      },
      imageDatas: { d1: null, d2: null },
      imageOffsets: { d1: 0, d2: 0 },
      dayDetails: {
        d1: { date: '', cosrole: '' },
        d2: { date: '', cosrole: '' }
      },
      dayCount,
      supportedDayCounts: [1, 2],
      isLoading: false,
      showModal: false,
      canvasRef: { current: null },
      getCurrentDateString: () => '2026-04-25',
      updateFormData: vi.fn(),
      updateDayDetail: vi.fn(),
      handleImageUpload: vi.fn(),
      handleTitleImageUpload: vi.fn(),
      getCurrentTemplate: () => ({
        imageSlots: [
          { key: 'd1', label: '第一天' },
          { key: 'd2', label: '第二天' }
        ]
      }),
      renderCanvas: vi.fn(),
      setDayCount: vi.fn(),
      setShowModal: vi.fn(),
      ...overrides
    };

    return state;
  };

  it('切換為 2 天時顯示 Day2 Tab，切回 1 天時隱藏', () => {
    let currentDayCount = 1;

    mockUseCardMaker.mockImplementation(() =>
      buildHookState(currentDayCount, {
        setDayCount: vi.fn((value) => {
          currentDayCount = value;
        })
      })
    );

    const { rerender } = render(<CardMaker />);

    const scheduleTab = screen.getByRole('tab', { name: '預定資訊' });
    fireEvent.click(scheduleTab);

    expect(screen.queryByRole('tab', { name: '第二天 DAY 2' })).toBeNull();

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });
    rerender(<CardMaker />);

    expect(screen.queryByRole('tab', { name: '第二天 DAY 2' })).not.toBeNull();

    fireEvent.change(select, { target: { value: '1' } });
    rerender(<CardMaker />);

    expect(screen.queryByRole('tab', { name: '第二天 DAY 2' })).toBeNull();
  });

  it('D1 / D2 上傳應傳入正確 dayKey', () => {
    const handleImageUpload = vi.fn();

    mockUseCardMaker.mockReturnValue(
      buildHookState(2, {
        handleImageUpload
      })
    );

    render(<CardMaker />);

  const scheduleTab = screen.getByRole('tab', { name: '預定資訊' });
  fireEvent.click(scheduleTab);

    const uploadD1 = screen.getByRole('button', { name: 'upload 上傳圖片 (第一天 DAY 1)' });
    fireEvent.click(uploadD1);

    const day2Tab = screen.getByRole('tab', { name: '第二天 DAY 2' });
    fireEvent.click(day2Tab);

    const uploadD2 = screen.getByRole('button', { name: 'upload 上傳圖片 (第二天 DAY 2)' });
    fireEvent.click(uploadD2);

    expect(handleImageUpload).toHaveBeenNthCalledWith(1, { name: '上傳圖片 (第一天 DAY 1)' }, 'd1');
    expect(handleImageUpload).toHaveBeenNthCalledWith(2, { name: '上傳圖片 (第二天 DAY 2)' }, 'd2');
  });
});
