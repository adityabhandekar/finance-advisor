import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Target, PiggyBank, DollarSign, CreditCard, 
  Shield, Award, RefreshCw, Wallet, TrendingDown, Calendar
} from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, 
         CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import api from '../services/api';
import ExpenseManager from '../components/ExpenseManager';
import FinancialChatbot from '../components/FinancialChatbot';

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [financialSummary, setFinancialSummary] = useState(null);

  // Real-time calculated values
  const monthlyIncome = financialSummary?.monthly_income || userData?.monthlyIncome || 0;
  const monthlyExpenses = financialSummary?.monthly_expenses || userData?.monthlyExpenses || 0;
  const monthlySavings = financialSummary?.monthly_savings || (monthlyIncome - monthlyExpenses);
  const savingsRate = financialSummary?.savings_rate || (monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0);
  const healthScore = financialSummary?.health_score || Math.min(100, Math.max(0, parseInt(savingsRate + 30)));
  const totalExpenses = financialSummary?.total_expenses || 0;
  const currentMonthExpenses = financialSummary?.current_month_expenses || 0;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setLoading(true);
    
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      
      // Get financial summary with real-time calculations
      const summaryRes = await api.get(`/users/${userId}/financial-summary`);
      if (summaryRes.data.status === 'success') {
        setFinancialSummary(summaryRes.data.summary);
      }
      
      // Load user profile
      const profileRes = await api.get(`/users/${userId}/profile`);
      setUserData(profileRes.data);
      
      // Load goals
      const goalsRes = await api.get(`/goals/${userId}`);
      setGoals(goalsRes.data.goals || []);
      
      // Load expenses
      const expensesRes = await api.get(`/expenses/${userId}`);
      setExpenses(expensesRes.data.expenses || []);
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadDashboardData();
    toast.success('Dashboard refreshed with latest data!');
  };

  // Prepare expense data for pie chart
  const expenseData = [];
  const categoryColors = {
    'Food': '#10B981', 'Transport': '#F59E0B', 'Shopping': '#EF4444',
    'Bills': '#8B5CF6', 'Entertainment': '#EC4899', 'Healthcare': '#06B6D4',
    'Education': '#6366F1', 'Rent': '#3B82F6', 'Investment': '#14B8A6',
    'Other': '#6B7280'
  };
  
  const categoryTotals = {};
  expenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });
  
  Object.entries(categoryTotals).forEach(([name, amount]) => {
    expenseData.push({ name, amount, color: categoryColors[name] || '#6B7280' });
  });

  if (expenseData.length === 0 && monthlyExpenses > 0) {
    expenseData.push(
      { name: 'Housing', amount: monthlyExpenses * 0.4, color: '#3B82F6' },
      { name: 'Food', amount: monthlyExpenses * 0.25, color: '#10B981' },
      { name: 'Transport', amount: monthlyExpenses * 0.15, color: '#F59E0B' },
      { name: 'Other', amount: monthlyExpenses * 0.2, color: '#6B7280' }
    );
  }

  const monthlyTrend = [
    { month: 'Month 1', income: monthlyIncome * 0.95, expenses: monthlyExpenses * 0.98, savings: monthlySavings * 0.95 },
    { month: 'Month 2', income: monthlyIncome * 0.98, expenses: monthlyExpenses * 0.99, savings: monthlySavings * 0.98 },
    { month: 'Current', income: monthlyIncome, expenses: monthlyExpenses, savings: monthlySavings },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
              <p className="text-gray-600">Welcome back, {userData?.name || 'User'}!</p>
            </div>
            <button 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards - Real-time calculations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90">Monthly Income</p>
                <p className="text-2xl font-bold">₹{monthlyIncome.toLocaleString('en-IN')}</p>
                <p className="text-xs opacity-80 mt-1">From your profile</p>
              </div>
              <Wallet className="h-8 w-8 text-green-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90">Monthly Expenses</p>
                <p className="text-2xl font-bold">₹{monthlyExpenses.toLocaleString('en-IN')}</p>
                <p className="text-xs opacity-80 mt-1">Based on {expenses.length} transactions</p>
              </div>
              <CreditCard className="h-8 w-8 text-red-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90">Monthly Savings</p>
                <p className="text-2xl font-bold">₹{monthlySavings.toLocaleString('en-IN')}</p>
                <p className="text-xs opacity-80 mt-1">Savings Rate: {savingsRate.toFixed(1)}%</p>
              </div>
              <PiggyBank className="h-8 w-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90">Financial Health</p>
                <p className="text-2xl font-bold">{Math.round(healthScore)}/100</p>
                <p className="text-xs opacity-80 mt-1">
                  {healthScore >= 80 ? 'Excellent!' : healthScore >= 60 ? 'Good' : 'Needs Improvement'}
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-4 shadow">
            <p className="text-sm text-gray-500">Total Expenses (All Time)</p>
            <p className="text-xl font-bold text-gray-900">₹{totalExpenses.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <p className="text-sm text-gray-500">This Month's Expenses</p>
            <p className="text-xl font-bold text-gray-900">₹{currentMonthExpenses.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <p className="text-sm text-gray-500">Active Goals</p>
            <p className="text-xl font-bold text-gray-900">{goals.length}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">Expense Breakdown</h2>
            {expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={expenseData} cx="50%" cy="50%" labelLine={false} 
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} 
                    outerRadius={100} dataKey="amount">
                    {expenseData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-12">Add expenses to see breakdown</p>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">Income vs Expenses Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                <Legend />
                <Area type="monotone" dataKey="income" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Income" />
                <Area type="monotone" dataKey="expenses" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Agents Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center mb-3">
              <Shield className="h-8 w-8 text-blue-600 mr-2" />
              <h3 className="font-semibold text-lg">Agent 1: Financial Health</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">{Math.round(healthScore)}<span className="text-sm text-gray-600">/100</span></p>
            <p className="text-gray-700 mt-2">Monthly Savings: <span className="font-semibold text-green-600">₹{monthlySavings.toLocaleString('en-IN')}</span></p>
            <p className="text-gray-700">Savings Rate: <span className="font-semibold">{savingsRate.toFixed(1)}%</span></p>
            <div className="mt-3 p-2 bg-blue-100 rounded">
              <p className="text-sm text-blue-800">
                {savingsRate >= 30 ? "Excellent savings rate! Keep investing wisely." :
                 savingsRate >= 20 ? "Good savings rate. Consider increasing investments." :
                 "Focus on reducing expenses to increase savings rate."}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center mb-3">
              <Target className="h-8 w-8 text-green-600 mr-2" />
              <h3 className="font-semibold text-lg">Agent 2: Goal Analysis</h3>
            </div>
            <p className="text-gray-700">Active Goals: <span className="font-semibold">{goals.length}</span></p>
            <p className="text-gray-700">SIP Capacity: <span className="font-semibold text-green-600">₹{(monthlySavings * 0.7).toLocaleString('en-IN')}/month</span></p>
            <div className="mt-3 p-2 bg-green-100 rounded">
              <p className="text-sm text-green-800">
                Start a SIP of ₹{(monthlySavings * 0.7).toLocaleString('en-IN')} in diversified mutual funds
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center mb-3">
              <TrendingUp className="h-8 w-8 text-purple-600 mr-2" />
              <h3 className="font-semibold text-lg">Agent 3: Investment Plan</h3>
            </div>
            <p className="text-gray-700">Recommended SIP: <span className="font-semibold text-purple-600">₹{(monthlySavings * 0.7).toLocaleString('en-IN')}</span></p>
            <p className="text-gray-700">Expected Return: <span className="font-semibold">12-15% annually</span></p>
            <div className="mt-3 p-2 bg-purple-100 rounded">
              <p className="text-sm text-purple-800">
                Allocation: 50% Equity, 30% Debt, 10% Gold, 10% Cash
              </p>
            </div>
          </div>
        </div>

        {/* Goals Section */}
        <div className="bg-white rounded-xl p-6 shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Financial Goals</h2>
          {goals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No goals yet. Add your first goal!</p>
          ) : (
            goals.map((goal, i) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              const remaining = goal.target_amount - goal.current_amount;
              const monthsLeft = goal.deadline ? Math.max(1, (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24 * 30)) : 12;
              const monthlyNeeded = remaining / monthsLeft;
              const isOnTrack = monthlySavings >= monthlyNeeded;
              
              return (
                <div key={i} className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        goal.priority === 'High' ? 'bg-red-100 text-red-700' :
                        goal.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {goal.priority} Priority
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Target: ₹{goal.target_amount.toLocaleString('en-IN')}</p>
                      <p className={`text-xs font-semibold ${isOnTrack ? 'text-green-600' : 'text-red-600'}`}>
                        {isOnTrack ? '✓ On Track' : '⚠ Needs Attention'}
                      </p>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 rounded-full h-2" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="bg-green-50 p-2 rounded">
                      <p className="text-xs text-green-800">Remaining</p>
                      <p className="text-sm font-bold">₹{remaining.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      <p className="text-xs text-blue-800">Monthly Needed</p>
                      <p className="text-sm font-bold">₹{Math.ceil(monthlyNeeded).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <p className="text-xs text-purple-800">Time Left</p>
                      <p className="text-sm font-bold">{monthsLeft.toFixed(0)} months</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Expense Manager */}
        <ExpenseManager userId={localStorage.getItem('userId')} onExpenseUpdate={loadDashboardData} />
      </div>
      
      {/* AI Chatbot */}
      <FinancialChatbot userId={localStorage.getItem('userId')} />
    </div>
  );
}

export default Dashboard;