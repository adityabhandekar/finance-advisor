import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Goals from './pages/Goals';
import Investments from './pages/Investments';
import Navbar from './components/Navbar';

function App() {
  const token = localStorage.getItem('authToken');
  const isAuthenticated = !!token;

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {isAuthenticated && <Navbar />}
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
          <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/goals" element={isAuthenticated ? <Goals /> : <Navigate to="/login" />} />
          <Route path="/investments" element={isAuthenticated ? <Investments /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;