/**
 * Tax & Billing Card - Settings Sub-component
 * Handles tax percentage and GST number configuration.
 */
import { useState, useCallback } from 'react';
import { Receipt, Save, Percent } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import SettingsService from '../../services/settings.service';

const TaxBillingCard = ({ initialSettings, toast }) => {
  const [settings, setSettings] = useState({
    taxPercentage: initialSettings?.taxPercentage ?? 5,
    gstNumber: initialSettings?.gstNumber || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const pct = Number(settings.taxPercentage);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      toast.error('Tax percentage must be between 0 and 100');
      return;
    }
    try {
      setSaving(true);
      await SettingsService.updateRestaurantSettings({
        taxPercentage: pct,
        gstNumber: settings.gstNumber.trim(),
      });
      toast.success('Tax & billing settings saved successfully!');
    } catch (error) {
      console.error('Failed to save tax settings:', error);
      toast.error(error?.response?.data?.message || 'Failed to save tax settings');
    } finally {
      setSaving(false);
    }
  }, [settings, toast]);

  return (
    <Card title="Tax & Billing" icon={<Receipt size={20} />} className="mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tax Percentage (%)</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={settings.taxPercentage}
              onChange={(e) => setSettings(prev => ({ ...prev, taxPercentage: e.target.value }))}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
              placeholder="e.g. 5"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Percent size={16} />
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Applied to all orders. This rate appears on printed bills.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
          <input
            type="text"
            value={settings.gstNumber}
            onChange={(e) => setSettings(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors font-mono tracking-wider"
            placeholder="e.g. 22AAAAA0000A1Z5"
            maxLength={20}
          />
          <p className="text-xs text-gray-500 mt-1">Printed on every bill for GST compliance. Leave blank if not applicable.</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="primary" icon={<Save size={16} />} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Tax Settings'}
        </Button>
      </div>
    </Card>
  );
};

export default TaxBillingCard;
