import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import NavBar from '../../components/NavBar';
import AuthProvider from '../../contexts/AuthProvider';

vi.mock('../../services/auth.js', () => ({
  getToken: () => null,
  getStoredUser: () => null,
  getMe: () => Promise.reject(new Error('not logged in')),
}));

vi.mock('../../services/api.js', () => ({
  getEventList: vi.fn().mockResolvedValue([
    { id: 'ff44', name: '開拓動漫祭 FF44' },
    { id: 'cwt70', name: 'CWT70' },
  ]),
}));

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
};

const renderAt = (initial) =>
  render(
    <MemoryRouter initialEntries={[initial]}>
      <AuthProvider>
        <NavBar />
        <Routes>
          <Route path="*" element={<><LocationDisplay /><Link to="/">回首頁</Link></>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

// 桌面版選單（手機版選單預設收合，不會渲染）
const findEventSelect = async () => {
  await screen.findByRole('option', { name: '開拓動漫祭 FF44' });
  return screen.getByRole('combobox');
};

describe('NavBar 活動下拉選單', () => {
  afterEach(() => {
    cleanup();
  });

  it('選項顯示活動名稱，值為活動代號', async () => {
    renderAt('/');
    const select = await findEventSelect();
    const option = within(select).getByRole('option', { name: '開拓動漫祭 FF44' });
    expect(option.value).toBe('ff44');
  });

  it('選擇活動後導向 /:eventId', async () => {
    renderAt('/');
    const select = await findEventSelect();
    fireEvent.change(select, { target: { value: 'ff44' } });
    expect(screen.getByTestId('location').textContent).toBe('/ff44');
  });

  it('選單值跟隨目前路由，/make?id= 也能對應', async () => {
    renderAt('/cwt70');
    expect((await findEventSelect()).value).toBe('cwt70');
    cleanup();

    renderAt('/make?id=ff44');
    expect((await findEventSelect()).value).toBe('ff44');
  });

  it('離開活動頁後選單回到預設，可再次選擇同一個活動', async () => {
    renderAt('/');
    const select = await findEventSelect();

    fireEvent.change(select, { target: { value: 'ff44' } });
    expect(screen.getByTestId('location').textContent).toBe('/ff44');

    fireEvent.click(screen.getByText('回首頁'));
    expect(screen.getByTestId('location').textContent).toBe('/');
    expect(select.value).toBe('');

    fireEvent.change(select, { target: { value: 'ff44' } });
    expect(screen.getByTestId('location').textContent).toBe('/ff44');
  });

  it('不在清單中的路徑（如 /about）選單顯示預設', async () => {
    renderAt('/about');
    expect((await findEventSelect()).value).toBe('');
  });
});
