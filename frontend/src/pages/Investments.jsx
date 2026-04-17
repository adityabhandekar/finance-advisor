import React, { useState } from 'react';
import { TrendingUp, Shield, AlertCircle, ChevronRight } from 'lucide-react';

function Investments() {
  const [riskProfile, setRiskProfile] = useState('Moderate');
  
  const recommendations = {
    Conservative: {
      stocks: 30,
      bonds: 60,
      cash: 10,
      expectedReturn: '4-6%',
      funds: ['BND - Bond ETF', 'SHY - Short-term Treasury', 'VYM - High Dividend']
    },
    Moderate: {
      stocks: 60,
      bonds: 30,
      cash: 10,
      expectedReturn: '7-9%',
      funds: ['VTI - Total Stock Market', 'BND - Total Bond Market', 'VXUS - International']
    },
    Aggressive: {
      stocks: 85,
      bonds: 10,
      cash: 5,
      expectedReturn: '10-12%',
      funds: ['VOO - S&P 500', 'QQQ - Nasdaq', 'AVUV - Small Cap Value']
    }
  };

  const currentRecommendation = recommendations[riskProfile];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Investment Planner</h1>
        <p className="text-gray-600 mt-2">AI-powered personalized investment recommendations</p>
      </div>

      {/* Risk Profile Selector */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Risk Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Conservative', 'Moderate', 'Aggressive'].map((profile) => (
            <button
              key={profile}
              onClick={() => setRiskProfile(profile)}
              className={`p-4 rounded-lg border-2 transition ${
                riskProfile === profile
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{profile}</span>
                {riskProfile === profile && <ChevronRight className="h-5 w-5 text-blue-600" />}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {profile === 'Conservative' && 'Lower risk, stable returns'}
                {profile === 'Moderate' && 'Balanced risk and return'}
                {profile === 'Aggressive' && 'Higher risk, higher potential returns'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Asset Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recommended Asset Allocation</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span>Stocks</span>
                <span className="font-semibold">{currentRecommendation.stocks}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-blue-600 rounded-full h-3" style={{ width: `${currentRecommendation.stocks}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Bonds</span>
                <span className="font-semibold">{currentRecommendation.bonds}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-green-600 rounded-full h-3" style={{ width: `${currentRecommendation.bonds}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Cash</span>
                <span className="font-semibold">{currentRecommendation.cash}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-yellow-600 rounded-full h-3" style={{ width: `${currentRecommendation.cash}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Expected Returns</h2>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">{currentRecommendation.expectedReturn}</div>
            <p className="text-gray-600">Annual expected return based on your risk profile</p>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-800">
                Past performance doesn't guarantee future returns. This is a recommendation, not financial advice.
                Consider consulting with a financial advisor.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Funds */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recommended Investment Funds</h2>
        <div className="space-y-3">
          {currentRecommendation.funds.map((fund, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="font-medium">{fund}</span>
              </div>
              <Shield className="h-5 w-5 text-gray-400" />
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            💡 Start with a monthly SIP of $500 to build your portfolio gradually.
            Use dollar-cost averaging to reduce market timing risk.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Investments;