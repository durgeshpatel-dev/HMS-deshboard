/**
 * Report export utilities – CSV & PDF generation.
 * Extracted from Reports.jsx to reduce file size (~270 lines moved).
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Calculate date range bounds from a range key and optional custom date.
 */
export const getDateRangeBounds = (dateRange, selectedDate) => {
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

/** Human-readable label for a date range. */
export const getRangeLabel = (dateRange, selectedDate) => {
  switch (dateRange) {
    case 'today': return 'Today';
    case 'yesterday': return 'Yesterday';
    case 'last7': return 'Last 7 Days';
    case 'last30': return 'Last 30 Days';
    case 'custom':
      return new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    default: return 'All Time';
  }
};

const formatMoney = (value) => Number(value || 0).toFixed(2);

/**
 * Build normalised export payload from analytics + order data.
 */
const getExportData = ({ stats, filteredOrders, chartData, topItems, paymentBreakdown, dateRange, selectedDate }) => {
  const { from, to } = getDateRangeBounds(dateRange, selectedDate);

  // Fallback top items (from raw orders)
  const fallbackTopItemsMap = new Map();
  filteredOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const itemName = item?.menuItem?.name || `Item #${item?.menuItemId || 'Unknown'}`;
      const quantity = Number(item?.quantity || 0);
      const subtotal = Number(item?.subtotal || 0);
      if (!fallbackTopItemsMap.has(itemName)) {
        fallbackTopItemsMap.set(itemName, { itemName, quantity: 0, revenue: 0, unitPrice: Number(item?.unitPrice || 0) });
      }
      const current = fallbackTopItemsMap.get(itemName);
      current.quantity += quantity;
      current.revenue += subtotal;
    });
  });
  const fallbackTopItems = Array.from(fallbackTopItemsMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

  // Fallback sales trend
  const fallbackSalesTrendMap = new Map();
  filteredOrders.forEach((order) => {
    const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
    if (!fallbackSalesTrendMap.has(dateKey)) fallbackSalesTrendMap.set(dateKey, { date: dateKey, orders: 0, items: 0, sales: 0 });
    const current = fallbackSalesTrendMap.get(dateKey);
    current.orders += 1;
    current.items += Number(order.items?.length || 0);
    current.sales += Number(order.totalAmount || 0);
  });
  const fallbackSalesTrend = Array.from(fallbackSalesTrendMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  const rangeLabel = getRangeLabel(dateRange, selectedDate);

  return {
    from,
    to,
    rangeLabel,
    exportTopItems: topItems.length > 0 ? topItems : fallbackTopItems,
    exportPaymentBreakdown: paymentBreakdown.length > 0 ? paymentBreakdown : [{ method: 'N/A', count: 0, total: 0 }],
    exportSalesTrend: chartData.length > 0 ? chartData : (fallbackSalesTrend.length > 0 ? fallbackSalesTrend : [{ date: rangeLabel, orders: stats.count, items: stats.totalItems, sales: stats.total }]),
  };
};

// ─── CSV ─────────────────────────────────────────────────────────

const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

const generateCSVContent = (ctx) => {
  const { from, to, rangeLabel, exportTopItems, exportPaymentBreakdown, exportSalesTrend } = getExportData(ctx);
  const { stats, filteredOrders } = ctx;
  const lines = [];

  lines.push('HMS SALES REPORT');
  lines.push(`Generated At,${escapeCsv(new Date().toLocaleString())}`);
  lines.push(`Range Label,${escapeCsv(rangeLabel)}`);
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
  exportSalesTrend.forEach((row) => lines.push([escapeCsv(row.date), Number(row.orders || 0), Number(row.items || 0), formatMoney(row.sales)].join(',')));
  lines.push('');
  lines.push('TOP SELLING ITEMS');
  lines.push('Item Name,Quantity,Revenue (INR),Unit Price (INR)');
  exportTopItems.forEach((item) => lines.push([escapeCsv(item.itemName), Number(item.quantity || 0), formatMoney(item.revenue), formatMoney(item.unitPrice)].join(',')));
  lines.push('');
  lines.push('PAYMENT METHOD BREAKDOWN');
  lines.push('Method,Transactions,Total (INR)');
  exportPaymentBreakdown.forEach((payment) => lines.push([escapeCsv(payment.method || 'Unknown'), Number(payment.count || 0), formatMoney(payment.total)].join(',')));
  lines.push('');
  lines.push('COMPLETED ORDER DETAILS');
  lines.push('Order Number,Table/Type,Created At,Item Lines,Order Total (INR),Status');
  if (filteredOrders.length === 0) {
    lines.push('No completed orders found for selected range,,,,,');
  } else {
    filteredOrders.forEach((order) =>
      lines.push([
        escapeCsv(order.orderNumber),
        escapeCsv(order.orderType === 'parcel' ? 'Parcel' : (order.table?.tableNumber || '-')),
        escapeCsv(new Date(order.createdAt).toLocaleString()),
        Number(order.items?.length || 0),
        formatMoney(order.totalAmount),
        escapeCsv(order.status || 'completed'),
      ].join(','))
    );
  }
  return `\uFEFF${lines.join('\n')}`;
};

export const exportToCSV = (ctx) => {
  const csvContent = generateCSVContent(ctx);
  const rangeLabel = getRangeLabel(ctx.dateRange, ctx.selectedDate);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `sales-report-${rangeLabel.replace(/\s+/g, '-')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ─── PDF ─────────────────────────────────────────────────────────

export const exportToPDF = (ctx) => {
  const { from, to, rangeLabel, exportTopItems, exportPaymentBreakdown, exportSalesTrend } = getExportData(ctx);
  const { stats, filteredOrders } = ctx;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.text('HMS Sales Report', 14, 14);
  doc.setFontSize(10);
  doc.text(`Range: ${rangeLabel}`, 14, 21);
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
    body: exportSalesTrend.map((row) => [row.date, String(Number(row.orders || 0)), String(Number(row.items || 0)), formatMoney(row.sales)]),
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8.5, cellPadding: 2.3 },
    margin: { right: pageWidth / 2 + 2 },
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Method', 'Transactions', 'Total (INR)']],
    body: exportPaymentBreakdown.map((payment) => [payment.method || 'Unknown', String(Number(payment.count || 0)), formatMoney(payment.total)]),
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 8.5, cellPadding: 2.3 },
    margin: { left: pageWidth / 2 + 2 },
  });

  currentY = Math.max(doc.lastAutoTable.finalY, currentY) + 8;

  autoTable(doc, {
    startY: currentY,
    head: [['Item Name', 'Qty', 'Revenue (INR)', 'Unit Price (INR)']],
    body: exportTopItems.map((item) => [item.itemName, String(Number(item.quantity || 0)), formatMoney(item.revenue), formatMoney(item.unitPrice)]),
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
    columnStyles: { 0: { cellWidth: 34 }, 1: { cellWidth: 24 }, 2: { cellWidth: 44 }, 3: { cellWidth: 18 }, 4: { cellWidth: 28 }, 5: { cellWidth: 20 } },
  });

  doc.save(`sales-report-${rangeLabel.replace(/\s+/g, '-')}.pdf`);
};
