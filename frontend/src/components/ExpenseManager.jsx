import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, DollarSign, Calendar, Tag, CreditCard, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

function ExpenseManager({ userId, onExpenseUpdate }) {
  const [expenses, setExpenses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, monthlyTotal: 0 });
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: 'Food',
    description: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash'
  });

  const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Rent', 'Investment', 'Other'];
  const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking'];

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/expenses/${userId}`);
      if (response.data.status === 'success') {
        setExpenses(response.data.expenses || []);
        const total = (response.data.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
        setSummary({ total, monthlyTotal: total });
      }
      if (onExpenseUpdate) onExpenseUpdate();
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, onExpenseUpdate]);

  useEffect(() => {
    if (userId) fetchExpenses();
  }, [userId, fetchExpenses]);

  const handleAddExpense = async () => {
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const response = await api.post('/expenses', {
        user_id: userId,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description,
        date: newExpense.date,
        payment_method: newExpense.payment_method
      });

      if (response.data.status === 'success') {
        toast.success('Expense added successfully!');
        setShowAddForm(false);
        setNewExpense({
          amount: '',
          category: 'Food',
          description: '',
          date: new Date().toISOString().split('T')[0],
          payment_method: 'Cash'
        });
        fetchExpenses();
      }
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.delete(`/expenses/${expenseId}`);
        toast.success('Expense deleted successfully!');
        fetchExpenses();
      } catch (error) {
        toast.error('Failed to delete expense');
      }
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Food: 'bg-orange-100 text-orange-700',
      Transport: 'bg-blue-100 text-blue-700',
      Shopping: 'bg-pink-100 text-pink-700',
      Bills: 'bg-red-100 text-red-700',
      Entertainment: 'bg-purple-100 text-purple-700',
      Healthcare: 'bg-green-100 text-green-700',
      Education: 'bg-indigo-100 text-indigo-700',
      Rent: 'bg-yellow-100 text-yellow-700',
      Investment: 'bg-teal-100 text-teal-700',
      Other: 'bg-gray-100 text-gray-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
            Expense Manager
          </h2>
          <p className="text-sm text-gray-500">Track and manage your daily expenses</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={fetchExpenses} className="p-2 text-gray-600 hover:text-blue-600 transition rounded-lg hover:bg-gray-100">
            <RefreshCw className="h-5 w-5" />
          </button>
          <button onClick={() => setShowAddForm(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
          <p className="text-sm opacity-90">Total Expenses</p>
          <p className="text-2xl font-bold">₹{summary.total.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <p className="text-sm opacity-90">Total Transactions</p>
          <p className="text-2xl font-bold">{expenses.length}</p>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add New Expense</h3>
              <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
                <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="500" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={newExpense.payment_method} onChange={(e) => setNewExpense({ ...newExpense, payment_method: e.target.value })}>
                  {paymentMethods.map(method => <option key={method} value={method}>{method}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., Grocery shopping" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
              <button onClick={handleAddExpense} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Expense</button>
            </div>
          </div>
        </div>
      )}

      {/* Expenses List */}
      {loading ? (
        <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-2 text-gray-500">Loading expenses...</p></div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg"><DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-500">No expenses yet. Click "Add Expense" to get started!</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr><th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th><th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Category</th><th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Description</th><th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Payment</th><th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Amount</th><th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Actions</th></tr></thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-600">{expense.date ? new Date(expense.date).toLocaleDateString('en-IN') : 'N/A'}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>{expense.category}</span></td>
                  <td className="py-3 px-4 text-sm text-gray-600">{expense.description || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{expense.payment_method || 'Cash'}</td>
                  <td className="py-3 px-4 text-sm font-medium text-red-600 text-right">₹{expense.amount.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-center"><button onClick={() => handleDeleteExpense(expense._id)} className="text-red-600 hover:text-red-700 transition p-1 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ExpenseManager;