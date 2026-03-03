import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import BillingDashboard from './pages/BillingDashboard';
import MenuCategories from './pages/MenuCategories';
import MenuItems from './pages/MenuItems';
import ParcelOrders from './pages/ParcelOrders';
import CreateParcelOrder from './pages/CreateParcelOrder';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<BillingDashboard />} />
          <Route path="menu-categories" element={<MenuCategories />} />
          <Route path="menu-items" element={<MenuItems />} />
          <Route path="parcel-orders" element={<ParcelOrders />} />
          <Route path="create-parcel-order" element={<CreateParcelOrder />} />
          <Route path="reports" element={<div className="p-8"><h2 className="text-2xl font-bold">Reports Page - Coming Soon</h2></div>} />
          <Route path="settings" element={<div className="p-8"><h2 className="text-2xl font-bold">Settings Page - Coming Soon</h2></div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
