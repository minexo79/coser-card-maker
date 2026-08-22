import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import NavBar from '../../components/NavBar';

const renderWithRouter = (initial) =>
  render(
    <MemoryRouter initialEntries={[initial]}>
      <NavBar />
    </MemoryRouter>
  );

describe('NavBar 元件', () => {
  it('應顯示品牌與所有導覽連結', () => {
    renderWithRouter('/');
    expect(screen.getByText('場次預定製作工具')).toBeTruthy();
    expect(screen.getByText('首頁')).toBeTruthy();
    expect(screen.getByText('圖片上傳')).toBeTruthy();
    expect(screen.getByText('模板管理')).toBeTruthy();
    expect(screen.getByText('後端狀態')).toBeTruthy();
  });

  it('各連結應指向正確路徑', () => {
    renderWithRouter('/');
    expect(screen.getByText('首頁').closest('a').getAttribute('href')).toBe('/');
    expect(screen.getByText('圖片上傳').closest('a').getAttribute('href')).toBe('/template-editor?tab=assets');
    expect(screen.getByText('模板管理').closest('a').getAttribute('href')).toBe('/template-editor');
    expect(screen.getByText('後端狀態').closest('a').getAttribute('href')).toBe('/heartbeat');
  });

  it('在模板管理頁時，模板管理為 active', () => {
    renderWithRouter('/template-editor');
    const templateLink = screen.getByText('模板管理').closest('a');
    expect(templateLink.className).toContain('bg-blue-600');
  });

  it('在圖片上傳 tab 時，圖片上傳為 active', () => {
    renderWithRouter('/template-editor?tab=assets');
    const uploadLink = screen.getByText('圖片上傳').closest('a');
    expect(uploadLink.className).toContain('bg-blue-600');
    const templateLink = screen.getByText('模板管理').closest('a');
    expect(templateLink.className).not.toContain('bg-blue-600');
  });
});
