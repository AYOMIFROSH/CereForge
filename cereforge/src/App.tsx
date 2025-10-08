import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/pages/LandingPage';
import LoginPage from './components/pages/LoginPage';
import GetStarted from './components/pages/GetStarted';
import CalendarPage from './components/pages/CalendarPage';
import ConsultationBooking from './components/calendar/ConsultationBooking';
import { Analytics } from "@vercel/analytics/react"

const App = () => {
  return (
    <Router>
      <Analytics />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route 
          path="/consultation" 
          element={
            <ConsultationBooking 
              isOpen={true} 
              onClose={() => window.location.href = '/calendar'} 
            />
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;