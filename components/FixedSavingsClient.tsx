'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, Calendar, DollarSign, Percent, PiggyBank, Plus, Clock } from 'lucide-react';
import FixedSavingsForm from '@/components/FixedSavingsForm';

interface FixedSaving {
  id: string;
  amount: string;
  interestRate: string;
  term: number;
  maturityDate: Date;
  status: string;
  createdAt: Date;
  maturedValue: string;
  accruedInterest: string;
  currentValue: string;
  progress: string;
}

export default function FixedSavingsClient() {
  const [savings, setSavings] = useState<FixedSaving[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchSavings();
  }, []);

  const fetchSavings = async () => {
    try {
      const response = await fetch('/api/fixed-savings');
      if (response.ok) {
        const data = await response.json();
        setSavings(data.savings);
      }
    } catch (error) {
      console.error('Error fetching savings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavingCreated = () => {
    setShowForm(false);
    fetchSavings();
  };

  // Calculate total stats
  const totalPrincipal = savings.reduce((sum, s) => sum + parseFloat(s.amount), 0);
  const totalCurrentValue = savings.reduce((sum, s) => sum + parseFloat(s.currentValue), 0);
  const totalAccruedInterest = savings.reduce((sum, s) => sum + parseFloat(s.accruedInterest), 0);
  const activeSavingsCount = savings.filter(s => s.status === 'ACTIVE').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Fixed Savings</h1>
          <p className="text-gray-600 mt-1">Monitor your savings growth and create new fixed deposits</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">New Saving</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Invested</p>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPrincipal)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Current Value</p>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCurrentValue)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Interest Earned</p>
            <Percent className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAccruedInterest)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Active Savings</p>
            <PiggyBank className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeSavingsCount}</p>
        </div>
      </div>

      {/* Interest Rates Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
          <Percent className="w-5 h-5 mr-2" />
          Current Interest Rates
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">6 Months</p>
            <p className="text-xl font-bold text-blue-900">3.5% p.a.</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">12 Months</p>
            <p className="text-xl font-bold text-blue-900">4.5% p.a.</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">24 Months</p>
            <p className="text-xl font-bold text-blue-900">5.5% p.a.</p>
          </div>
        </div>
      </div>

      {/* Savings List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading your savings...</p>
        </div>
      ) : savings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
          <PiggyBank className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Fixed Savings Yet</h3>
          <p className="text-gray-600 mb-6">Start growing your wealth with guaranteed returns</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center space-x-2 bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Your First Saving</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Your Savings Portfolio</h2>
          <div className="grid gap-4">
            {savings.map((saving) => {
              const daysUntilMaturity = Math.ceil(
                (new Date(saving.maturityDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              const isMatured = daysUntilMaturity <= 0;

              return (
                <div
                  key={saving.id}
                  className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {formatCurrency(parseFloat(saving.amount))}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isMatured
                              ? 'bg-green-100 text-green-800'
                              : saving.status === 'ACTIVE'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {isMatured ? 'Matured' : saving.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Interest Rate</p>
                            <p className="font-semibold text-gray-900">{saving.interestRate}% p.a.</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Term</p>
                            <p className="font-semibold text-gray-900">{saving.term} months</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Current Value</p>
                            <p className="font-semibold text-green-600">
                              {formatCurrency(parseFloat(saving.currentValue))}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Maturity Value</p>
                            <p className="font-semibold text-blue-600">
                              {formatCurrency(parseFloat(saving.maturedValue))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600 flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {isMatured ? 'Completed' : `${saving.progress}% Complete`}
                        </span>
                        <span className="text-gray-600 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {isMatured
                            ? `Matured ${new Date(saving.maturityDate).toLocaleDateString()}`
                            : `${daysUntilMaturity} days remaining`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isMatured ? 'bg-green-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(parseFloat(saving.progress), 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Interest Info */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Interest Earned So Far</p>
                        <p className="text-xl font-bold text-green-700">
                          {formatCurrency(parseFloat(saving.accruedInterest))}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>

                    {/* Dates */}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-500">
                      <span>Started: {new Date(saving.createdAt).toLocaleDateString()}</span>
                      <span>Matures: {new Date(saving.maturityDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create New Saving Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Create New Fixed Saving</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <FixedSavingsForm onSuccess={handleSavingCreated} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
