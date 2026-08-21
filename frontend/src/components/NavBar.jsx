import { NavLink } from 'react-router-dom';
import { Home, Upload, Activity } from 'lucide-react';

const navItems = [
  { to: '/', label: '首頁', icon: Home, end: true },
  { to: '/upload', label: '圖片上傳', icon: Upload, end: false },
  { to: '/heartbeat', label: '後端狀態', icon: Activity, end: false },
];

const NavIcon = (props) => {
  const Icon = props.icon;
  return <Icon className="w-4 h-4" />;
};

const NavBar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-white shadow">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="./favicon.ico" alt="Logo" className="w-8 h-8" />
          <span className="text-lg font-semibold text-gray-800">
            場次預定製作工具
          </span>
        </div>
        <ul className="flex items-center gap-2">
          {navItems.map(({ to, label, icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-800 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <NavIcon icon={icon} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;