import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, Target, PiggyBank, AlertCircle, 
  DollarSign, CreditCard, Calendar, ChevronRight, 
  Shield, Award, Clock, BarChart3, PieChart as PieChartIcon, Download, RefreshCw 
} from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, 
         CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import api from '../services/api';
import ExpenseManager from '../components/ExpenseManager';

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [financialData, setFinancialData] = useState({
    monthly_income: 50000,
    monthly_expenses: 35000,
    savings_rate: 30,
    debt: 500000,
    emergency_fund: 100000
  });
  const [goals, setGoals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all dashboard data
  const fetchAllData = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        console.error('No userId found');
        return;
      }
      
      // Fetch user profile
      const profileRes = await api.get(`/users/${userId}/profile`);
      setUserData(profileRes.data);
      
      // Update financial data with real income
      if (profileRes.data?.monthlyIncome) {
        setFinancialData(prev => ({
          ...prev,
          monthly_income: profileRes.data.monthlyIncome,
          monthly_expenses: profileRes.data.monthlyExpenses || 35000
        }));
      }
      
      // Fetch goals
      const goalsRes = await api.get(`/goals/${userId}`);
      setGoals(goalsRes.data.goals || []);
      
      // Fetch AI analysis
      const analysisRes = await api.post('/analyze', {
        user_id: userId,
        financial_data: financialData
      });
      setAiInsights(analysisRes.data.data);
      
      // Generate sample transactions for demo
      setTransactions(generateSampleTransactions());
      
      toast.success('Dashboard updated!');
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set sample data for demo
      setGoals([
        { _id: '1', name: 'Emergency Fund', target_amount: 300000, current_amount: 100000, priority: 'High', deadline: '2025-12-31' },
        { _id: '2', name: 'Retirement Corpus', target_amount: 5000000, current_amount: 500000, priority: 'High', deadline: '2040-12-31' },
        { _id: '3', name: 'Buy a House', target_amount: 1500000, current_amount: 200000, priority: 'Medium', deadline: '2028-06-30' }
      ]);
      setAiInsights({
        financial_health: { score: 72, monthly_savings: 15000, recommendations: ['Increase savings to 30%', 'Build emergency fund of 6 months expenses', 'Start SIP in mutual funds'] },
        investment_plan: { allocation: { equity: 50, debt: 30, gold: 10, cash: 10 }, expected_return: '12%' }
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing, financialData]);

  // Run only once on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const handleRefresh = () => {
    if (!isRefreshing) {
      fetchAllData();
    }
  };

  const generateSampleTransactions = () => {
    const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare'];
    return Array.from({ length: 10 }, (_, i) => ({
      id: i,
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      amount: Math.random() * 5000 + 500,
      category: categories[Math.floor(Math.random() * categories.length)],
      type: Math.random() > 0.7 ? 'income' : 'expense'
    }));
  };

  const calculateProgress = (current, target) => {
    if (!current || !target) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const expenseData = [
    { name: 'Housing', amount: 12000, color: '#3B82F6' },
    { name: 'Food', amount: 8000, color: '#10B981' },
    { name: 'Transport', amount: 5000, color: '#F59E0B' },
    { name: 'Shopping', amount: 4000, color: '#EF4444' },
    { name: 'Entertainment', amount: 3000, color: '#8B5CF6' },
    { name: 'Healthcare', amount: 3000, color: '#06B6D4' },
  ];

  const monthlyTrend = [
    { month: 'Jan', income: 48000, expenses: 34000, savings: 14000 },
    { month: 'Feb', income: 49000, expenses: 35000, savings: 14000 },
    { month: 'Mar', income: 50000, expenses: 34500, savings: 15500 },
    { month: 'Apr', income: 51000, expenses: 35500, savings: 15500 },
    { month: 'May', income: 50000, expenses: 35000, savings: 15000 },
    { month: 'Jun', income: 52000, expenses: 36000, savings: 16000 },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {userData?.name || 'User'}! Here's your financial overview</p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                <Download className="h-4 w-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-100 text-sm">Monthly Income</p>
                <p className="text-2xl font-bold mt-1">₹{financialData.monthly_income.toLocaleString('en-IN')}</p>
                <p className="text-green-100 text-sm mt-2">↑ 8% from last month</p>
              </div>
              <DollarSign className="h-10 w-10 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-red-100 text-sm">Monthly Expenses</p>
                <p className="text-2xl font-bold mt-1">₹{financialData.monthly_expenses.toLocaleString('en-IN')}</p>
                <p className="text-red-100 text-sm mt-2">↓ 5% from last month</p>
              </div>
              <CreditCard className="h-10 w-10 text-red-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm">Savings Rate</p>
                <p className="text-2xl font-bold mt-1">{financialData.savings_rate}%</p>
                <p className="text-blue-100 text-sm mt-2">Monthly Savings: ₹{(financialData.monthly_income - financialData.monthly_expenses).toLocaleString('en-IN')}</p>
              </div>
              <PiggyBank className="h-10 w-10 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-100 text-sm">Financial Health</p>
                <p className="text-2xl font-bold mt-1">{aiInsights?.financial_health?.score || 72}/100</p>
                <p className="text-purple-100 text-sm mt-2">Good - On track</p>
              </div>
              <Award className="h-10 w-10 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Expense Breakdown Pie Chart */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2 text-blue-600" />
              Expense Breakdown
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Income vs Expenses Trend */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
              Income vs Expenses Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                <Legend />
                <Area type="monotone" dataKey="income" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                <Area type="monotone" dataKey="expenses" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Multi-Agent Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Agent 1: Financial Health */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 border border-blue-100">
            <div className="flex items-center mb-4">
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Agent 1: Financial Health</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Health Score</span>
                <span className="font-bold text-blue-600">{aiInsights?.financial_health?.score || 72}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Savings</span>
                <span className="font-bold text-green-600">₹{(aiInsights?.financial_health?.monthly_savings || 15000).toLocaleString('en-IN')}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-sm font-medium mb-2">Recommendations:</p>
                <ul className="text-sm space-y-1">
                  {aiInsights?.financial_health?.recommendations?.slice(0, 3).map((rec, i) => (
                    <li key={i} className="flex items-start">
                      <ChevronRight className="h-4 w-4 text-blue-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Agent 2: Goal Analysis */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md p-6 border border-green-100">
            <div className="flex items-center mb-4">
              <div className="bg-green-600 p-2 rounded-lg mr-3">
                <Target className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Agent 2: Goal Analysis</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Active Goals</span>
                <span className="font-bold text-green-600">{goals.length}</span>
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium mb-2">Progress Summary:</p>
                {goals.slice(0, 2).map((goal, i) => (
                  <div key={i} className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700">{goal.name}</span>
                      <span className="text-gray-600">{calculateProgress(goal.current_amount, goal.target_amount).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-600 rounded-full h-1.5 transition-all duration-500"
                        style={{ width: `${calculateProgress(goal.current_amount, goal.target_amount)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Agent 3: Investment Plan */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-md p-6 border border-purple-100">
            <div className="flex items-center mb-4">
              <div className="bg-purple-600 p-2 rounded-lg mr-3">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Agent 3: Investment Plan</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Expected Return</span>
                <span className="font-bold text-purple-600">{aiInsights?.investment_plan?.expected_return || '12%'}</span>
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium mb-2">Asset Allocation:</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Equity</span>
                    <span className="font-medium text-purple-600">{aiInsights?.investment_plan?.allocation?.equity || 50}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Debt</span>
                    <span className="font-medium text-purple-600">{aiInsights?.investment_plan?.allocation?.debt || 30}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Gold</span>
                    <span className="font-medium text-purple-600">{aiInsights?.investment_plan?.allocation?.gold || 10}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Cash</span>
                    <span className="font-medium text-purple-600">{aiInsights?.investment_plan?.allocation?.cash || 10}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Recent Transactions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Description</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">{tx.date.toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tx.category === 'Food' ? 'bg-orange-100 text-orange-700' :
                        tx.category === 'Transport' ? 'bg-blue-100 text-blue-700' :
                        tx.category === 'Shopping' ? 'bg-pink-100 text-pink-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{tx.type === 'expense' ? 'Payment' : 'Income'}</td>
                    <td className={`py-3 px-4 text-sm font-medium text-right ${tx.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                      {tx.type === 'expense' ? '-' : '+'} ₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Manager Component */}
        <ExpenseManager 
          userId={localStorage.getItem('userId')} 
          onExpenseUpdate={handleRefresh}
        />
      </div>
    </div>
  );
}

export default Dashboard;