import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { Home, Activity, Shield, LogIn, LogOut, Menu, X } from 'lucide-react';

const NavBar = () => {
  const { pathname } = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/', label: '首頁', icon: Home, active: pathname === '/' },
    ...(isAuthenticated
      ? [
          { to: '/admin', label: '管理', icon: Shield, active: pathname === '/admin' || pathname === '/template-editor' },
        ]
      : []),
    { to: '/heartbeat', label: '後端狀態', icon: Activity, active: pathname === '/heartbeat' },
  ];

  const linkClass = (active) =>
    `flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-orange-600 text-white'
        : 'text-gray-800 hover:bg-gray-800 hover:text-white'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-orange-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="./favicon.ico" alt="Logo" className="w-8 h-8" />
          <span className="text-lg text-gray-800">場次預定製作工具</span>
        </div>

        {/* Desktop menu */}
        <ul className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link to={item.to} className={linkClass(item.active)}>
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
          {isAuthenticated ? (
            <li>
              <button
                onClick={logout}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-800 hover:bg-gray-800 hover:text-white transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                登出
              </button>
            </li>
          ) : (
            <li>
              <Link to="/login" className={linkClass(pathname === '/login')}>
                <LogIn className="w-4 h-4" />
                登入
              </Link>
            </li>
          )}
        </ul>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-800 transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? '關閉選單' : '開啟選單'}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <ul className="md:hidden px-4 pb-3 space-y-1 border-t border-gray-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={linkClass(item.active)}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
          {isAuthenticated ? (
            <li>
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-800 hover:bg-gray-800 hover:text-white transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                登出
              </button>
            </li>
          ) : (
            <li>
              <Link
                to="/login"
                className={linkClass(pathname === '/login')}
                onClick={() => setMobileOpen(false)}
              >
                <LogIn className="w-4 h-4" />
                登入
              </Link>
            </li>
          )}
        </ul>
      )}
    </nav>
  );
};

export default NavBar;
