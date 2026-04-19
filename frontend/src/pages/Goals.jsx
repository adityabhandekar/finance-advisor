import React, { useState, useEffect } from 'react';
import { Target, Plus, TrendingUp, Calendar, DollarSign, Trash2, Brain, AlertCircle, CheckCircle, Clock, Lightbulb, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

function Goals() {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [newGoal, setNewGoal] = useState({
    name: '',
    target_amount: '',
    current_amount: 0,
    deadline: '',
    priority: 'Medium'
  });

  useEffect(() => {
    fetchGoals();
    fetchUserProfile();
  }, []);

  const fetchGoals = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await api.get(`/goals/${userId}`);
      setGoals(response.data.goals || []);
      
      if (response.data.goals && response.data.goals.length > 0) {
        await analyzeGoals();
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await api.get(`/users/${userId}/profile`);
      setUserProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const analyzeGoals = async () => {
    setAnalyzing(true);
    try {
      const userId = localStorage.getItem('userId');
      const response = await api.post('/goals/analyze', { user_id: userId });
      if (response.data.status === 'success') {
        setAiAnalysis(response.data.data);
        toast.success('CA analysis completed! Check your personalized advice.');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to get analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.name || !newGoal.target_amount) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const userId = localStorage.getItem('userId');
      const response = await api.post('/goals', {
        user_id: userId,
        ...newGoal,
        target_amount: parseFloat(newGoal.target_amount),
        current_amount: parseFloat(newGoal.current_amount || 0)
      });
      
      setGoals([...goals, { ...newGoal, _id: response.data.goal_id }]);
      setShowForm(false);
      setNewGoal({ name: '', target_amount: '', current_amount: 0, deadline: '', priority: 'Medium' });
      toast.success('Goal added successfully!');
      await analyzeGoals();
    } catch (error) {
      toast.error('Failed to add goal');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await api.delete(`/goals/${goalId}`);
        setGoals(goals.filter(g => g._id !== goalId));
        toast.success('Goal deleted successfully');
        if (goals.length > 1) {
          await analyzeGoals();
        } else {
          setAiAnalysis(null);
        }
      } catch (error) {
        toast.error('Failed to delete goal');
      }
    }
  };

  const calculateProgress = (current, target) => {
    if (!current || !target) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Goals</h1>
          <p className="text-gray-600 mt-2">Track, analyze, and achieve your financial milestones with CA advice</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-5 w-5" />
          <span>Add New Goal</span>
        </button>
      </div>

      {/* CA Analysis Section */}
      {aiAnalysis && (
        <div className="space-y-6 mb-8">
          {/* Expense Advice Cards */}
          {aiAnalysis.expense_advice && aiAnalysis.expense_advice.length > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl shadow-lg p-6 border border-orange-200">
              <div className="flex items-center mb-4">
                <TrendingDown className="h-7 w-7 text-orange-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">💰 Expense Optimization Opportunities</h2>
              </div>
              <p className="text-gray-700 mb-4">Our CA analysis found these areas where you can save money:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiAnalysis.expense_advice.map((advice, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-orange-500">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{advice.category}</h3>
                      <span className="text-sm font-bold text-green-600">Save ₹{Math.round(advice.potential_savings * 0.3)}/month</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{advice.advice}</p>
                    <div className="bg-orange-50 p-2 rounded">
                      <p className="text-xs text-orange-800">💡 {advice.action_items[0]}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-green-100 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  🎯 Total Potential Monthly Savings: ₹{Math.round(aiAnalysis.summary.potential_savings)}/month
                </p>
              </div>
            </div>
          )}

          {/* Financial Health Summary */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Wallet className="h-7 w-7 mr-2" />
                <h2 className="text-xl font-semibold">📊 Your Financial Health Summary</h2>
              </div>
              {analyzing && (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  <span className="text-sm">Analyzing...</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-sm opacity-90">Monthly Income</p>
                <p className="text-2xl font-bold">₹{aiAnalysis.metrics?.monthly_income?.toLocaleString('en-IN') || 0}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-sm opacity-90">Monthly Expenses</p>
                <p className="text-2xl font-bold">₹{aiAnalysis.metrics?.monthly_expenses?.toLocaleString('en-IN') || 0}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-sm opacity-90">Monthly Savings</p>
                <p className="text-2xl font-bold">₹{aiAnalysis.metrics?.monthly_savings?.toLocaleString('en-IN') || 0}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-sm opacity-90">Savings Rate</p>
                <p className="text-2xl font-bold">{aiAnalysis.metrics?.savings_rate || 0}%</p>
              </div>
            </div>
          </div>

          {/* Goal Feasibility */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <Target className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">🎯 Goal Feasibility Analysis</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm text-green-800">Overall Progress</p>
                <p className="text-2xl font-bold text-green-700">{aiAnalysis.summary.overall_progress.toFixed(1)}%</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-800">Monthly Savings Needed</p>
                <p className="text-2xl font-bold text-blue-700">₹{Math.round(aiAnalysis.summary.monthly_savings_needed).toLocaleString('en-IN')}</p>
              </div>
              <div className={`${aiAnalysis.summary.feasibility === 'Achievable' ? 'bg-green-50' : 'bg-yellow-50'} rounded-lg p-3`}>
                <p className="text-sm text-gray-800">Feasibility</p>
                <p className={`text-2xl font-bold ${aiAnalysis.summary.feasibility === 'Achievable' ? 'text-green-700' : 'text-yellow-700'}`}>
                  {aiAnalysis.summary.feasibility}
                </p>
              </div>
            </div>

            {/* Goals List with Feasibility */}
            {aiAnalysis.goals_analysis.map((goal, idx) => (
              <div key={idx} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${goal.priority === 'High' ? 'bg-red-100 text-red-700' : goal.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {goal.priority} Priority
                    </span>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${goal.is_feasible ? 'text-green-600' : 'text-red-600'}`}>
                      {goal.is_feasible ? '✅ On Track' : '⚠️ Needs Attention'}
                    </p>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{goal.progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 rounded-full h-2" style={{ width: `${Math.min(goal.progress, 100)}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-xs text-green-800">Remaining</p>
                    <p className="text-sm font-bold">₹{goal.remaining.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-xs text-blue-800">Monthly Needed</p>
                    <p className="text-sm font-bold">₹{Math.round(goal.monthly_needed).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                {!goal.is_feasible && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Shortfall: ₹{Math.round(goal.shortfall)}/month. Review expense suggestions above.
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CA Detailed Analysis */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border border-purple-200">
            <div className="flex items-center mb-4">
              <Brain className="h-7 w-7 text-purple-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">📋 CA Detailed Analysis Report</h2>
            </div>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm leading-relaxed bg-white p-4 rounded-lg">
                {aiAnalysis.analysis}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Financial Goal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Goal Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Buy a House, Retirement, Emergency Fund"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount (₹)</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="500000"
                value={newGoal.target_amount}
                onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Amount (₹)</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                value={newGoal.current_amount}
                onChange={(e) => setNewGoal({ ...newGoal, current_amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={newGoal.priority}
                onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
              Cancel
            </button>
            <button onClick={handleAddGoal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Create Goal
            </button>
          </div>
        </div>
      )}

      {/* Manual Goals List (Fallback) */}
      {goals.length > 0 && !aiAnalysis && (
        <div className="grid grid-cols-1 gap-6">
          {goals.map((goal) => {
            const progress = calculateProgress(goal.current_amount, goal.target_amount);
            const remaining = goal.target_amount - goal.current_amount;
            const monthsLeft = goal.deadline ? Math.max(1, (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24 * 30)) : 12;
            const monthlyNeeded = remaining / monthsLeft;
            
            return (
              <div key={goal._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Target className="h-6 w-6 text-blue-600" />
                      <h3 className="text-xl font-semibold text-gray-900">{goal.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                        {goal.priority} Priority
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {goal.deadline && (
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Target: {new Date(goal.deadline).toLocaleDateString('en-IN')}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {monthsLeft.toFixed(0)} months left
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">₹{goal.current_amount.toLocaleString('en-IN')}</p>
                    <p className="text-sm text-gray-500">of ₹{goal.target_amount.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full h-3 transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-sm text-green-800 font-medium">Remaining Amount</p>
                    <p className="text-xl font-bold text-green-700">₹{remaining.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-blue-800 font-medium">Monthly Investment Needed</p>
                    <p className="text-xl font-bold text-blue-700">₹{Math.ceil(monthlyNeeded).toLocaleString('en-IN')}/month</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-sm text-purple-800 font-medium">AI Suggestion</p>
                    <p className="text-sm font-medium text-purple-700">
                      {userProfile && (userProfile.monthlyIncome - userProfile.monthlyExpenses) >= monthlyNeeded 
                        ? "On track! Keep saving consistently." 
                        : `Click "Analyze Goals" for personalized CA advice`}
                    </p>
                  </div>
                </div>

                {progress >= 100 && (
                  <div className="mt-4 bg-green-100 rounded-lg p-3 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <p className="text-green-800 font-medium">Congratulations! You've achieved this goal! 🎉</p>
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <button onClick={() => handleDeleteGoal(goal._id)} className="text-red-600 hover:text-red-700 text-sm flex items-center">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Goal
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Analyze Button if no analysis */}
      {goals.length > 0 && !aiAnalysis && !analyzing && (
        <div className="text-center mt-6">
          <button
            onClick={analyzeGoals}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center space-x-2 mx-auto"
          >
            <Brain className="h-5 w-5" />
            <span>Get CA Analysis & Advice</span>
          </button>
        </div>
      )}

      {/* No Goals Message */}
      {goals.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Goals Yet</h3>
          <p className="text-gray-600 mb-4">Start by adding your first financial goal!</p>
          <button onClick={() => setShowForm(true)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add Your First Goal
          </button>
        </div>
      )}
    </div>
  );
}

export default Goals;