import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ErrorProvider from '../../contexts/ErrorProvider';
import { emitError, subscribeError } from '../../services/errorBus';

const Trigger = () => {
  return <button onClick={() => emitError({ status: 500, message: '伺服器壞了' })}>trigger</button>;
};

describe('ErrorProvider 錯誤彈窗', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('送出錯誤時顯示 E005 彈窗與訊息', () => {
    render(
      <ErrorProvider>
        <Trigger />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByText('trigger'));

    expect(screen.getByTestId('error-modal')).toBeTruthy();
    expect(screen.getByTestId('error-modal-code').textContent).toBe('E005: 後端運行錯誤');
    expect(screen.getByTestId('error-modal-message').textContent).toBe('伺服器壞了');
  });

  it('按「知道了」可關閉彈窗', () => {
    render(
      <ErrorProvider>
        <Trigger />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByText('trigger'));
    fireEvent.click(screen.getByText('知道了'));

    expect(screen.queryByTestId('error-modal')).toBeNull();
  });

  it('未觸發時不顯示彈窗', () => {
    render(<ErrorProvider><div>內容</div></ErrorProvider>);
    expect(screen.queryByTestId('error-modal')).toBeNull();
  });

  it('顯示 E001 網路錯誤彈窗', () => {
    render(
      <ErrorProvider>
        <button onClick={() => emitError({ isNetworkError: true, message: 'Failed to fetch' })}>net</button>
      </ErrorProvider>
    );

    fireEvent.click(screen.getByText('net'));
    expect(screen.getByTestId('error-modal-code').textContent).toBe('E001: 後端連線失敗');
  });

  it('subscribeError 可解除訂閱', () => {
    const unsub = subscribeError(vi.fn());
    expect(typeof unsub).toBe('function');
    expect(() => unsub()).not.toThrow();
  });
});
