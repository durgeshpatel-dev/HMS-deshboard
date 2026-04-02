import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import MainLayout from './components/layout/MainLayout';

const BillingDashboard = lazy(() => import('./pages/BillingDashboard'));
const MenuCategories = lazy(() => import('./pages/MenuCategories'));
const MenuItems = lazy(() => import('./pages/MenuItems'));
const ParcelOrders = lazy(() => import('./pages/ParcelOrders'));
const CreateParcelOrder = lazy(() => import('./pages/CreateParcelOrder'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const StaffManagement = lazy(() => import('./pages/StaffManagement'));
const KitchenDisplay = lazy(() => import('./pages/KitchenDisplay'));
const ManagerLogin = lazy(() => import('./pages/auth/ManagerLogin'));
const ManagerSignup = lazy(() => import('./pages/auth/ManagerSignup'));
const PendingApproval = lazy(() => import('./pages/auth/PendingApproval'));
const VerifySignupOtp = lazy(() => import('./pages/auth/VerifySignupOtp'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

const RouteFallback = () => (
  <div className="min-h-screen w-full flex items-center justify-center text-gray-600">
    Loading...
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <NotificationProvider>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<ManagerLogin />} />
                  <Route path="/signup" element={<ManagerSignup />} />
                  <Route path="/verify-signup-otp" element={<VerifySignupOtp />} />
                  <Route path="/pending-approval" element={<PendingApproval />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

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
              </Suspense>
            </NotificationProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
