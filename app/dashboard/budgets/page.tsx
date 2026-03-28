'use client';

import { useState } from 'react';
import { useBudgets, useCreateBudget, useDeleteBudget } from '@/lib/hooks/useBudgets';

export default function BudgetsPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [newBudget, setNewBudget] = useState({
    code: '',
    description: '',
    amount: '',
    category: '',
    projectId: '',
  });

  const { data, isLoading, error } = useBudgets();
  const createBudget = useCreateBudget();
  const deleteBudget = useDeleteBudget();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBudget.mutateAsync({
        ...newBudget,
        amount: parseFloat(newBudget.amount),
      });
      setIsAdding(false);
      setNewBudget({ code: '', description: '', amount: '', category: '', projectId: '' });
    } catch (err) {
      console.error('Failed to create budget:', err);
    }
  };

  const totalBudget = data?.totalBudget || 0;
  const allocated = totalBudget;
  const spent = data?.costItems.reduce((sum, item) => sum + item.amount * 0.7, 0) || 0;
  const usedPercent = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-slate-500">Loading budgets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-red-500">Failed to load budgets</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Budgets</h1>
          <p className="text-slate-500">Budget and cost codes</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Budget
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-slate-900">
            ${totalBudget.toLocaleString()}
          </div>
          <div className="text-slate-500 text-sm">Total Budget</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">
            ${allocated.toLocaleString()}
          </div>
          <div className="text-slate-500 text-sm">Allocated</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">
            ${spent.toLocaleString()}
          </div>
          <div className="text-slate-500 text-sm">Spent (Est.)</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-orange-600">{usedPercent}%</div>
          <div className="text-slate-500 text-sm">Used</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cost Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data?.costItems.map((budget) => (
              <tr key={budget.id} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-6 py-4 font-medium text-blue-600">{budget.code}</td>
                <td className="px-6 py-4 text-slate-900">{budget.description}</td>
                <td className="px-6 py-4 text-slate-600">{budget.category}</td>
                <td className="px-6 py-4 text-slate-900">${budget.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => deleteBudget.mutate(budget.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {(!data?.costItems || data.costItems.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No budget items yet. Click &quot;Add Budget&quot; to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Budget Item</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="budget-code" className="block text-sm font-medium text-slate-700 mb-1">Cost Code</label>
                <input
                  id="budget-code"
                  type="text"
                  required
                  value={newBudget.code}
                  onChange={(e) => setNewBudget({ ...newBudget, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="01-100"
                />
              </div>
              <div>
                <label htmlFor="budget-desc" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input
                  id="budget-desc"
                  type="text"
                  required
                  value={newBudget.description}
                  onChange={(e) => setNewBudget({ ...newBudget, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="General Conditions"
                />
              </div>
              <div>
                <label htmlFor="budget-amount" className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                <input
                  id="budget-amount"
                  type="number"
                  required
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="50000"
                />
              </div>
              <div>
                <label htmlFor="budget-category" className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <input
                  id="budget-category"
                  type="text"
                  required
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Construction"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBudget.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createBudget.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
