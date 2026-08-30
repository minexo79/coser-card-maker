import { Component } from 'react';
import { emitError } from '../services/errorBus';

// 捕捉未處理的前端渲染錯誤，並以 E004 錯誤彈窗通知使用者。
// ErrorProvider 需位於此 Boundary 外層，才能讓彈窗在子樹出錯時仍正常顯示。
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    emitError({ code: 'E004', message: error?.message || String(error) });
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
