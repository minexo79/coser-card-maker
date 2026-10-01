import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import ChangePassword from './ChangePassword';
import UserManagement from './UserManagement';
import AuditLogList from './AuditLogList';
import SystemStatus from './SystemStatus';
import BackendStatus from './BackendStatus';
import TemplateEditor from '../templateEditor/TemplateEditor';
import TemplateListPage from '../templateEditor/TemplateListPage';
import { LayoutDashboard, List, Users, Key, ScrollText, Activity, Server } from 'lucide-react';

const TABS = [
  { key: 'list', label: '模板清單', icon: List },
  { key: 'templates', label: '模板編輯', icon: LayoutDashboard },
  { key: 'password', label: '密碼修改', icon: Key },
  { key: 'status', label: '後端狀態', icon: Server },
];

const ADMIN_TABS = [
  { key: 'users', label: '使用者管理', icon: Users },
  { key: 'audit', label: '審計日誌', icon: ScrollText },
  { key: 'system', label: '系統狀態', icon: Activity },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();

  const allTabs = isAdmin ? [...TABS.slice(0, 4), ...ADMIN_TABS, ...TABS.slice(4)] : TABS;
  const tabParam = searchParams.get('tab');
  const activeTab = allTabs.some((t) => t.key === tabParam) ? tabParam : allTabs[0].key;

  const switchTab = (key) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', key);
      return next;
    });
  };

  return (
    <div className="container mx-auto p-4 flex flex-col md:flex-row gap-4 h-[calc(100vh-2rem)] animate-fade-in">
      {/* Mobile: horizontal tab bar */}
      <div className="md:hidden flex overflow-x-auto gap-1 bg-surface rounded-2xl border border-line p-1 shrink-0">
        {allTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'text-accent bg-accent/10'
                  : 'text-fg-soft hover:text-fg hover:bg-raised'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Desktop: vertical sidebar */}
      <div className="hidden md:flex flex-col w-48 shrink-0 bg-surface rounded-2xl border border-line py-2">
        {allTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-accent bg-accent/10 border-r-2 border-accent'
                  : 'text-fg-soft hover:text-fg hover:bg-raised'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 bg-surface rounded-2xl border border-line p-4 overflow-auto">
        {activeTab === 'list' && <TemplateListPage />}
        {activeTab === 'templates' && <TemplateEditor />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'password' && <ChangePassword />}
        {activeTab === 'audit' && <AuditLogList />}
        {activeTab === 'system' && <SystemStatus />}
        {activeTab === 'status' && <BackendStatus />}
      </div>
    </div>
  );
};

export default AdminDashboard;
