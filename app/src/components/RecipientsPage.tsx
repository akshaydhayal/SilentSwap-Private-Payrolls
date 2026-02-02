'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePayrollProgram, RecipientWithKey } from '../hooks/usePayrollProgram';
import { PublicKey } from '@solana/web3.js';

interface AddRecipientForm {
  walletAddress: string;
}

// Generate anonymous alias based on index
function generateAnonymousAlias(index: number): string {
  return `Recipient-${index + 1}`;
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
      
      await addRecipient(addForm.walletAddress, anonymousAlias, 'Private');
      setStatusMessage({ type: 'success', text: `${anonymousAlias} added successfully!` });
      setAddForm({ walletAddress: '' });
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
      <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
        <p className="text-yellow-400 text-sm">
          🔒 <strong>Privacy First:</strong> Recipients are stored as anonymous aliases (Recipient-1, Recipient-2, etc.) 
          to protect identity. Only wallet addresses are stored on-chain.
        </p>
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
        <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Recipient</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Wallet Address *</label>
              <input
                type="text"
                value={addForm.walletAddress}
                onChange={(e) => setAddForm({ ...addForm, walletAddress: e.target.value })}
                placeholder="Solana wallet address"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <p className="text-sm text-gray-500">
              This recipient will be assigned an anonymous alias: <strong className="text-purple-400">Recipient-{recipients.length + 1}</strong>
            </p>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleAddRecipient}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Adding...' : 'Add Recipient'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-500 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Recipients List */}
      <div className="space-y-3">
        {recipients.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">No recipients yet</p>
            <p className="text-sm">Add your first recipient to start managing payroll</p>
          </div>
        ) : (
          recipients.map((rec, index) => (
            <div
              key={rec.publicKey.toString()}
              className={`p-4 rounded-lg border ${
                rec.account.isActive 
                  ? 'bg-gray-700/50 border-gray-600' 
                  : 'bg-gray-800/50 border-gray-700 opacity-60'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{rec.account.name}</span>
                      {!rec.account.isActive && (
                        <span className="text-red-400 text-xs px-2 py-0.5 bg-red-900/30 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="text-gray-500 text-sm font-mono">
                      {rec.account.wallet.toString().slice(0, 8)}...{rec.account.wallet.toString().slice(-8)}
                    </div>
                  </div>
                </div>
                
                {rec.account.isActive && (
                  <button
                    onClick={() => handleDeactivateRecipient(rec.account.wallet.toString(), rec.account.name)}
                    className="px-3 py-1.5 text-sm bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Devnet Notice */}
      <div className="mt-6 p-3 bg-blue-900/20 border border-blue-800/50 rounded-lg">
        <p className="text-blue-400 text-sm">
          ℹ️ Recipient data is stored on Solana <strong>Devnet</strong> (free, no real SOL required). 
          Private payments will be executed on <strong>Mainnet</strong> using SilentSwap.
        </p>
      </div>
    </div>
  );
}
