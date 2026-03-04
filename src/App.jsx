import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import BillingDashboard from './pages/BillingDashboard';
import MenuCategories from './pages/MenuCategories';
import MenuItems from './pages/MenuItems';
import ParcelOrders from './pages/ParcelOrders';
import CreateParcelOrder from './pages/CreateParcelOrder';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

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
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
