import { useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Calendar, TrendingUp, ShoppingBag, DollarSign, RefreshCw, Download, FileText, Printer } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import OrderService from '../services/order.service';
import AnalyticsService from '../services/analytics.service';

const Reports = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState('today');
  
  // New analytics state
  const [chartData, setChartData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [waiterPerformance, setWaiterPerformance] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const now = new Date();
      let startDate, endDate;

      // Calculate date range
      switch (dateRange) {
        case 'today':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'yesterday':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'last7':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'last30':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'custom':
          startDate = new Date(selectedDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(selectedDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        default:
          startDate = undefined;
          endDate = undefined;
      }

      // Fetch all analytics
      const [chartRes, itemsRes, paymentRes, waiterRes] = await Promise.all([
        AnalyticsService.getSalesAnalytics(startDate, endDate, 'day'),
        AnalyticsService.getTopItems(10, startDate, endDate),
        AnalyticsService.getPaymentBreakdown(startDate, endDate),
        AnalyticsService.getWaiterPerformance(10, startDate, endDate),
      ]);

      setChartData(chartRes?.data || []);
      setTopItems(itemsRes?.data || []);
      setPaymentBreakdown(paymentRes?.data || []);
      setWaiterPerformance(waiterRes?.data || []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, []);

  useEffect(() => {
    void fetchAnalytics();
  }, [dateRange, selectedDate]);

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

  const getDateRangeBounds = () => {
    const now = new Date();
    const from = new Date(now);
    const to = new Date(now);

    switch (dateRange) {
      case 'today':
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        return { from, to };
      case 'yesterday':
        from.setDate(from.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        to.setTime(from.getTime());
        to.setHours(23, 59, 59, 999);
        return { from, to };
      case 'last7':
        from.setDate(from.getDate() - 7);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        return { from, to };
      case 'last30':
        from.setDate(from.getDate() - 30);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        return { from, to };
      case 'custom':
        from.setTime(new Date(selectedDate).getTime());
        from.setHours(0, 0, 0, 0);
        to.setTime(new Date(selectedDate).getTime());
        to.setHours(23, 59, 59, 999);
        return { from, to };
      default:
        return { from: null, to: null };
    }
  };

  const getExportData = () => {
    const formatMoney = (value) => Number(value || 0).toFixed(2);
    const { from, to } = getDateRangeBounds();

    const fallbackTopItemsMap = new Map();
    filteredOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const itemName = item?.menuItem?.name || `Item #${item?.menuItemId || 'Unknown'}`;
        const quantity = Number(item?.quantity || 0);
        const subtotal = Number(item?.subtotal || 0);

        if (!fallbackTopItemsMap.has(itemName)) {
          fallbackTopItemsMap.set(itemName, {
            itemName,
            quantity: 0,
            revenue: 0,
            unitPrice: Number(item?.unitPrice || 0),
          });
        }

        const current = fallbackTopItemsMap.get(itemName);
        current.quantity += quantity;
        current.revenue += subtotal;
      });
    });

    const fallbackTopItems = Array.from(fallbackTopItemsMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const exportTopItems = topItems.length > 0 ? topItems : fallbackTopItems;
    const exportPaymentBreakdown = paymentBreakdown.length > 0
      ? paymentBreakdown
      : [{ method: 'N/A', count: 0, total: 0 }];

    const fallbackSalesTrendMap = new Map();
    filteredOrders.forEach((order) => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
      if (!fallbackSalesTrendMap.has(dateKey)) {
        fallbackSalesTrendMap.set(dateKey, { date: dateKey, orders: 0, items: 0, sales: 0 });
      }
      const current = fallbackSalesTrendMap.get(dateKey);
      current.orders += 1;
      current.items += Number(order.items?.length || 0);
      current.sales += Number(order.totalAmount || 0);
    });

    const fallbackSalesTrend = Array.from(fallbackSalesTrendMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));

    const exportSalesTrend = chartData.length > 0
      ? chartData
      : (fallbackSalesTrend.length > 0
          ? fallbackSalesTrend
          : [{ date: getRangeLabel(), orders: stats.count, items: stats.totalItems, sales: stats.total }]);

    return {
      formatMoney,
      from,
      to,
      exportTopItems,
      exportPaymentBreakdown,
      exportSalesTrend,
    };
  };

  // Export functions
  const exportToCSV = () => {
    const csvContent = generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales-report-${getRangeLabel().replace(/\s+/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSVContent = () => {
    const escapeCsv = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const {
      formatMoney,
      from,
      to,
      exportTopItems,
      exportPaymentBreakdown,
      exportSalesTrend,
    } = getExportData();

    const lines = [];

    lines.push('HMS SALES REPORT');
    lines.push(`Generated At,${escapeCsv(new Date().toLocaleString())}`);
    lines.push(`Range Label,${escapeCsv(getRangeLabel())}`);
    lines.push(`Date From,${escapeCsv(from ? from.toISOString() : 'N/A')}`);
    lines.push(`Date To,${escapeCsv(to ? to.toISOString() : 'N/A')}`);
    lines.push('');

    lines.push('SUMMARY');
    lines.push('Metric,Value');
    lines.push(`Total Revenue (INR),${formatMoney(stats.total)}`);
    lines.push(`Total Orders,${stats.count}`);
    lines.push(`Average Order Value (INR),${formatMoney(stats.avgOrder)}`);
    lines.push(`Total Items Sold,${stats.totalItems}`);
    lines.push('');

    lines.push('SALES TREND');
    lines.push('Date,Orders,Items,Revenue (INR)');
    exportSalesTrend.forEach((row) => {
      lines.push([
        escapeCsv(row.date),
        Number(row.orders || 0),
        Number(row.items || 0),
        formatMoney(row.sales),
      ].join(','));
    });
    lines.push('');

    lines.push('TOP SELLING ITEMS');
    lines.push('Item Name,Quantity,Revenue (INR),Unit Price (INR)');
    exportTopItems.forEach((item) => {
      lines.push([
        escapeCsv(item.itemName),
        Number(item.quantity || 0),
        formatMoney(item.revenue),
        formatMoney(item.unitPrice),
      ].join(','));
    });
    lines.push('');

    lines.push('PAYMENT METHOD BREAKDOWN');
    lines.push('Method,Transactions,Total (INR)');
    exportPaymentBreakdown.forEach((payment) => {
      lines.push([
        escapeCsv(payment.method || 'Unknown'),
        Number(payment.count || 0),
        formatMoney(payment.total),
      ].join(','));
    });
    lines.push('');

    lines.push('COMPLETED ORDER DETAILS');
    lines.push('Order Number,Table/Type,Created At,Item Lines,Order Total (INR),Status');
    if (filteredOrders.length === 0) {
      lines.push('No completed orders found for selected range,,,,,');
    } else {
      filteredOrders.forEach((order) => {
        lines.push([
          escapeCsv(order.orderNumber),
          escapeCsv(order.orderType === 'parcel' ? 'Parcel' : (order.table?.tableNumber || '-')),
          escapeCsv(new Date(order.createdAt).toLocaleString()),
          Number(order.items?.length || 0),
          formatMoney(order.totalAmount),
          escapeCsv(order.status || 'completed'),
        ].join(','));
      });
    }

    return `\uFEFF${lines.join('\n')}`;
  };

  const exportToPDF = () => {
    const {
      formatMoney,
      from,
      to,
      exportTopItems,
      exportPaymentBreakdown,
      exportSalesTrend,
    } = getExportData();

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text('HMS Sales Report', 14, 14);
    doc.setFontSize(10);
    doc.text(`Range: ${getRangeLabel()}`, 14, 21);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
    doc.text(`From: ${from ? from.toISOString() : 'N/A'}`, 14, 31);
    doc.text(`To: ${to ? to.toISOString() : 'N/A'}`, 14, 36);

    autoTable(doc, {
      startY: 42,
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue (INR)', formatMoney(stats.total)],
        ['Total Orders', String(stats.count)],
        ['Average Order Value (INR)', formatMoney(stats.avgOrder)],
        ['Total Items Sold', String(stats.totalItems)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22] },
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 45 } },
    });

    let currentY = doc.lastAutoTable.finalY + 8;

    autoTable(doc, {
      startY: currentY,
      head: [['Date', 'Orders', 'Items', 'Revenue (INR)']],
      body: exportSalesTrend.map((row) => [
        row.date,
        String(Number(row.orders || 0)),
        String(Number(row.items || 0)),
        formatMoney(row.sales),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8.5, cellPadding: 2.3 },
      margin: { right: pageWidth / 2 + 2 },
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Method', 'Transactions', 'Total (INR)']],
      body: exportPaymentBreakdown.map((payment) => [
        payment.method || 'Unknown',
        String(Number(payment.count || 0)),
        formatMoney(payment.total),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8.5, cellPadding: 2.3 },
      margin: { left: pageWidth / 2 + 2 },
    });

    currentY = Math.max(doc.lastAutoTable.finalY, currentY) + 8;

    autoTable(doc, {
      startY: currentY,
      head: [['Item Name', 'Qty', 'Revenue (INR)', 'Unit Price (INR)']],
      body: exportTopItems.map((item) => [
        item.itemName,
        String(Number(item.quantity || 0)),
        formatMoney(item.revenue),
        formatMoney(item.unitPrice),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] },
      styles: { fontSize: 8.2, cellPadding: 2.2 },
      columnStyles: { 0: { cellWidth: 90 } },
    });

    currentY = doc.lastAutoTable.finalY + 8;

    autoTable(doc, {
      startY: currentY,
      head: [['Order Number', 'Table/Type', 'Created At', 'Item Lines', 'Order Total (INR)', 'Status']],
      body: (filteredOrders.length === 0
        ? [['No completed orders found for selected range', '', '', '', '', '']]
        : filteredOrders.map((order) => [
            order.orderNumber,
            order.orderType === 'parcel' ? 'Parcel' : (order.table?.tableNumber || '-'),
            new Date(order.createdAt).toLocaleString(),
            String(Number(order.items?.length || 0)),
            formatMoney(order.totalAmount),
            order.status || 'completed',
          ])),
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 7.8, cellPadding: 2.1 },
      columnStyles: {
        0: { cellWidth: 34 },
        1: { cellWidth: 24 },
        2: { cellWidth: 44 },
        3: { cellWidth: 18 },
        4: { cellWidth: 28 },
        5: { cellWidth: 20 },
      },
    });

    doc.save(`sales-report-${getRangeLabel().replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <div className="min-h-screen">
      <Header title="Sales Reports" />

      <div className="p-8">
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Select Date Range</h3>
              <p className="text-sm text-gray-500">View sales analytics and insights</p>
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
                <Button variant="outline" size="sm" icon={<RefreshCw size={16} />} onClick={() => { fetchOrders(); fetchAnalytics(); }}>
                  Refresh
                </Button>
                <Button variant="secondary" size="sm" icon={<Printer size={16} />} onClick={() => window.print()} className="no-print">
                  Print
                </Button>
                <Button variant="primary" size="sm" icon={<Download size={16} />} onClick={exportToCSV}>
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" icon={<FileText size={16} />} onClick={exportToPDF}>
                  Export PDF
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {loading || analyticsLoading ? (
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

            {/* Sales Trend Chart */}
            {chartData.length > 0 && (
              <Card title="Sales Trend" className="mb-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#f97316" name="Sales (₹)" strokeWidth={2} />
                    <Line type="monotone" dataKey="orders" stroke="#3b82f6" name="Orders" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Top Items */}
            {topItems.length > 0 && (
              <Card title="Top Selling Items" className="mb-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topItems}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="itemName" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="quantity" fill="#10b981" name="Qty Sold" />
                    <Bar dataKey="revenue" fill="#f97316" name="Revenue (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Payment Methods Breakdown */}
              {paymentBreakdown.length > 0 && (
                <Card title="Payment Methods">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={paymentBreakdown} dataKey="count" nameKey="method" cx="50%" cy="50%" outerRadius={100} label>
                        <Cell fill="#10b981" />
                        <Cell fill="#f97316" />
                        <Cell fill="#3b82f6" />
                        <Cell fill="#8b5cf6" />
                        <Cell fill="#ec4899" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {paymentBreakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.method}</span>
                        <span className="font-semibold text-gray-900">₹{Number(item.total).toLocaleString()} ({item.count})</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Waiter Performance */}
              {waiterPerformance.length > 0 && (
                <Card title="Top Waiters">
                  <div className="space-y-3">
                    {waiterPerformance.map((waiter, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">{waiter.staffName}</p>
                          <p className="text-xs text-gray-500">{waiter.ordersCount} orders</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">₹{Number(waiter.totalRevenue).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Avg: ₹{Number(waiter.avgOrderValue).toFixed(0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
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
