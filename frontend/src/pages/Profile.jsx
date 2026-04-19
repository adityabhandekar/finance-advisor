import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, DollarSign, Briefcase, Heart, Users, TrendingUp, Edit2, Save, X, Award, Target, PiggyBank, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
    fetchFinancialSummary();
  }, []);

  const fetchProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await api.get(`/users/${userId}/profile`);
      setUserData(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialSummary = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await api.get(`/users/${userId}/financial-summary`);
      setFinancialSummary(response.data.summary);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const userId = localStorage.getItem('userId');
      const response = await api.put(`/users/${userId}/profile`, formData);
      
      if (response.data.status === 'success') {
        setUserData(response.data.user);
        setEditing(false);
        await fetchFinancialSummary();
        toast.success('Profile updated successfully!');
        
        // Update localStorage with new user data
        localStorage.setItem('userName', response.data.user.name);
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(userData);
    setEditing(false);
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getHealthScoreMessage = (score) => {
    if (score >= 80) return 'Excellent! You\'re on the right track!';
    if (score >= 60) return 'Good! Keep improving your savings.';
    if (score >= 40) return 'Fair. Focus on increasing savings.';
    return 'Needs attention. Review your expenses.';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const monthlyIncome = financialSummary?.monthlyIncome || userData?.monthlyIncome || 0;
  const monthlyExpenses = financialSummary?.monthlyExpenses || userData?.monthlyExpenses || 0;
  const monthlySavings = financialSummary?.monthlySavings || (monthlyIncome - monthlyExpenses);
  const savingsRate = financialSummary?.savingsRate || (monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0);
  const healthScore = financialSummary?.healthScore || (Math.min(100, Math.max(0, parseInt(savingsRate + 30))));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">Manage your personal and financial information</p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personal Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                {editing ? (
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{userData?.name || 'N/A'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <p className="text-gray-900">{userData?.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                {editing ? (
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.age || ''}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                ) : (
                  <p className="text-gray-900">{userData?.age || 'N/A'} years</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                {editing ? (
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.job_type || 'Salaried'}
                    onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                  >
                    <option value="Salaried">Salaried Employee</option>
                    <option value="Business">Business Owner</option>
                    <option value="Freelancer">Freelancer</option>
                    <option value="Self Employed">Self Employed</option>
                    <option value="Student">Student</option>
                    <option value="Retired">Retired</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{userData?.job_type || 'N/A'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                {editing ? (
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.marital_status || 'Single'}
                    onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{userData?.marital_status || 'N/A'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Children</label>
                {editing ? (
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.children || 0}
                    onChange={(e) => setFormData({ ...formData, children: e.target.value })}
                  />
                ) : (
                  <p className="text-gray-900">{userData?.children || 0}</p>
                )}
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Financial Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income (₹)</label>
                {editing ? (
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.annualIncome || ''}
                    onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
                  />
                ) : (
                  <p className="text-2xl font-bold text-green-600">₹{(userData?.annualIncome || 0).toLocaleString('en-IN')}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Expenses (₹)</label>
                {editing ? (
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.monthlyExpenses || ''}
                    onChange={(e) => setFormData({ ...formData, monthlyExpenses: e.target.value })}
                  />
                ) : (
                  <p className="text-2xl font-bold text-red-600">₹{(userData?.monthlyExpenses || 0).toLocaleString('en-IN')}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Tolerance</label>
                {editing ? (
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.risk_tolerance || 'Moderate'}
                    onChange={(e) => setFormData({ ...formData, risk_tolerance: e.target.value })}
                  >
                    <option value="Conservative">Conservative (Low Risk)</option>
                    <option value="Moderate">Moderate (Medium Risk)</option>
                    <option value="Aggressive">Aggressive (High Risk)</option>
                  </select>
                ) : (
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    userData?.risk_tolerance === 'Conservative' ? 'bg-green-100 text-green-700' :
                    userData?.risk_tolerance === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {userData?.risk_tolerance || 'Moderate'}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income</label>
                <p className="text-xl font-semibold text-blue-600">₹{monthlyIncome.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Health Card - Real-time calculations */}
        <div>
          {/* Health Score Card */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md p-6 text-white mb-6">
            <div className="flex items-center mb-4">
              <Award className="h-8 w-8 mr-2" />
              <h3 className="text-lg font-semibold">Financial Health Score</h3>
            </div>
            <p className="text-5xl font-bold mb-2">{Math.round(healthScore)}/100</p>
            <p className="text-blue-100 text-sm">{getHealthScoreMessage(healthScore)}</p>
          </div>

          {/* Savings Rate Card */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center mb-3">
              <PiggyBank className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Savings Rate</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{savingsRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-500 mt-2">
              Monthly Savings: ₹{monthlySavings.toLocaleString('en-IN')}
            </p>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 rounded-full h-2 transition-all duration-500"
                style={{ width: `${Math.min(savingsRate, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {savingsRate >= 20 ? '✓ Good savings rate!' : '⚠️ Aim for 20%+ savings rate'}
            </p>
          </div>

          {/* Quick Tips */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Target className="h-5 w-5 mr-2 text-purple-600" />
              Personalized Tips
            </h3>
            <ul className="space-y-2 text-sm">
              {savingsRate < 20 && (
                <li className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                  <span className="text-gray-600">Increase savings by reducing discretionary spending</span>
                </li>
              )}
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-600">Build emergency fund of ₹{(monthlyExpenses * 6).toLocaleString('en-IN')}</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-600">Start SIP of ₹{(monthlySavings * 0.7).toLocaleString('en-IN')}/month</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-600">Invest in PPF for tax benefits under 80C</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;