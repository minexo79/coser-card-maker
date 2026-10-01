import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import ChangePassword from './ChangePassword';
import UserManagement from './UserManagement';
import AuditLogList from './AuditLogList';
import SystemStatus from './SystemStatus';
import BackendStatus from './BackendStatus';
import TemplateEditor from '../templateEditor/TemplateEditor';
import TemplateListPage from '../templateEditor/TemplateListPage';
import { LayoutDashboard, List, Users, Key, ScrollText, Activity, Server, ChevronDown } from 'lucide-react';

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

  const activeTabItem = allTabs.find((t) => t.key === activeTab);
  const ActiveTabIcon = activeTabItem.icon;
  const [menuOpen, setMenuOpen] = useState(false);

  const switchTab = (key) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', key);
      return next;
    });
  };

  return (
    <div className="container mx-auto p-4 flex flex-col md:flex-row gap-4 h-[calc(100vh-2rem)] animate-fade-in">
      {/* Mobile: 自訂下拉選單（原生 <select> 的選項放不了圖示） */}
      <div
        className="md:hidden relative z-30 shrink-0"
        onKeyDown={(e) => {
          if (e.key === 'Escape') setMenuOpen(false);
        }}
      >
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={menuOpen}
          aria-label="管理分頁"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-fg bg-surface border border-line-strong transition-colors duration-200"
        >
          <ActiveTabIcon className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">{activeTabItem.label}</span>
          <ChevronDown className={`w-4 h-4 shrink-0 text-muted transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <ul
              role="listbox"
              aria-label="管理分頁"
              className="absolute left-0 right-0 top-full z-20 mt-1 space-y-1 rounded-lg border border-line-strong bg-surface p-1 animate-fade-in"
            >
              {allTabs.map((tab) => {
                const Icon = tab.icon;
                const selected = activeTab === tab.key;
                return (
                  <li key={tab.key} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => {
                        switchTab(tab.key);
                        setMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        selected ? 'bg-fg text-ink' : 'text-fg hover:bg-raised'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {tab.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Desktop: vertical sidebar */}
      <div className="hidden md:flex flex-col gap-1 w-48 shrink-0 bg-surface rounded-2xl border border-line p-2">
        {allTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-fg text-ink'
                  : 'text-fg hover:bg-raised'
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
