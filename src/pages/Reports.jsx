import { useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Calendar, TrendingUp, ShoppingBag, DollarSign, RefreshCw } from 'lucide-react';
import OrderService from '../services/order.service';

const Reports = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState('today');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await OrderService.getOrders();
      setOrders(response?.data || []);
    } catch (error) {
      console.error('Failed to fetch orders for report:', error);
      alert('Failed to fetch report data');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, []);

  const completedOrders = useMemo(
    () => orders.filter((order) => order.status === 'completed'),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    return completedOrders.filter((order) => {
      const created = new Date(order.createdAt);
      created.setHours(0, 0, 0, 0);

      switch (dateRange) {
        case 'today':
          return created.getTime() === today.getTime();
        case 'yesterday': {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return created.getTime() === yesterday.getTime();
        }
        case 'last7': {
          const last7 = new Date(today);
          last7.setDate(last7.getDate() - 7);
          return created >= last7 && created <= today;
        }
        case 'last30': {
          const last30 = new Date(today);
          last30.setDate(last30.getDate() - 30);
          return created >= last30 && created <= today;
        }
        case 'custom':
          return created.getTime() === selected.getTime();
        default:
          return true;
      }
    });
  }, [completedOrders, dateRange, selectedDate]);

  const stats = useMemo(() => {
    const total = filteredOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const count = filteredOrders.length;
    const avgOrder = count > 0 ? total / count : 0;
    const totalItems = filteredOrders.reduce((sum, order) => sum + (order.items?.length || 0), 0);
    return { total, count, avgOrder, totalItems };
  }, [filteredOrders]);

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    if (range !== 'custom') {
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
  };

  const getRangeLabel = () => {
    switch (dateRange) {
      case 'today':
        return 'Today';
      case 'yesterday':
        return 'Yesterday';
      case 'last7':
        return 'Last 7 Days';
      case 'last30':
        return 'Last 30 Days';
      case 'custom':
        return new Date(selectedDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      default:
        return 'All Time';
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Sales Reports" />

      <div className="p-8">
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Select Date Range</h3>
              <p className="text-sm text-gray-500">View completed sales data</p>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <button onClick={() => handleDateRangeChange('today')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === 'today' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                Today
              </button>
              <button onClick={() => handleDateRangeChange('yesterday')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === 'yesterday' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                Yesterday
              </button>
              <button onClick={() => handleDateRangeChange('last7')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === 'last7' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                Last 7 Days
              </button>
              <button onClick={() => handleDateRangeChange('last30')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === 'last30' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
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
                <Button variant="outline" size="sm" icon={<RefreshCw size={16} />} onClick={fetchOrders}>
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card>
            <div className="text-center py-10 text-gray-500">Loading report data...</div>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Sales Summary - {getRangeLabel()}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                <Card className="hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Items Sold</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalItems}</p>
                      <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                        <ShoppingBag size={14} />
                        Item lines sold
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <ShoppingBag size={24} className="text-purple-600" />
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <Card title="Completed Order History">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type/Table</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Time</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Items</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-gray-500">No completed orders found for the selected period</td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-700">{order.orderType === 'parcel' ? 'Parcel' : order.table?.tableNumber || '-'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-600 text-sm">{new Date(order.createdAt).toLocaleString()}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-700">{order.items?.length || 0} items</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-gray-900">₹{Number(order.totalAmount).toFixed(2)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">completed</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
