import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

function FinancialHealthCard({ data }) {
  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Financial Health Analysis</h3>
        <p className="text-gray-500">Run analysis to see your financial health</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Financial Health Analysis</h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Budget Efficiency</span>
          <span className="font-semibold text-green-600">{data.budget_efficiency || 'Good'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Debt-to-Income Ratio</span>
          <span className="font-semibold">{data.debt_ratio || '0%'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Emergency Fund Status</span>
          <span className="font-semibold text-yellow-600">{data.emergency_fund_status || 'Adequate'}</span>
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">{data.recommendations || 'No recommendations available'}</p>
        </div>
      </div>
    </div>
  );
}

export default FinancialHealthCard;