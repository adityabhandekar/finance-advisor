import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Home, Target, TrendingUp, LogOut, User, BarChart3, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <Wallet className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                FinanceAdvisor
              </span>
            </Link>
            
            <div className="hidden md:flex space-x-4">
              <Link to="/" className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                <Home className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <Link to="/goals" className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                <Target className="h-5 w-5" />
                <span>Goals</span>
              </Link>
              <Link to="/investments" className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                <TrendingUp className="h-5 w-5" />
                <span>Investments</span>
              </Link>
              <Link to="/reports" className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition">
                <FileText className="h-5 w-5" />
                <span>Reports</span>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <User className="h-5 w-5" />
              <span className="text-sm hidden md:inline">My Account</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;