import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/useAuth';
import * as auth from '../../services/auth';
import { Trash2, RefreshCw, UserPlus } from 'lucide-react';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New user form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [creating, setCreating] = useState(false);

  // Reset password
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const list = await auth.listUsers();
      setUsers(list);
    } catch (err) {
      setError(err.detail || '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    auth.listUsers()
      .then((list) => { if (!cancelled) setUsers(list); })
      .catch((err) => { if (!cancelled) setError(err.detail || '載入失敗'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await auth.createUser(newUsername, newPassword, newRole);
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      await fetchUsers();
    } catch (err) {
      setError(err.detail || '建立失敗');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (username) => {
    if (!window.confirm(`確定要刪除使用者 "${username}" 嗎？`)) return;
    setError('');
    try {
      await auth.deleteUser(username);
      await fetchUsers();
    } catch (err) {
      setError(err.detail || '刪除失敗');
    }
  };

  const handleReset = async (username) => {
    if (!resetPassword || resetPassword.length < 8) {
      setError('密碼至少需要 8 個字元');
      return;
    }
    setResetting(true);
    try {
      await auth.resetUserPassword(username, resetPassword);
      setResetTarget(null);
      setResetPassword('');
    } catch (err) {
      setError(err.detail || '重設失敗');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">載入中...</p>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">使用者管理</h2>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {/* User list */}
      <div className="mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="py-2">帳號</th>
              <th className="py-2">角色</th>
              <th className="py-2">建立時間</th>
              <th className="py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.username} className="border-b border-gray-100">
                <td className="py-2">{u.username}</td>
                <td className="py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-2 text-gray-500 text-xs">
                  {new Date(u.created_at).toLocaleString()}
                </td>
                <td className="py-2 text-right space-x-2">
                  {resetTarget === u.username ? (
                    <span className="inline-flex items-center gap-1">
                      <input
                        type="password"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        placeholder="新密碼"
                        className="px-2 py-1 border border-gray-300 rounded text-xs w-32"
                      />
                      <button
                        onClick={() => handleReset(u.username)}
                        disabled={resetting}
                        className="text-xs text-orange-600 hover:underline"
                      >
                        確認
                      </button>
                      <button
                        onClick={() => { setResetTarget(null); setResetPassword(''); }}
                        className="text-xs text-gray-500 hover:underline"
                      >
                        取消
                      </button>
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => setResetTarget(u.username)}
                        className="text-gray-500 hover:text-orange-600"
                        title="重設密碼"
                      >
                        <RefreshCw className="w-4 h-4 inline" />
                      </button>
                      {u.username !== currentUser?.username && (
                        <button
                          onClick={() => handleDelete(u.username)}
                          className="text-gray-500 hover:text-red-600"
                          title="刪除"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create user form */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
          <UserPlus className="w-4 h-4" /> 新增使用者
        </h3>
        <form onSubmit={handleCreate} className="flex gap-2 items-end flex-wrap">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="帳號"
            required
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="密碼"
            required
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-36"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            {creating ? '建立中...' : '建立'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;
