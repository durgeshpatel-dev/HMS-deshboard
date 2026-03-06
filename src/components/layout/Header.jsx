import { Bell, User, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ title }) => {
  const { user } = useAuth();
  const displayName = user?.name || user?.email || 'Manager';
  const displayRole = user?.role === 'manager' ? 'Manager' : (user?.role || 'Administrator');

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 sticky top-0 z-10 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h2>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" size={20} />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-64 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors dark:hover:bg-gray-700">
            <Bell size={24} className="text-gray-600 dark:text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{displayName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{displayRole}</p>
            </div>
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">{displayName.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
