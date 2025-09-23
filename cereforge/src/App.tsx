import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import GetStarted from './components/GetStarted';
import { Analytics } from "@vercel/analytics/react"

const App = () => {
  return (
    <Router>
      <Analytics />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/get-started" element={<GetStarted />} />
      </Routes>
    </Router>
  );
};

export default App;