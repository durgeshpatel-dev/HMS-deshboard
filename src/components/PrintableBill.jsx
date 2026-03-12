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

  return (
    <div className="printable-bill">
      {/* Restaurant Header */}
      <div className="bill-header">
        <h1 className="restaurant-name">{restaurantInfo?.name || 'Restaurant HMS'}</h1>
        {restaurantInfo?.address && <p className="restaurant-address">{restaurantInfo.address}</p>}
        {restaurantInfo?.phone && <p className="restaurant-contact">{restaurantInfo.phone}</p>}
        {restaurantInfo?.email && <p className="restaurant-contact">{restaurantInfo.email}</p>}
        {(restaurantInfo?.settings?.gstNumber || restaurantInfo?.gstNumber) && (
          <p className="restaurant-gst"><strong>GSTIN: {restaurantInfo?.settings?.gstNumber || restaurantInfo?.gstNumber}</strong></p>
        )}
      </div>

      <div className="bill-divider"></div>

      {/* Bill Info */}
      <div className="bill-info">
        <div className="bill-info-row">
          <span>Bill#:</span>
          <strong>{bill?.billNumber || 'N/A'}</strong>
        </div>
        <div className="bill-info-row">
          <span>{table?.tableNumber?.toString().startsWith('Parcel') ? 'Order Type:' : 'Table:'}</span>
          <strong>{table?.tableNumber?.toString().startsWith('Parcel') ? 'Parcel' : (table?.tableNumber || 'N/A')}</strong>
        </div>
        {table?.tableNumber?.toString().startsWith('Parcel') && table?.tableNumber?.toString().includes('–') && (
          <div className="bill-info-row">
            <span>Customer:</span>
            <strong>{table.tableNumber.toString().split('–')[1]?.trim()}</strong>
          </div>
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
            <div className="item-price-line">
              <span className="item-unit-price">
                ₹{Number(
                  item.unitPrice ||
                  item.menuItem?.price ||
                  (Number(item.quantity) > 0 ? Number(item.subtotal || 0) / Number(item.quantity) : 0)
                ).toFixed(2)} each
              </span>
              <span className="item-amount">₹{Number(item.subtotal).toFixed(2)}</span>
            </div>
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
          <span>Tax ({restaurantInfo?.settings?.taxPercentage ?? restaurantInfo?.taxRate ?? restaurantInfo?.settings?.tax_percentage ?? 5}%):</span>
          <span>₹{Number(bill?.taxAmount || 0).toFixed(2)}</span>
        </div>
        {bill?.discountAmount > 0 && (
          <div className="bill-total-row">
            <span>
              Discount{Number(bill?.discountPercentage || 0) > 0 ? ` (${Number(bill.discountPercentage).toFixed(2)}%)` : ''}:
            </span>
            <span>-₹{Number(bill.discountAmount).toFixed(2)}</span>
          </div>
        )}
        {Number(bill?.extraCharges || 0) > 0 && (
          <div className="bill-total-row">
            <span>Packaging:</span>
            <span>+₹{Number(bill.extraCharges).toFixed(2)}</span>
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
