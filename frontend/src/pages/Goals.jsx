import React, { useState, useEffect } from 'react';
import { Target, Plus, TrendingUp, Calendar, DollarSign, Trash2, Edit2, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

function Goals() {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({
    name: '',
    target_amount: '',
    current_amount: 0,
    deadline: '',
    priority: 'Medium'
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await api.get(`/goals/${userId}`);
      setGoals(response.data.goals || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      // Sample data
      setGoals([
        { _id: '1', name: 'Emergency Fund', target_amount: 300000, current_amount: 100000, priority: 'High', deadline: '2025-12-31' },
        { _id: '2', name: 'Retirement Corpus', target_amount: 5000000, current_amount: 500000, priority: 'High', deadline: '2040-12-31' }
      ]);
    } finally {
      setLoading(false);
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
    } catch (error) {
      toast.error('Failed to add goal');
    }
  };

  const calculateProgress = (current, target) => {
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
          <p className="text-gray-600 mt-2">Track and achieve your financial milestones</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-5 w-5" />
          <span>Add New Goal</span>
        </button>
      </div>

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
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full h-3 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm text-green-800 font-medium">Remaining Amount</p>
                  <p className="text-xl font-bold text-green-700">₹{remaining.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium">Monthly Investment Needed</p>
                  <p className="text-xl font-bold text-blue-700">₹{Math.ceil(monthlyNeeded).toLocaleString('en-IN')}/month</p>
                </div>
              </div>

              {progress >= 100 && (
                <div className="mt-4 bg-green-100 rounded-lg p-3 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-green-800 font-medium">Congratulations! You've achieved this goal! 🎉</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Goals;