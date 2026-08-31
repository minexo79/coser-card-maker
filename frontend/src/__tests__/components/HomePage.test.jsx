import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import HomePage from '../../components/HomePage';

vi.mock('../../services/api', () => ({
  getEventTemplates: vi.fn(),
  resolveAssetUrl: (path) => path || '',
}));

// 日期過濾邏輯由 eventCalendar.test.js 覆蓋；這裡 mock 以隔離元件測試
vi.mock('../../utils/eventCalendar.js', () => ({
  filterThisWeek: (events = []) => events,
  formatEventDateRange: (event) => (event?.startDate ? String(event.startDate) : ''),
}));

import { getEventTemplates } from '../../services/api';

const events = {
  cwtt36: {
    id: 'cwtt36',
    startDate: '2026-08-31',
    dayCount: 2,
    overWriteCanvas: { baseImagePath: '/uploads/a.png' },
  },
};

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<><HomePage /><LocationDisplay /></>} />
        <Route path="/make" element={<LocationDisplay />} />
        <Route path="/:eventId" element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>
  );

describe('HomePage 首頁', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('顯示本週場次與「製作預定」按鈕', async () => {
    getEventTemplates.mockResolvedValue(events);
    renderPage();

    expect(await screen.findByText('cwtt36')).toBeTruthy();
    const buttons = screen.getAllByRole('button', { name: /製作預定/ });
    expect(buttons).toHaveLength(1);
  });

  it('點「製作預定」導向 /:eventId', async () => {
    getEventTemplates.mockResolvedValue(events);
    renderPage();

    const btn = await screen.findByRole('button', { name: /製作預定/ });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toBe('/cwtt36');
    });
  });

  it('本週無場次時顯示空狀態', async () => {
    getEventTemplates.mockResolvedValue({});
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('本週暫無場次')).toBeTruthy();
    });
  });

  it('「想要自己來」按鈕導向 /make', async () => {
    getEventTemplates.mockResolvedValue(events);
    renderPage();

    const selfLabel = await screen.findByText(/我想要自己來/);
    const selfBtn = selfLabel.closest('button');
    expect(selfBtn).toBeTruthy();
    fireEvent.click(selfBtn);
    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toBe('/make');
    });
  });

  it('載入失敗顯示錯誤訊息', async () => {
    getEventTemplates.mockRejectedValue(new Error('boom'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/boom/)).toBeTruthy();
    });
  });
});
