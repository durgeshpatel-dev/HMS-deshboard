import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import MainLayout from './components/layout/MainLayout';
import BillingDashboard from './pages/BillingDashboard';
import MenuCategories from './pages/MenuCategories';
import MenuItems from './pages/MenuItems';
import ParcelOrders from './pages/ParcelOrders';
import CreateParcelOrder from './pages/CreateParcelOrder';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import StaffManagement from './pages/StaffManagement';
import KitchenDisplay from './pages/KitchenDisplay';
import ManagerLogin from './pages/auth/ManagerLogin';
import ManagerSignup from './pages/auth/ManagerSignup';
import PendingApproval from './pages/auth/PendingApproval';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<ManagerLogin />} />
              <Route path="/signup" element={<ManagerSignup />} />
              <Route path="/pending-approval" element={<PendingApproval />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<BillingDashboard />} />
                <Route path="kitchen" element={<KitchenDisplay />} />
                <Route path="staff" element={<StaffManagement />} />
                <Route path="menu-categories" element={<MenuCategories />} />
                <Route path="menu-items" element={<MenuItems />} />
                <Route path="parcel-orders" element={<ParcelOrders />} />
                <Route path="create-parcel-order" element={<CreateParcelOrder />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
