import { Routes, Route, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoutes';
import LandingPage from './components/pages/LandingPage';
import LoginPage from './components/pages/LoginPage';
import GetStarted from './components/pages/GetStarted';
import CalendarPage from './components/pages/CalendarPage';
import ConsultationBooking from './components/calendar/ConsultationBooking';
import { Analytics } from "@vercel/analytics/react"
import CereforgeEditor from './components/textEditor/RichtextEditor';

// Import your dashboard components
import PartnerDashboard from './components/pages/dashboards/PartnerDashboard';
import AdminDashboard from './components/pages/dashboards/AdminDashboard';
import CoreDashboard from './components/pages/dashboards/CoreDashboard';

const App = () => {
  const navigate = useNavigate();

  return (
    <>
      <Analytics />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path='/editor' element={<CereforgeEditor />} />

        <Route
          path="/consultation-popup"
          element={
            <ConsultationBooking
              isOpen={true}
              onClose={() => window.location.href = '/calendar'}
              mode="popup"
            />
          }
        />

        <Route
          path="/consultation"
          element={
            <ConsultationBooking
              isOpen={true}
              onClose={() => navigate('/calendar')}
              mode="standalone"
            />
          }
        />

        {/* Protected routes - Partner */}
        <Route
          path="/partner/dashboard"
          element={
            <ProtectedRoute allowedRoles={['partner']}>
              <PartnerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected routes - Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin', 'core']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected routes - Core */}
        <Route
          path="/core/dashboard"
          element={
            <ProtectedRoute allowedRoles={['core']}>
              <CoreDashboard />
            </ProtectedRoute>
          }
        />

        {/* Unauthorized page */}
        <Route path="/unauthorized" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl font-bold">Unauthorized Access</h1></div>} />
      </Routes>
    </>
  );
};

export default App;