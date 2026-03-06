import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  ShoppingBag, 
  Package, 
  Grid, 
  FileText, 
  Settings,
  Users,
  LogOut,
  Flame
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();
  
  const menuItems = [
    { path: '/', icon: Home, label: 'Billing Dashboard' },
    { path: '/kitchen', icon: Flame, label: 'Kitchen Display' },
    { path: '/staff', icon: Users, label: 'Staff Management' },
    { path: '/menu-categories', icon: Grid, label: 'Menu Categories' },
    { path: '/menu-items', icon: ShoppingBag, label: 'Menu Items' },
    { path: '/parcel-orders', icon: Package, label: 'Parcel Orders' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];
  
  const isActive = (path) => location.pathname === path;
  
  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };
  
  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-orange-500 mb-8">Restaurant POS</h1>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-auto pt-8">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 w-full transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
