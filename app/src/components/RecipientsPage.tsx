'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePayrollProgram, RecipientWithKey, DEPARTMENTS, CATEGORIES } from '../hooks/usePayrollProgram';
import { PublicKey } from '@solana/web3.js';

interface AddRecipientForm {
  walletAddress: string;
  departmentId: number;
  category: number;
}

// Generate anonymous alias based on index
function generateAnonymousAlias(index: number): string {
  return `Recipient-${index + 1}`;
}

// Helper to get label for ID
function getLabel(items: { id: number; label: string }[], id: number): string {
  return items.find(item => item.id === id)?.label || 'Unknown';
}

export default function RecipientsPage() {
  const {
    publicKey,
    isLoading,
    error,
    getEmployer,
    initializeEmployer,
    getRecipients,
    addRecipient,
    updateRecipient,
    deactivateRecipient,
  } = usePayrollProgram();

  const [employer, setEmployer] = useState<any>(null);
  const [recipients, setRecipients] = useState<RecipientWithKey[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [employerName, setEmployerName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddRecipientForm>({
    walletAddress: '',
    departmentId: 0,
    category: 0,
  });
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load employer and recipients
  const loadData = useCallback(async () => {
    if (!publicKey) return;
    
    const emp = await getEmployer();
    setEmployer(emp);
    
    if (emp) {
      const recs = await getRecipients();
      setRecipients(recs);
    }
  }, [publicKey, getEmployer, getRecipients]);

  // Format timestamp to date string
  const formatDate = (timestamp: any) => {
    if (!timestamp || timestamp.toNumber() === 0) return 'Never';
    return new Date(timestamp.toNumber() * 1000).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Clear status message after 5 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Initialize employer account
  const handleInitializeEmployer = async () => {
    if (!employerName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a name (can be anonymous)' });
      return;
    }
    
    setIsInitializing(true);
    try {
      await initializeEmployer(employerName);
      setStatusMessage({ type: 'success', text: 'Account created successfully!' });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Failed to create account: ${err.message}` });
    } finally {
      setIsInitializing(false);
    }
  };

  // Add recipient - name is auto-generated as anonymous alias
  const handleAddRecipient = async () => {
    if (!addForm.walletAddress) {
      setStatusMessage({ type: 'error', text: 'Wallet address is required' });
      return;
    }
    
    try {
      // Validate wallet address
      new PublicKey(addForm.walletAddress);
    } catch {
      setStatusMessage({ type: 'error', text: 'Invalid wallet address' });
      return;
    }
    
    try {
      // Auto-generate anonymous alias
      const nextIndex = recipients.length;
      const anonymousAlias = generateAnonymousAlias(nextIndex);
      
      await addRecipient(
        addForm.walletAddress, 
        anonymousAlias, 
        'Private', 
        addForm.departmentId, 
        addForm.category
      );
      setStatusMessage({ type: 'success', text: `${anonymousAlias} added successfully!` });
      setAddForm({ walletAddress: '', departmentId: 0, category: 0 });
      setShowAddForm(false);
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Failed to add recipient: ${err.message}` });
    }
  };

  // Deactivate recipient
  const handleDeactivateRecipient = async (walletAddress: string, alias: string) => {
    if (!confirm(`Are you sure you want to deactivate "${alias}"?`)) return;
    
    try {
      await deactivateRecipient(walletAddress);
      setStatusMessage({ type: 'success', text: `${alias} deactivated` });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Failed to deactivate: ${err.message}` });
    }
  };

  // Not connected
  if (!publicKey) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Recipients Management</h2>
        <p className="text-gray-400">Please connect your Solana wallet to manage recipients.</p>
        <p className="text-sm text-gray-500 mt-2">
          Note: Recipient data is stored on Solana Devnet (free, no real SOL required)
        </p>
      </div>
    );
  }

  // No employer account yet
  if (!employer) {
    return (
      <div className="bg-gray-800 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-4">Set Up Anonymous Payroll</h2>
        <p className="text-gray-400 mb-6">
          Create your account to start managing recipients. This is stored on Solana Devnet.
        </p>
        
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Account Name (can be anonymous)
          </label>
          <input
            type="text"
            value={employerName}
            onChange={(e) => setEmployerName(e.target.value)}
            placeholder="e.g., Anon Payer, DAO Treasury, etc."
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          
          <button
            onClick={handleInitializeEmployer}
            disabled={isInitializing || isLoading}
            className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isInitializing ? 'Creating...' : 'Create Account'}
          </button>
        </div>
        
        {statusMessage && (
          <div className={`mt-4 p-3 rounded-lg ${
            statusMessage.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
          }`}>
            {statusMessage.text}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{employer.name}</h2>
          <p className="text-gray-400 text-sm">
            {recipients.filter(r => r.account.isActive).length} active recipients • 
            {employer.paymentCount} payments made
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
        >
          <span className="text-xl">+</span> Add Recipient
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="mb-4 p-4 bg-purple-900/20 border border-purple-800/50 rounded-xl">
        <div className="flex gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="text-purple-300 font-semibold mb-1">Privacy Focused Configuration</p>
            <p className="text-purple-400/80 text-sm leading-relaxed">
              Recipients are stored using auto-generated aliases (Recipient-1, Recipient-2, etc.). 
              Department and Category are stored as numeric IDs and mapped locally, keeping internal structure private.
            </p>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={`mb-4 p-3 rounded-lg ${
          statusMessage.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* Add Recipient Form */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-gray-700/50 rounded-xl border border-gray-600 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="p-2 bg-purple-900/50 rounded-lg text-purple-400">👤</span>
            Add New Anonymous Recipient
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Wallet Address (Target on Mainnet)</label>
              <input
                type="text"
                value={addForm.walletAddress}
                onChange={(e) => setAddForm({ ...addForm, walletAddress: e.target.value })}
                placeholder="Paste Solana address"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Department</label>
                <select
                  value={addForm.departmentId}
                  onChange={(e) => setAddForm({ ...addForm, departmentId: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                <select
                  value={addForm.category}
                  onChange={(e) => setAddForm({ ...addForm, category: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Will be displayed as: <strong className="text-purple-400 font-bold">{generateAnonymousAlias(recipients.length)}</strong>
              </p>
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <button
              onClick={handleAddRecipient}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? 'Processing...' : 'Add Recipient'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Recipients List */}
      <div className="space-y-4">
        {recipients.length === 0 ? (
          <div className="text-center py-16 bg-gray-900/30 rounded-xl border border-dashed border-gray-700">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-xl text-gray-300 font-semibold">No recipients yet</p>
            <p className="text-gray-500 mt-1">Start by adding your first payroll recipient securely.</p>
          </div>
        ) : (
          recipients.map((rec, index) => (
            <div
              key={rec.publicKey.toString()}
              className={`p-5 rounded-xl border transition-all duration-200 ${
                rec.account.isActive 
                  ? 'bg-gray-900/40 border-gray-700 hover:border-gray-600 group' 
                  : 'bg-gray-800/50 border-gray-800 opacity-60'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold text-lg">{rec.account.name}</span>
                      <span className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                        {getLabel(DEPARTMENTS, rec.account.departmentId)}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-900/20 border border-blue-500/10 rounded text-[10px] text-blue-400 uppercase tracking-wider font-bold">
                        {getLabel(CATEGORIES, rec.account.category)}
                      </span>
                      {!rec.account.isActive && (
                        <span className="px-2 py-0.5 bg-red-900/20 text-red-400 border border-red-900/50 rounded text-[10px] font-bold">
                          DEACTIVATED
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-gray-500 text-xs font-mono truncate max-w-[200px] md:max-w-none">
                        {rec.account.wallet.toString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 lg:gap-12">
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Last Paid</div>
                    <div className={`text-sm font-bold ${rec.account.lastPaymentTimestamp.toNumber() > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                      {formatDate(rec.account.lastPaymentTimestamp)}
                    </div>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Total Paid</div>
                    <div className="text-white font-bold">{rec.account.totalPayments}</div>
                  </div>
                  {rec.account.isActive && (
                    <button
                      onClick={() => handleDeactivateRecipient(rec.account.wallet.toString(), rec.account.name)}
                      className="px-4 py-2 text-sm bg-red-900/10 text-red-500 border border-red-900/30 rounded-lg hover:bg-red-900/30 transition-all opacity-0 group-hover:opacity-100 font-bold"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Devnet Notice */}
      <div className="mt-8 p-4 bg-blue-900/10 border border-blue-900/30 rounded-xl flex gap-3 items-center">
        <span className="text-lg">ℹ️</span>
        <p className="text-blue-400/80 text-sm">
          Management data is stored on <strong className="text-blue-300">Solana Devnet</strong>. 
          Private payroll execution will use <strong className="text-blue-300 font-mono tracking-wider ml-1">{process.env.NEXT_PUBLIC_SILENTSWAP_ENV?.toUpperCase() || 'STAGING'}</strong> environment via SilentSwap.
        </p>
      </div>
    </div>
  );
}

