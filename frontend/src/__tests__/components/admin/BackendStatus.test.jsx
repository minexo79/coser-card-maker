import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import BackendStatus from '../../../components/admin/BackendStatus';

const { ping } = vi.hoisted(() => ({ ping: vi.fn() }));
vi.mock('../../../services/api', () => ({
  ping,
}));

describe('BackendStatus 後端運行狀態', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('ping 成功顯示後端上線與綠燈', async () => {
    ping.mockResolvedValue({ status: 'ok' });
    render(<BackendStatus pollIntervalMs={999999} />);

    await waitFor(() => {
      expect(screen.getByTestId('backend-status-text').textContent).toBe('後端上線');
    });
    expect(screen.getByTestId('backend-status-dot').className).toContain('bg-green-500');
  });

  it('ping 失敗顯示後端離線與紅燈', async () => {
    ping.mockRejectedValue(new Error('down'));
    render(<BackendStatus pollIntervalMs={999999} />);

    await waitFor(() => {
      expect(screen.getByTestId('backend-status-text').textContent).toBe('後端離線');
    });
    expect(screen.getByTestId('backend-status-dot').className).toContain('bg-red-500');
  });

  it('初始狀態為檢查中', () => {
    ping.mockReturnValue(new Promise(() => {}));
    render(<BackendStatus pollIntervalMs={999999} />);

    expect(screen.getByTestId('backend-status-text').textContent).toBe('檢查中…');
  });

  it('ping 以靜默方式呼叫（不觸發全域錯誤彈窗）', async () => {
    ping.mockResolvedValue({ status: 'ok' });
    render(<BackendStatus pollIntervalMs={999999} />);

    await waitFor(() => {
      expect(ping).toHaveBeenCalledWith({ silent: true });
    });
  });
});
