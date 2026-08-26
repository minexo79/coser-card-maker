import { Link, useLocation } from 'react-router-dom';
import { Home, Upload, Activity, LayoutDashboard } from 'lucide-react';

const NavBar = () => {
  const { pathname, search } = useLocation();
  const isAssetsTab = pathname === '/template-editor' && search.includes('tab=assets');

  const navItems = [
    { 
      to: '/', label: 
      '首頁', 
      icon: Home, 
      active: pathname === '/' 
    },
    {
      to: '/template-editor',
      label: '模版編輯',
      icon: LayoutDashboard,
      active: pathname === '/template-editor' && !isAssetsTab,
    },
    { 
      to: '/heartbeat', 
      label: '後端狀態', 
      icon: Activity, 
      active: pathname === '/heartbeat' 
    },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white shadow">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="./favicon.ico" alt="Logo" className="w-8 h-8" />
          <span className="text-lg text-gray-800">場次預定製作工具</span>
        </div>
        <ul className="flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const { to, label, active } = item;
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-800 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;
