/**
 * Restaurant Information Card - Settings Sub-component
 * Handles name, phone, email, address, opening/closing time, logo.
 */
import { useState, useCallback, useMemo } from 'react';
import { Building2, Save, Upload } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import SettingsService from '../../services/settings.service';

const RestaurantInfoCard = ({ initialData, toast }) => {
  const [info, setInfo] = useState({
    name: initialData?.name || '',
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    openingTime: initialData?.openingTime || '10:00',
    closingTime: initialData?.closingTime || '23:00',
    logo: initialData?.logo || null,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = useCallback((field, value) => {
    setInfo(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleLogoUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setInfo(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  }, [toast]);

  const isValid = useMemo(() => {
    return info.name && info.phone && info.email && info.address;
  }, [info]);

  const handleSave = useCallback(async () => {
    if (!isValid) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      setSaving(true);
      await SettingsService.updateRestaurantInfo({
        name: info.name,
        phone: info.phone,
        email: info.email,
        address: info.address,
      });
      await SettingsService.updateRestaurantSettings({
        openingTime: info.openingTime,
        closingTime: info.closingTime,
      });
      toast.success('Restaurant information saved successfully!');
    } catch (error) {
      console.error('Failed to save restaurant info:', error);
      toast.error(error?.response?.data?.message || 'Failed to save restaurant information');
    } finally {
      setSaving(false);
    }
  }, [info, isValid, toast]);

  // Allow parent to push new data when loaded from API
  // (handled via key remount or useEffect in parent)

  return (
    <Card
      title="Restaurant Information"
      icon={<Building2 size={20} />}
      className="mb-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name *</label>
          <input
            type="text"
            value={info.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
            placeholder="Enter restaurant name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
          <input
            type="tel"
            value={info.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
            placeholder="+91 98765 43210"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
          <input
            type="email"
            value={info.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
            placeholder="contact@restaurant.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
          <input
            type="text"
            value={info.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
            placeholder="123 Main Street"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Opening Time *</label>
          <input
            type="time"
            value={info.openingTime}
            onChange={(e) => handleChange('openingTime', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Closing Time *</label>
          <input
            type="time"
            value={info.closingTime}
            onChange={(e) => handleChange('closingTime', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Logo</label>
          <div className="flex items-center gap-4">
            {info.logo && (
              <img src={info.logo} alt="Restaurant Logo" className="w-20 h-20 object-cover rounded-lg border-2 border-gray-300 shadow-sm" />
            )}
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <div className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors">
                <Upload size={16} />
                {info.logo ? 'Change Logo' : 'Upload Logo'}
              </div>
            </label>
            <p className="text-xs text-gray-500">Max size: 2MB</p>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="primary" icon={<Save size={16} />} onClick={handleSave} disabled={!isValid || saving}>
          {saving ? 'Saving...' : 'Save Restaurant Info'}
        </Button>
      </div>
    </Card>
  );
};

export default RestaurantInfoCard;
