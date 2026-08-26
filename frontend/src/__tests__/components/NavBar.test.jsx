import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NavBar from '../../components/NavBar';
import AuthProvider from '../../contexts/AuthProvider';

vi.mock('../../services/auth.js', () => ({
  getToken: () => null,
  getStoredUser: () => null,
  getMe: () => Promise.reject(new Error('not logged in')),
}));

const renderWithRouter = (initial) =>
  render(
    <MemoryRouter initialEntries={[initial]}>
      <AuthProvider>
        <NavBar />
      </AuthProvider>
    </MemoryRouter>
  );

describe('NavBar 元件', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('應顯示品牌與基本導覽連結', () => {
    renderWithRouter('/');
    expect(screen.getByText('場次預定製作工具')).toBeTruthy();
    expect(screen.getByText('首頁')).toBeTruthy();
    expect(screen.getByText('後端狀態')).toBeTruthy();
  });

  it('未登入時應顯示登入連結', () => {
    renderWithRouter('/');
    expect(screen.getByText('登入')).toBeTruthy();
  });

  it('未登入時不應顯示管理連結', () => {
    renderWithRouter('/');
    expect(screen.queryByText('管理')).toBeNull();
  });

  it('各連結應指向正確路徑', () => {
    renderWithRouter('/');
    expect(screen.getByText('首頁').closest('a').getAttribute('href')).toBe('/');
    expect(screen.getByText('後端狀態').closest('a').getAttribute('href')).toBe('/heartbeat');
    expect(screen.getByText('登入').closest('a').getAttribute('href')).toBe('/login');
  });

  it('在首頁時，首頁為 active', () => {
    renderWithRouter('/');
    const homeLink = screen.getByText('首頁').closest('a');
    expect(homeLink.className).toContain('bg-orange-600');
  });
});
