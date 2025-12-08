import { lazy, Suspense } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";

// ✅ Import components that are NOT lazy loaded (critical path)
import { ProtectedRoute } from './components/ProtectedRoutes';
import { PageLoadingSkeleton } from './components/LoadingSkeleton';
import { ToastNotifications } from './components/ToastNotification';
import { AuthDebugHelper } from './components/common/AuthDebugHelper';
import LandingPage from './components/pages/LandingPage';
import ForgotPassword from './components/pages/ForgotPassword';
import MeetPage from './components/pages/MeetPage';

// ✅ Lazy load all route components (code splitting)
const LoginPage = lazy(() => import('./components/pages/LoginPage'));
const GetStarted = lazy(() => import('./components/pages/GetStarted'));
const CalendarPage = lazy(() => import('./components/pages/CalendarPage'));
const ConsultationBooking = lazy(() => import('./components/calendar/ConsultationBooking'));
const CereforgeEditor = lazy(() => import('./components/textEditor/RichtextEditor'));

// ✅ Lazy load dashboard components (heavy components)
const PartnerDashboard = lazy(() => import('./components/pages/dashboards/PartnerDashboard'));
const AdminDashboard = lazy(() => import('./components/pages/dashboards/AdminDashboard'));
const CoreDashboard = lazy(() => import('./components/pages/dashboards/CoreDashboard'));

// ✅ Unauthorized page (simple, no lazy load needed)
const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
      <p className="text-xl text-gray-600 mb-8">Unauthorized Access</p>
      <a
        href="/"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go Home
      </a>
    </div>
  </div>
);

const App = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Analytics */}
      <Analytics />

      {/* Toast Notifications (global) */}
      <ToastNotifications />

      {import.meta.env.DEV && <AuthDebugHelper />}

      {/* Suspense wrapper for all lazy-loaded routes */}
      <Suspense fallback={<PageLoadingSkeleton />}>
        <Routes>
          {/* ============================================ */}
          {/* PUBLIC ROUTES (Lazy Loaded) */}
          {/* ============================================ */}

          <Route path="/" element={<LandingPage />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/get-started" element={<GetStarted />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/editor" element={<CereforgeEditor />} />

          {/* ✅ MAIN VIDEO CALL ROUTE - /meet/:roomId (PROTECTED) */}
          <Route
            path="/meet/:roomId"
            element={
              <ProtectedRoute allowedRoles={['partner', 'admin', 'core']}>
                <MeetPage />
              </ProtectedRoute>
            }
          />

          {/* Consultation Routes */}
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

          {/* ============================================ */}
          {/* PROTECTED ROUTES (Lazy Loaded + Auth Check) */}
          {/* ============================================ */}

          {/* Partner Routes */}
          <Route
            path="/partner/dashboard"
            element={
              <ProtectedRoute allowedRoles={['partner']}>
                <PartnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'core']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Core Routes */}
          <Route
            path="/core/dashboard"
            element={
              <ProtectedRoute allowedRoles={['core']}>
                <CoreDashboard />
              </ProtectedRoute>
            }
          />

          {/* ============================================ */}
          {/* ERROR ROUTES */}
          {/* ============================================ */}

          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* 404 Catch-all */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-xl text-gray-600 mb-8">Page Not Found</p>
                  <a
                    href="/"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go Home
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;