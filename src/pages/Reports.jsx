import { useState, useMemo } from 'react';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Calendar, TrendingUp, ShoppingBag, DollarSign, RefreshCw } from 'lucide-react';

const Reports = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState('today');

  // Mock orders data - will be replaced with API data
  const allOrders = [
    { id: 'ORD001', tableId: 'T1', items: 3, total: 850, status: 'completed', time: '10:30 AM', date: new Date().toISOString().split('T')[0] },
    { id: 'ORD002', tableId: 'T3', items: 2, total: 520, status: 'completed', time: '11:15 AM', date: new Date().toISOString().split('T')[0] },
    { id: 'ORD003', tableId: 'T5', items: 5, total: 1240, status: 'completed', time: '12:00 PM', date: new Date().toISOString().split('T')[0] },
    { id: 'ORD004', tableId: 'T2', items: 4, total: 980, status: 'completed', time: '01:30 PM', date: new Date().toISOString().split('T')[0] },
    { id: 'ORD005', tableId: 'T7', items: 2, total: 450, status: 'completed', time: '02:15 PM', date: new Date().toISOString().split('T')[0] },
    { id: 'ORD006', tableId: 'Parcel', items: 3, total: 720, status: 'completed', time: '03:00 PM', date: new Date().toISOString().split('T')[0] },
    { id: 'ORD007', tableId: 'T4', items: 6, total: 1580, status: 'completed', time: '06:45 PM', date: new Date().toISOString().split('T')[0] },
    { id: 'ORD008', tableId: 'T1', items: 2, total: 640, status: 'completed', time: '07:30 PM', date: new Date().toISOString().split('T')[0] },
  ];

  const getDateRangeOrders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const orderDate = new Date(selectedDate);
    orderDate.setHours(0, 0, 0, 0);

    switch (dateRange) {
      case 'today':
        return allOrders.filter(order => {
          const oDate = new Date(order.date);
          oDate.setHours(0, 0, 0, 0);
          return oDate.getTime() === today.getTime();
        });
      
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return allOrders.filter(order => {
          const oDate = new Date(order.date);
          oDate.setHours(0, 0, 0, 0);
          return oDate.getTime() === yesterday.getTime();
        });
      
      case 'last7':
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        return allOrders.filter(order => {
          const oDate = new Date(order.date);
          oDate.setHours(0, 0, 0, 0);
          return oDate >= last7 && oDate <= today;
        });
      
      case 'last30':
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        return allOrders.filter(order => {
          const oDate = new Date(order.date);
          oDate.setHours(0, 0, 0, 0);
          return oDate >= last30 && oDate <= today;
        });
      
      case 'custom':
        return allOrders.filter(order => {
          const oDate = new Date(order.date);
          oDate.setHours(0, 0, 0, 0);
          return oDate.getTime() === orderDate.getTime();
        });
      
      default:
        return allOrders;
    }
  };

  const filteredOrders = useMemo(() => getDateRangeOrders(), [dateRange, selectedDate, allOrders]);

  const stats = useMemo(() => {
    const total = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const count = filteredOrders.length;
    const avgOrder = count > 0 ? total / count : 0;
    const totalItems = filteredOrders.reduce((sum, order) => sum + order.items, 0);

    return { total, count, avgOrder, totalItems };
  }, [filteredOrders]);

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    if (range !== 'custom') {
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
  };

  const handleRefresh = () => {
    // Refresh data - will call API when integrated
    console.log('Refreshing data...');
  };

  const getRangeLabel = () => {
    switch (dateRange) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'last7': return 'Last 7 Days';
      case 'last30': return 'Last 30 Days';
      case 'custom': return new Date(selectedDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      default: return 'All Time';
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Sales Reports" />
      
      <div className="p-8">
        {/* Date Range Filters */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Select Date Range</h3>
              <p className="text-sm text-gray-500">View sales data for specific periods</p>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => handleDateRangeChange('today')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === 'today'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleDateRangeChange('yesterday')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === 'yesterday'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Yesterday
              </button>
              <button
                onClick={() => handleDateRangeChange('last7')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === 'last7'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => handleDateRangeChange('last30')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === 'last30'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 30 Days
              </button>
              
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setDateRange('custom');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  icon={<RefreshCw size={16} />}
                  onClick={handleRefresh}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Sales Summary - {getRangeLabel()}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Sales */}
            <Card className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Sales</p>
                  <p className="text-3xl font-bold text-gray-900">₹{stats.total.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <TrendingUp size={14} />
                    Revenue generated
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign size={24} className="text-green-600" />
                </div>
              </div>
            </Card>

            {/* Total Orders */}
            <Card className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.count}</p>
                  <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                    <ShoppingBag size={14} />
                    Orders completed
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ShoppingBag size={24} className="text-blue-600" />
                </div>
              </div>
            </Card>

            {/* Average Order Value */}
            <Card className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Avg Order Value</p>
                  <p className="text-3xl font-bold text-gray-900">₹{stats.avgOrder.toFixed(0)}</p>
                  <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                    <Calendar size={14} />
                    Per order average
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp size={24} className="text-orange-600" />
                </div>
              </div>
            </Card>

            {/* Total Items */}
            <Card className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Items Sold</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalItems}</p>
                  <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                    <ShoppingBag size={14} />
                    Items ordered
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <ShoppingBag size={24} className="text-purple-600" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Orders List */}
        <Card title="Order History">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Table</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Items</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500">
                      No orders found for the selected period
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">{order.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700">{order.tableId}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600 text-sm">{order.time}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700">{order.items} items</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">₹{order.total}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
