import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import NavBar from '../../components/NavBar';

describe('NavBar 元件', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('應顯示品牌與三個導覽連結', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );

    expect(screen.getByText('場次預定製作工具')).toBeTruthy();
    expect(screen.getByText('首頁')).toBeTruthy();
    expect(screen.getByText('圖片上傳')).toBeTruthy();
    expect(screen.getByText('Heartbeat')).toBeTruthy();
  });

  it('三個連結應各自指向正確路徑', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );

    const homeLink = screen.getByText('首頁').closest('a');
    const uploadLink = screen.getByText('圖片上傳').closest('a');
    const heartbeatLink = screen.getByText('Heartbeat').closest('a');

    expect(homeLink.getAttribute('href')).toBe('/');
    expect(uploadLink.getAttribute('href')).toBe('/upload');
    expect(heartbeatLink.getAttribute('href')).toBe('/heartbeat');
  });
});