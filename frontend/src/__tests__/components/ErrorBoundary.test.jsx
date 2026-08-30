import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ErrorBoundary from '../../components/ErrorBoundary';

const { emitError } = vi.hoisted(() => ({ emitError: vi.fn() }));
vi.mock('../../services/errorBus', () => ({
  emitError,
}));

const Boom = () => {
  throw new Error('前端爆炸');
};

const Safe = () => <div>正常內容</div>;

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('捕獲子樹錯誤並以 E004 發布', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(emitError).toHaveBeenCalledWith({ code: 'E004', message: '前端爆炸' });
  });

  it('無錯誤時正常渲染 children', () => {
    render(
      <ErrorBoundary>
        <Safe />
      </ErrorBoundary>
    );
    expect(screen.getByText('正常內容')).toBeTruthy();
    expect(emitError).not.toHaveBeenCalled();
  });
});
