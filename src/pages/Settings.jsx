/**
 * Settings Page - Slim Orchestrator
 * Loads restaurant data once, delegates to self-contained section components.
 *
 * Sub-components (in ./settings/):
 *   RestaurantInfoCard  – name, phone, email, address, hours, logo
 *   TableConfigCard     – table CRUD, status, real-time socket updates
 *   PaymentMethodsCard  – payment method toggles with auto-save
 *   TaxBillingCard      – tax %, GST number
 */

import { useState, useCallback, useEffect } from 'react';
import Header from '../components/layout/Header';
import ToastContainer from '../components/common/Toast';
import useToast from '../hooks/useToast';
import SettingsService from '../services/settings.service';
import RestaurantInfoCard from './settings/RestaurantInfoCard';
import TableConfigCard from './settings/TableConfigCard';
import PaymentMethodsCard from './settings/PaymentMethodsCard';
import TaxBillingCard from './settings/TaxBillingCard';

const Settings = () => {
  const { toasts, toast, dismissToast } = useToast();
  const [loaded, setLoaded] = useState(false);
  const [restaurantData, setRestaurantData] = useState(null);

  const loadSettings = useCallback(async () => {
    try {
      const response = await SettingsService.getRestaurantSettings();
      const data = response.data || response;
      setRestaurantData(data);
    } catch (error) {
      console.error('Failed to load restaurant settings:', error);
      toast.error(error?.response?.data?.message || 'Failed to load restaurant settings');
    } finally {
      setLoaded(true);
    }
  }, [toast]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // Derive initial props for sub-components from the loaded data
  const restaurantInfoData = restaurantData ? {
    name: restaurantData.name || '',
    address: restaurantData.address || '',
    phone: restaurantData.phone || '',
    email: restaurantData.email || '',
    openingTime: restaurantData.settings?.openingTime || '10:00',
    closingTime: restaurantData.settings?.closingTime || '23:00',
    logo: restaurantData.logo || null,
  } : undefined;

  const paymentMethods = restaurantData?.settings?.paymentMethods;
  const taxSettings = restaurantData ? {
    taxPercentage: Number(restaurantData.settings?.taxPercentage ?? restaurantData.settings?.tax_percentage ?? 5),
    gstNumber: restaurantData.settings?.gstNumber || '',
  } : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Settings" />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {loaded && (
          <>
            <RestaurantInfoCard key="info" initialData={restaurantInfoData} toast={toast} />
            <TableConfigCard toast={toast} />
            <PaymentMethodsCard initialMethods={paymentMethods} toast={toast} />
            <TaxBillingCard initialSettings={taxSettings} toast={toast} />
          </>
        )}
      </div>
    </div>
  );
};

export default Settings;

