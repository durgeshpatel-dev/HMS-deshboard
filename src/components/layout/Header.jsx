import { useState, useRef, useEffect } from 'react';
import { Bell, User, Search, X, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import OrderService from '../../services/order.service';
import TableService from '../../services/table.service';
import MenuService from '../../services/menu.service';
import StaffService from '../../services/staff.service';

const Header = ({ title }) => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);

  const displayName = user?.name || user?.email || 'Manager';
  const displayRole = user?.role === 'manager' ? 'Manager' : (user?.role || 'Administrator');

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global search function
  const performSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const [orders, tables, menu, staff] = await Promise.all([
        OrderService.getOrders(),
        TableService.getTables(),
        MenuService.getCategories(),
        StaffService.getStaff(),
      ]);

      const lowerQuery = query.toLowerCase();
      const results = [];

      // Search in orders
      (orders?.data || []).forEach((order) => {
        if (order.orderNumber.toLowerCase().includes(lowerQuery) || 
            order.table?.tableNumber?.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: 'order',
            id: order.id,
            title: `Order #${order.orderNumber}`,
            subtitle: `Table ${order.table?.tableNumber || 'N/A'} - ₹${order.totalAmount}`,
            data: order
          });
        }
      });

      // Search in tables
      (tables?.data || []).forEach((table) => {
        if (table.tableNumber.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: 'table',
            id: table.id,
            title: `Table ${table.tableNumber}`,
            subtitle: `Capacity: ${table.capacity} - Status: ${table.status}`,
            data: table
          });
        }
      });

      // Search in menu items
      (menu?.data || []).forEach((category) => {
        (category.menuItems || []).forEach((item) => {
          if (item.name.toLowerCase().includes(lowerQuery)) {
            results.push({
              type: 'menu',
              id: item.id,
              title: item.name,
              subtitle: `₹${item.price} - ${category.name}`,
              data: item
            });
          }
        });
      });

      // Search in staff
      (staff?.data || []).forEach((staffMember) => {
        if (staffMember.name.toLowerCase().includes(lowerQuery) || 
            staffMember.phone.includes(query)) {
          results.push({
            type: 'staff',
            id: staffMember.id,
            title: staffMember.name,
            subtitle: `${staffMember.phone} - ${staffMember.role}`,
            data: staffMember
          });
        }
      });

      setSearchResults(results.slice(0, 10)); // Limit to 10 results
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 sticky top-0 z-50 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h2>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" size={20} />
            <input
              type="text"
              placeholder="Search orders, tables, menu, staff..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                performSearch(e.target.value);
              }}
              onFocus={() => searchQuery && setShowSearchResults(true)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-64 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50 dark:bg-gray-800 dark:border-gray-700">
                {searchLoading && (
                  <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
                )}
                {!searchLoading && searchResults.length === 0 && searchQuery.length >= 2 && (
                  <div className="p-4 text-center text-gray-400 text-sm">No results found</div>
                )}
                {!searchLoading && searchResults.length > 0 && (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{result.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{result.subtitle}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Notification Bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors dark:hover:bg-gray-700"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <Bell size={24} className={unreadCount > 0 ? 'text-orange-500 animate-pulse' : 'text-gray-600 dark:text-gray-300'} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center px-1">
                  <span className="text-white text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 dark:bg-gray-800 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                  <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-orange-500 hover:text-orange-600 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-gray-400">
                      <Bell size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.slice(0, 20).map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer dark:border-gray-700 dark:hover:bg-gray-700 ${
                          !notification.read ? 'bg-orange-50 dark:bg-orange-900/20' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          notification.type === 'billing_request' 
                            ? 'bg-purple-100 text-purple-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {notification.type === 'billing_request' ? '💰' : '📋'}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                            <Clock size={10} />
                            <span>{formatTime(notification.timestamp)}</span>
                          </div>
                        </div>

                        {/* Unread dot */}
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-500 mt-2" />
                        )}

                        {/* Dismiss */}
                        <button
                          onClick={(e) => { e.stopPropagation(); clearNotification(notification.id); }}
                          className="flex-shrink-0 p-1 hover:bg-gray-200 rounded-full transition-colors dark:hover:bg-gray-600"
                        >
                          <X size={14} className="text-gray-400" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
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
