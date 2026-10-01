import { useState } from 'react';
import * as auth from '../../services/auth';

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const strengthChecks = [
    { label: '至少 10 個字元', test: (p) => p.length >= 10 },
    { label: '至少一個大寫字母', test: (p) => /[A-Z]/.test(p) },
    { label: '至少一個小寫字母', test: (p) => /[a-z]/.test(p) },
    { label: '至少一個數字', test: (p) => /[0-9]/.test(p) }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('新密碼與確認密碼不一致');
      return;
    }

    setSubmitting(true);
    try {
      await auth.changePassword(oldPassword, newPassword);
      setMessage('密碼已更新');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.detail || '修改失敗');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm">
      <h2 className="text-xl text-fg mb-4">修改密碼</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-fg-soft mb-1">舊密碼</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-line-strong rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-fg-soft mb-1">新密碼</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-line-strong rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {newPassword && (
            <ul className="text-xs text-muted mt-1 space-y-0.5">
              {strengthChecks.map(({ label, test }) => (
                <li key={label} className={test(newPassword) ? 'text-mint' : ''}>
                  {label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-fg-soft mb-1">確認新密碼</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-line-strong rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {message && <p className="text-sm text-mint">{message}</p>}
        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-fg text-ink rounded-lg text-sm font-medium hover:bg-white disabled:opacity-50 transition-colors"
        >
          {submitting ? '更新中...' : '更新密碼'}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
