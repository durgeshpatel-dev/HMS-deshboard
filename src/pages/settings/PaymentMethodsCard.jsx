/**
 * Payment Methods Card - Settings Sub-component
 * Handles toggling payment methods on/off with auto-save.
 */
import { useState, useCallback } from 'react';
import { CreditCard } from 'lucide-react';
import Card from '../../components/common/Card';
import SettingsService from '../../services/settings.service';

const PaymentMethodsCard = ({ initialMethods, toast }) => {
  const [methods, setMethods] = useState(
    initialMethods || [
      { id: 1, name: 'Cash', enabled: true },
      { id: 2, name: 'Card', enabled: true },
      { id: 3, name: 'UPI', enabled: true },
      { id: 4, name: 'Online', enabled: false },
    ]
  );
  const [savingId, setSavingId] = useState(null);

  const handleToggle = useCallback(async (methodId) => {
    const updated = methods.map(pm =>
      pm.id === methodId ? { ...pm, enabled: !pm.enabled } : pm
    );
    setMethods(updated);
    setSavingId(methodId);

    try {
      await SettingsService.updateRestaurantSettings({ paymentMethods: updated });
      toast.success('Payment method updated successfully');
    } catch (error) {
      console.error('Failed to update payment method:', error);
      toast.error(error?.response?.data?.message || 'Failed to update payment method');
      setMethods(methods); // revert
    } finally {
      setSavingId(null);
    }
  }, [methods, toast]);

  return (
    <Card title="Payment Methods" icon={<CreditCard size={20} />}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {methods.map((method) => (
          <div
            key={method.id}
            className={`p-4 border-2 rounded-lg transition-all ${
              method.enabled ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">{method.name}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={method.enabled}
                  onChange={() => handleToggle(method.id)}
                  disabled={savingId === method.id}
                  className="sr-only peer"
                  aria-label={`Toggle ${method.name}`}
                />
                <div className={`w-11 h-6 ${savingId === method.id ? 'opacity-50' : ''} bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500`}></div>
              </label>
            </div>
            <p className="text-xs text-gray-600">{method.enabled ? 'Enabled for customers' : 'Disabled'}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PaymentMethodsCard;
