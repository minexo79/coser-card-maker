import { useState } from 'react';
import { useAuth } from '../../contexts/useAuth';
import ChangePassword from './ChangePassword';
import UserManagement from './UserManagement';
import TemplateEditor from '../templateEditor/TemplateEditor';
import Heartbeat from '../Heartbeat';
import { LayoutDashboard, Users, Activity, Key } from 'lucide-react';

const TABS = [
  { key: 'templates', label: '模板管理', icon: LayoutDashboard },
  { key: 'password', label: '密碼修改', icon: Key },
];

const ADMIN_TABS = [
  { key: 'users', label: '使用者管理', icon: Users },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const allTabs = isAdmin ? [...TABS.slice(0, 1), ...ADMIN_TABS, ...TABS.slice(1)] : TABS;
  const [activeTab, setActiveTab] = useState(allTabs[0].key);

  return (
    <div className="mx-auto max-w-[1700px] p-4 flex gap-4 h-[calc(100vh-2rem)]">
      <div className="flex flex-col w-48 shrink-0 bg-white rounded-lg shadow border border-gray-200 py-2">
        {allTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-orange-600 bg-orange-50 border-r-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 bg-white rounded-lg shadow border border-gray-200 p-4 overflow-auto">
        {activeTab === 'templates' && <TemplateEditor />}
        {activeTab === 'users' && <UserManagement />}
        {/* {activeTab === 'status' && <Heartbeat />} */}
        {activeTab === 'password' && <ChangePassword />}
      </div>
    </div>
  );
};

export default AdminDashboard;
