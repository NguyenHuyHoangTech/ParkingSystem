import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import UserDashboard from './pages/dashboard/UserDashboard';
import UserActiveSession from './pages/dashboard/UserActiveSession';
import UserBookingForm from './pages/dashboard/UserBookingForm';
import UserBookings from './pages/dashboard/UserBookings';
import UserFeedbackForm from './pages/dashboard/UserFeedbackForm';
import UserFeedbackList from './pages/dashboard/UserFeedbackList';
import MockPaymentGateway from './pages/dashboard/MockPaymentGateway';
import StaffDashboard from './pages/dashboard/StaffDashboard';
import StaffCheckIn from './pages/dashboard/StaffCheckIn';
import StaffCheckOut from './pages/dashboard/StaffCheckOut';
import StaffExceptions from './pages/dashboard/StaffExceptions';
import StaffOverview from './pages/dashboard/StaffOverview';
import ManagerDashboard from './pages/dashboard/ManagerDashboard';
import PricingManagement from './pages/dashboard/PricingManagement';
import PenaltyManagement from './pages/dashboard/PenaltyManagement';
import UserHelp from './pages/public/UserHelp';
import UserTracking from './pages/public/UserTracking';

// Create a new empty layout for public pages
const PublicLayout = ({ children }) => <>{children}</>;
import BuildingManagement from './pages/dashboard/BuildingManagement';
import MonthlyTicketManagement from './pages/dashboard/MonthlyTicketManagement';
import GateManagement from './pages/dashboard/GateManagement';
import FloorAllocation from './pages/dashboard/FloorAllocation';
import ReportDashboard from './pages/dashboard/ReportDashboard';
import IncidentDashboard from './pages/dashboard/IncidentDashboard';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsersList from './pages/admin/AdminUsersList';
import AdminRoleManagement from './pages/admin/AdminRoleManagement';
import AdminSystemConfig from './pages/admin/AdminSystemConfig';

import './App.css';

function App() {
  const initialOptions = {
    "client-id": "AZHnPqQNeqh_XWk2roSfJqxopRTPF7Dq8kcjYcTfjJMpvbHnsdoAHFjsOwlSSq-FvCRlX09KhGgDuyxB",
    currency: "USD",
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Camera Simulator Route */}

        {/* Mock Payment Gateway */}
        <Route path="/payment-gateway" element={<MockPaymentGateway />} />

        {/* Driver (Customer) Route */}
        <Route
          path="/user/*"
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <AppLayout role="USER">
                <Routes>
                  <Route path="/" element={<UserDashboard />} />
                  <Route path="/booking" element={<UserBookingForm />} />
                  <Route path="/bookings" element={<UserBookings />} />
                  <Route path="/sessions" element={<UserActiveSession />} />
                  <Route path="/feedback-form" element={<UserFeedbackForm />} />
                  <Route path="/feedback-history" element={<UserFeedbackList />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Staff (Operator) Route */}
        <Route
          path="/staff/*"
          element={
            <ProtectedRoute allowedRoles={['STAFF', 'MANAGER', 'ADMIN']}>
              <AppLayout role="STAFF">
                <Routes>
                  <Route path="/" element={<StaffOverview />} />
                  <Route path="/checkin" element={<StaffCheckIn />} />
                  <Route path="/checkout" element={<StaffCheckOut />} />
                  <Route path="/exceptions" element={<StaffExceptions />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Manager (Parking Lot Manager) Route */}
        <Route
          path="/manager/*"
          element={
            <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <AppLayout role="MANAGER">
                <Routes>
                  <Route path="/" element={<ManagerDashboard />} />
                  <Route path="/building" element={<BuildingManagement />} />
                  <Route path="/monthly-tickets" element={<MonthlyTicketManagement />} />
                  <Route path="/gates" element={<GateManagement />} />
                  <Route path="/floor-allocation" element={<FloorAllocation />} />
                  <Route path="/floors" element={<ManagerDashboard />} />
                  <Route path="/pricing" element={<PricingManagement />} />
                  <Route path="/penalties" element={<PenaltyManagement />} />
                  <Route path="/reports" element={<ReportDashboard />} />
                  <Route path="/incidents" element={<IncidentDashboard />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin (System Administrator) Route */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppLayout role="ADMIN">
                <Routes>
                  <Route path="/" element={<AdminOverview />} />
                  <Route path="/accounts" element={<AdminUsersList />} />
                  <Route path="/settings" element={<AdminSystemConfig />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/help" element={
          <PublicLayout>
            <UserHelp />
          </PublicLayout>
        } />
        <Route path="/track" element={
          <PublicLayout>
            <UserTracking />
          </PublicLayout>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </PayPalScriptProvider>
  );
}

export default App;
