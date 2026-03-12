import React from 'react';

const PrintableBill = ({ bill, table, orders, restaurantInfo }) => {
  // Combine items from all orders if multiple
  const combinedItems = React.useMemo(() => {
    const map = new Map();
    for (const order of (orders || [])) {
      for (const item of (order.items || [])) {
        const key = item.menuItem?.id || item.menuItemId || item.id;
        const existing = map.get(key);
        if (existing) {
          map.set(key, {
            ...existing,
            quantity: existing.quantity + item.quantity,
            subtotal: Number(existing.subtotal) + Number(item.subtotal),
          });
        } else {
          map.set(key, { ...item });
        }
      }
    }
    return Array.from(map.values());
  }, [orders]);

  const currentDate = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  // Settings can use snake_case or camelCase depending on backend response
  const settings = restaurantInfo?.settings || {};
  const taxPercentage = settings.taxPercentage ?? settings.tax_percentage ?? 5;
  const gstNumber = restaurantInfo?.gstNumber || settings.gstNumber || settings.gst_number || null;

  return (
    <div className="printable-bill">
      {/* Restaurant Header */}
      <div className="bill-header">
        <h1 className="restaurant-name">{restaurantInfo?.name || 'Restaurant HMS'}</h1>
        {restaurantInfo?.address && <p className="restaurant-address">{restaurantInfo.address}</p>}
        {restaurantInfo?.phone && <p className="restaurant-contact">{restaurantInfo.phone}</p>}
        {gstNumber && <p className="restaurant-gst">GSTIN: {gstNumber}</p>}
      </div>

      <div className="bill-divider"></div>

      {/* Bill Info */}
      <div className="bill-info">
        <div className="bill-info-row">
          <span>Bill#:</span>
          <strong>{bill?.billNumber || 'N/A'}</strong>
        </div>
        {table ? (
          <div className="bill-info-row">
            <span>Table:</span>
            <strong>{table.tableNumber}</strong>
          </div>
        ) : (
          <>
            <div className="bill-info-row">
              <span>Type:</span>
              <strong>Parcel</strong>
            </div>
            {orders?.[0]?.customerName && (
              <div className="bill-info-row">
                <span>Customer:</span>
                <strong>{orders[0].customerName}</strong>
              </div>
            )}
            {orders?.[0]?.customerPhone && (
              <div className="bill-info-row">
                <span>Phone:</span>
                <strong>{orders[0].customerPhone}</strong>
              </div>
            )}
            {orders?.[0]?.orderNumber && (
              <div className="bill-info-row">
                <span>Order#:</span>
                <strong>{orders[0].orderNumber}</strong>
              </div>
            )}
          </>
        )}
        <div className="bill-info-row">
          <span>Date:</span>
          <strong>{currentDate}</strong>
        </div>
      </div>

      <div className="bill-divider"></div>

      {/* Items List */}
      <div className="items-list">
        {combinedItems.map((item, index) => (
          <div key={index} className="item-row">
            <div className="item-name-qty">
              <span className="item-name">{item.menuItem?.name || 'Item'}</span>
              <span className="item-qty">x{item.quantity}</span>
            </div>
            <div className="item-amount">₹{Number(item.subtotal).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="bill-divider"></div>

      {/* Totals */}
      <div className="bill-totals">
        <div className="bill-total-row">
          <span>Subtotal:</span>
          <span>₹{Number(bill?.subtotal || 0).toFixed(2)}</span>
        </div>
        <div className="bill-total-row">
          <span>Tax ({taxPercentage}%):</span>
          <span>₹{Number(bill?.taxAmount || 0).toFixed(2)}</span>
        </div>
        {bill?.discountAmount > 0 && (
          <div className="bill-total-row">
            <span>Discount{Number(bill?.discountPercentage || 0) > 0 ? ` (${Number(bill.discountPercentage).toFixed(1)}%)` : ''}:</span>
            <span>-₹{Number(bill.discountAmount).toFixed(2)}</span>
          </div>
        )}
        {Number(bill?.extraCharges || 0) > 0 && (
          <div className="bill-total-row">
            <span>{table ? 'Extra Charges' : 'Packaging'}:</span>
            <span>₹{Number(bill.extraCharges).toFixed(2)}</span>
          </div>
        )}
        <div className="bill-total-row bill-grand-total">
          <strong>Grand Total:</strong>
          <strong>₹{Number(bill?.totalAmount || 0).toFixed(2)}</strong>
        </div>
      </div>

      <div className="bill-divider"></div>

      {/* Payment Status */}
      {bill?.paymentStatus === 'paid' && bill?.paymentMethod && (
        <div className="payment-info">
          <span>Paid by: </span>
          <strong className="uppercase">{bill.paymentMethod}</strong>
        </div>
      )}

      {/* Footer */}
      <div className="bill-footer">
        <p>*** Thank You for Visiting ***</p>
        <p>Please Come Again!</p>
      </div>
    </div>
  );
};

export default PrintableBill;
