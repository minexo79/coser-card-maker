import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Heartbeat from '../../components/Heartbeat';

vi.mock('../../services/api', () => ({
  ping: vi.fn()
}));

import { ping } from '../../services/api';

describe('Heartbeat 元件', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('ping 成功時應顯示後端上線與綠燈', async () => {
    ping.mockResolvedValue({ status: 'ok', uptime: 12.3, timestamp: '2026-08-22T00:00:00' });

    render(<Heartbeat />);

    await waitFor(() => {
      expect(screen.getByText('後端上線')).toBeTruthy();
    });
    expect(screen.getByTestId('heartbeat-dot').className).toContain('bg-green-500');
  });

  it('status 非 ok 時應視為離線', async () => {
    ping.mockResolvedValue({ status: 'degraded' });

    render(<Heartbeat />);

    await waitFor(() => {
      expect(screen.getByText('後端離線')).toBeTruthy();
    });
    expect(screen.getByTestId('heartbeat-dot').className).toContain('bg-red-500');
  });

  it('ping 失敗（網路錯誤）時應顯示後端離線與紅燈', async () => {
    ping.mockRejectedValue(new Error('network down'));

    render(<Heartbeat />);

    await waitFor(() => {
      expect(screen.getByText('後端離線')).toBeTruthy();
    });
    expect(screen.getByTestId('heartbeat-dot').className).toContain('bg-red-500');
  });

  it('初始狀態應為檢查中', () => {
    ping.mockReturnValue(new Promise(() => {}));

    render(<Heartbeat />);

    expect(screen.getByText('檢查中…')).toBeTruthy();
    expect(screen.getByTestId('heartbeat-dot').className).toContain('bg-gray-400');
  });
});
