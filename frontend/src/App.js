import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
import UpdateSecurityPage from './UpdateSecurityPage'; // We will create this next
import Dashboard from './Dashboard';
import VerifyPortal from "./VerifyPortal";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/update-security" element={<UpdateSecurityPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/verify/:certNo" element={<VerifyPortal />} />
      </Routes>
    </Router>
  );
}

export default App;