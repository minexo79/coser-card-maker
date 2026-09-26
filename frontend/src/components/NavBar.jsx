import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { Home, Shield, LogIn, LogOut, Menu, X, ChevronDown, PenTool, Info } from 'lucide-react';
import * as api from '../services/api.js';

const NavBar = () => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [eventTemplates, setEventTemplates] = useState([]);

  useEffect(() => {
    api.getEventList({ silent: true })
      .then((data) => {
        if (Array.isArray(data)) {
          setEventTemplates(data);
        }
      })
      .catch(() => {});
  }, []);

  // 下拉選單的值由目前路由推導（受控元件），離開活動頁後自動回到「選擇活動」。
  // 若用 defaultValue（非受控），選過的活動會一直停在選單上，
  // 之後再選同一個活動不會觸發 onChange，導致無法跳轉。
  const selectedEventId = getRouteEventId(pathname, search, eventTemplates);

  const handleEventChange = (eventId) => {
    if (eventId) {
      navigate(`/${encodeURIComponent(eventId)}`);
    }
  };

  const navItems = [
    { to: '/', label: '首頁', icon: Home, active: pathname === '/' },
    { to: '/make', label: '預定製作', icon: PenTool, active: pathname === '/make' || pathname.startsWith('/card/') },
    { to: '/about', label: '關於', icon: Info, active: pathname === '/about' },
    ...(isAuthenticated
      ? [
          { to: '/admin', label: '管理', icon: Shield, active: pathname === '/admin' || pathname === '/template-editor' },
        ]
      : []),
  ];

  const linkClass = (active) =>
    `flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-orange-600 text-white'
        : 'text-gray-800 hover:bg-gray-800 hover:text-white'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-amber-50  honeycomb-bg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="./favicon.ico" alt="Logo" className="w-8 h-8" />
          <span className="text-lg text-gray-800">場次預定製作工具</span>
        </div>

        {/* Desktop menu */}
        <ul className="hidden md:flex items-center gap-2">
          {eventTemplates.length > 0 && (
            <li>
              <div className="relative">
                <select
                  onChange={(e) => handleEventChange(e.target.value)}
                  value={selectedEventId}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-medium text-gray-800 bg-white border border-gray-300 hover:border-orange-400 input-focus transition-all duration-200 cursor-pointer"
                >
                  <option value="" disabled>選擇活動</option>
                  {/* value 為活動代號（路由用），顯示文字為活動名稱 */}
                  {eventTemplates.map((event) => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </li>
          )}
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
          {eventTemplates.length > 0 && (
            <li>
              <div className="relative">
                <select
                  onChange={(e) => { handleEventChange(e.target.value); setMobileOpen(false); }}
                  value={selectedEventId}
                  className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-medium text-gray-800 bg-white border border-gray-300 input-focus transition-all duration-200 cursor-pointer"
                >
                  <option value="" disabled>選擇活動</option>
                  {/* value 為活動代號（路由用），顯示文字為活動名稱 */}
                  {eventTemplates.map((event) => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </li>
          )}
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

// 從路由取得目前的活動代號：/:eventId 或 /make?id=xxx；不在活動清單中則回傳 ''。
function getRouteEventId(pathname, search, events) {
  let routeId = '';
  if (pathname === '/make') {
    routeId = new URLSearchParams(search).get('id') || '';
  } else {
    try {
      routeId = decodeURIComponent(pathname.slice(1));
    } catch {
      routeId = '';
    }
  }
  return events.some((event) => event.id === routeId) ? routeId : '';
}

export default NavBar;
