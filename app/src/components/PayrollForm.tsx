"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useWalletClient, useAccount } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { useUserAddress } from "@/hooks/useUserAddress";
import { isValidSolanaAddress } from "@/utils/solana";
import { useSilentSwapContext } from "@/app/providers";
import { usePayrollProgram, RecipientWithKey, DEPARTMENTS } from "@/hooks/usePayrollProgram";

// Import useSilentSwap - uses stubs if provider not available
import { useSilentSwap, useBalancesContext, useAssetsContext, useSwap } from "@silentswap/react";
import { isSolanaAsset } from "@silentswap/sdk";

export interface PayoutRecipient {
  id: string;
  walletAddress: string;
  alias: string;
  amount: string;
  selected: boolean;
  departmentId: number;
  category: number;
  lastPaymentTimestamp: number;
}

// Standard Solana Mainnet Genesis Hash (Expected by SilentSwap SDK)
const SOLANA_CHAIN_ID = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

// Native SOL: solana:<chainId>/slip44:501
const CAIP19_NATIVE_SOL = `solana:${SOLANA_CHAIN_ID}/slip44:501`;

export function PayrollForm() {
  const { solAddress, evmAddress, isBothConnected } = useUserAddress();
  const { data: walletClient, isLoading: walletClientLoading } = useWalletClient();
  const { isConnected: isEvmConnected } = useAccount();
  const { connected: isSolanaConnected, publicKey } = useWallet();
  const { isReady: isSilentSwapReady, isLoading: isSilentSwapLoading, error: silentSwapError } = useSilentSwapContext();
  
  // Load recipients from Devnet program
  const { getRecipients, getEmployer, createPaymentRecord } = usePayrollProgram();
  const [devnetRecipients, setDevnetRecipients] = useState<RecipientWithKey[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  
  // Use SilentSwap hook
  const silentSwap = useSilentSwap();
  const {
    executeSwap,
    isSwapping,
    swapLoading,
    currentStep,
    orderId,
    orderComplete,
    orderStatusTexts,
    swapError,
    handleNewSwap,
    serviceFeeUsd,
    bridgeFeeIngressUsd,
    bridgeFeeEgressUsd,
    slippageUsd,
    egressEstimatesLoading,
    wallet: silentSwapWallet,
    walletLoading,
    auth,
    authLoading,
  } = silentSwap || {};

  // Selected recipients and their amounts
  const [payoutRecipients, setPayoutRecipients] = useState<PayoutRecipient[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load recipients from Devnet on mount
  useEffect(() => {
    const loadRecipients = async () => {
      if (!publicKey) return;
      
      setLoadingRecipients(true);
      try {
        const employer = await getEmployer();
        if (employer) {
          const recs = await getRecipients();
          const activeRecs = recs.filter(r => r.account.isActive);
          setDevnetRecipients(activeRecs);
          
          // Initialize payout recipients from devnet data
          setPayoutRecipients(
            activeRecs.map((r, index) => ({
              id: r.publicKey.toString(),
              walletAddress: r.account.wallet.toString(),
              alias: r.account.name,
              amount: '',
              selected: false,
              departmentId: r.account.departmentId,
              category: r.account.category,
              lastPaymentTimestamp: r.account.lastPaymentTimestamp.toNumber(),
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load recipients:', error);
      } finally {
        setLoadingRecipients(false);
      }
    };
    
    loadRecipients();
  }, [publicKey, getEmployer, getRecipients]);

  // Get balances to see available assets
  const { balances, refetchChains, errors: balanceErrors, loading: balancesLoading } = useBalancesContext();
  const { assets: registryAssets } = useAssetsContext();
  const { setTokenIn } = useSwap();

  // Sync global token state for Solana payouts
  useEffect(() => {
    const registryAssetsArray = Object.values(registryAssets);
    if (isSilentSwapReady && registryAssetsArray.length > 0) {
      const asset = registryAssetsArray.find(a => a.caip19 === CAIP19_NATIVE_SOL);
      if (asset) {
        console.log(`[PayrollForm] Syncing global tokenIn to SOL`);
        setTokenIn(asset);
      }
    }
  }, [isSilentSwapReady, registryAssets, setTokenIn]);

  // Force refetch Solana if it's missing
  const hasAttemptedRefetch = useRef(false);
  useEffect(() => {
    if (isSilentSwapReady && Object.keys(balances).length > 0 && !hasAttemptedRefetch.current) {
      const hasSolana = Object.keys(balances).some(id => id.includes('solana') || id.includes(':501'));
      if (!hasSolana) {
        console.log("🚀 Solana missing from balances, attempting ONE-TIME force refetch...");
        hasAttemptedRefetch.current = true;
        refetchChains?.(['solana' as any]).catch(err => {
          console.error("Refetch failed:", err);
        });
      }
    }
  }, [isSilentSwapReady, balances, refetchChains]);

  // Log everything for debugging
  useEffect(() => {
    if (isSilentSwapReady) {
      const allAssetIds = Object.keys(balances);
      const solanaBalanceAssets = allAssetIds.filter(id => id.toLowerCase().includes('solana') || id.includes(':501'));
      
      const registryIds = Object.keys(registryAssets);
      const registrySolanaAssets = registryIds.filter(id => id.toLowerCase().includes('solana') || id.includes(':501'));

      console.group("SilentSwap Deep Diagnostics");
      console.log("Context Status:", {
        isSilentSwapReady,
        balancesLoading,
        solAddress,
        evmAddress,
        solanaRpcUrl: (silentSwap as any).solanaRpcUrl,
      });
      console.log("Asset Summary:", {
        totalBalanceAssets: allAssetIds.length,
        solanaBalanceAssets: solanaBalanceAssets,
        totalRegistryAssets: registryIds.length,
        solanaRegistryAssets: registrySolanaAssets,
        isSolanaAssetTest: isSolanaAsset(registrySolanaAssets[0] || ""),
      });
      console.log("Registry Sample:", registryIds.slice(0, 5));
      console.log("Balance Errors:", balanceErrors);
      
      if (solanaBalanceAssets.length === 0) {
        const solanaError = (balanceErrors as any)?.['solana'];
        if (solanaError) {
          console.error("❌ Solana Balance Error Detected:", solanaError);
        } else if (registrySolanaAssets.length > 0) {
          console.warn("⚠️ Registry HAS Solana, but they are MISSING from balances with NO error reported.");
        }
      }
      console.groupEnd();
    }
  }, [isSilentSwapReady, balances, registryAssets, silentSwap, balanceErrors, balancesLoading, solAddress, evmAddress]);

  // Log wallet and SilentSwap status for debugging
  useEffect(() => {
    console.log("PayrollForm Status:", {
      evmAddress,
      solAddress,
      isBothConnected,
      hasWalletClient: !!walletClient,
      walletClientLoading,
      isSilentSwapReady,
      isSilentSwapLoading,
      silentSwapError,
      hasExecuteSwap: !!executeSwap,
      silentSwapWallet: !!silentSwapWallet,
      walletLoading,
      availableAssets: Object.keys(balances).length
    });
  }, [evmAddress, solAddress, isBothConnected, walletClient, walletClientLoading, 
      isSilentSwapReady, isSilentSwapLoading, silentSwapError, executeSwap, 
      silentSwapWallet, walletLoading, balances]);

  // Toggle recipient selection
  const toggleRecipient = useCallback((id: string) => {
    setPayoutRecipients(prev => 
      prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r)
    );
  }, []);

  // Update recipient amount
  const updateRecipientAmount = useCallback((id: string, amount: string) => {
    setPayoutRecipients(prev => 
      prev.map(r => r.id === id ? { ...r, amount } : r)
    );
  }, []);

  // Get CAIP-19 identifier for SOL (only asset we support now)
  const getAssetCaip19 = useCallback((): string => {
    const availableBalancesIds = Object.keys(balances);
    const registryIds = Object.keys(registryAssets);
    const allKnownIds = [...new Set([...availableBalancesIds, ...registryIds])];
    
    // Find native SOL in available assets
    const found = allKnownIds.find(id => id.includes('slip44:501'));
    if (found) return found;
    // Fallback to standard CAIP-19
    return CAIP19_NATIVE_SOL;
  }, [balances, registryAssets]);

  const handleBulkPayout = async () => {
    // Validate wallet connections
    if (!solAddress || !evmAddress) {
      alert("Both Solana and EVM wallets must be connected for private payouts.");
      return;
    }

    if (!isSilentSwapReady) {
      alert("SilentSwap is still loading. Please wait a moment and try again.");
      return;
    }

    // CRITICAL: Check if SilentSwap wallet is actually generated
    // This is separate from isSilentSwapReady - the wallet requires auth + signature
    if (!silentSwapWallet) {
      console.error("SilentSwap wallet not ready:", {
        hasAuth: !!auth,
        authLoading,
        walletLoading,
        silentSwapWallet,
      });
      
      if (!auth && !authLoading) {
        alert(
          "SilentSwap authentication required. Please sign the authentication message in your wallet. " +
          "If no message appears, try refreshing the page and reconnecting your wallets."
        );
      } else if (walletLoading) {
        alert("SilentSwap wallet is being generated. Please wait a moment and try again.");
      } else {
        alert(
          "SilentSwap wallet not ready. Please ensure you've signed all required messages. " +
          "Try disconnecting and reconnecting your wallets, then sign the authentication message."
        );
      }
      return;
    }

    if (!executeSwap) {
      alert("SilentSwap is not ready. Please ensure both wallets are properly connected and refresh the page.");
      console.error("executeSwap is not available", { silentSwap });
      return;
    }

    // Validate recipients - get selected ones with valid amounts
    const validRecipients = payoutRecipients.filter((r) => {
      return r.selected && r.amount.trim().length > 0 && parseFloat(r.amount) > 0;
    });

    if (validRecipients.length === 0) {
      alert("Please select at least one recipient and enter an amount greater than 0.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("Preparing private payouts...");

    console.log("Starting bulk payout:", {
      evmAddress,
      solAddress,
      hasWalletClient: !!walletClient,
      isSilentSwapReady,
      recipients: validRecipients.length,
      hasSilentSwapWallet: !!silentSwapWallet,
      walletLoading,
      hasAuth: !!auth,
      authLoading,
    });

    try {
      const results: Array<{ success: boolean; orderId?: string; error?: string }> = [];
      
      for (let i = 0; i < validRecipients.length; i++) {
        const recipient = validRecipients[i];
        setStatusMessage(`Processing payout ${i + 1} of ${validRecipients.length} to ${recipient.alias}...`);
        
        try {
          // Get CAIP-19 identifier for SOL
          const solAssetCaip19 = getAssetCaip19();

          console.log(`Executing swap for ${recipient.alias}:`, {
            sourceAsset: solAssetCaip19,
            sourceAmount: recipient.amount,
            destAsset: solAssetCaip19,
            recipientAddress: recipient.walletAddress,
            senderAddress: solAddress,
          });

          // Execute the swap using SilentSwap
          const result = await executeSwap({
            sourceAsset: solAssetCaip19,
            sourceAmount: recipient.amount,
            destinations: [
              {
                asset: solAssetCaip19,
                contact: `caip10:solana:*:${recipient.walletAddress}`,
                amount: "",
              },
            ],
            splits: [1],
            senderContactId: `caip10:solana:*:${solAddress}`,
            solanaAddress: solAddress,
            integratorId: process.env.NEXT_PUBLIC_INTEGRATOR_ID || undefined,
          } as any);

          console.log(`Swap ${i + 1} result:`, result);
          
          // CRITICAL: Log payment RECORD on Devnet for tracking
          if (result?.orderId) {
            try {
              setStatusMessage(`Logging payment record for ${recipient.alias}...`);
              await createPaymentRecord(recipient.walletAddress, result.orderId);
              console.log(`Payment record created for ${recipient.alias}`);
            } catch (recordError) {
              console.error("Failed to create on-chain payment record:", recordError);
              // We don't fail the whole loop if just the tracking record fails
            }
          }

          results.push({ 
            success: true, 
            orderId: result?.orderId || 'unknown' 
          });
          
        } catch (error: any) {
          console.error(`Swap failed for recipient ${i + 1}:`, error);
          results.push({ 
            success: false, 
            error: error.message || "Unknown error" 
          });
        }

        // Small delay between swaps to avoid rate limits
        if (i < validRecipients.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      // Show results summary
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;
      
      setStatusMessage(null);
      
      if (failCount === 0) {
        alert(`✅ All ${successCount} private payouts initiated successfully!`);
      } else if (successCount > 0) {
        alert(`⚠️ ${successCount} payouts succeeded, ${failCount} failed. Check console for details.`);
      } else {
        const errorMessages = results
          .filter((r) => !r.success)
          .map((r) => r.error)
          .join(", ");
        alert(`❌ All payouts failed: ${errorMessages}`);
      }

      console.log("Bulk payout results:", results);
      
    } catch (error: any) {
      console.error("Bulk payout error:", error);
      setStatusMessage(null);
      alert(`Error during payout: ${error.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalAmount = payoutRecipients.reduce(
    (sum, r) => sum + (r.selected ? (parseFloat(r.amount) || 0) : 0),
    0
  );

  // Show completion state
  if (orderComplete && orderId) {
    return (
      <div className="bg-green-900/20 border border-green-500/50 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4 text-green-400">🎉 Private Payout Complete!</h2>
        <p className="text-sm text-gray-300 mb-2">Order ID:</p>
        <p className="text-xs font-mono bg-zinc-800 p-2 rounded mb-4 break-all">{orderId}</p>
        <p className="text-sm text-gray-400 mb-4">
          The funds have been sent privately. The recipient&apos;s address is not publicly linked to this transaction on-chain.
        </p>
        <button
          onClick={handleNewSwap}
          className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg"
        >
          Start New Payout
        </button>
      </div>
    );
  }

  // Show loading state for SilentSwap
  if (isSilentSwapLoading) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-600 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Initializing SilentSwap...</p>
            <p className="text-xs text-gray-500 mt-2">This may take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (silentSwapError) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 border border-red-800">
        <h2 className="text-xl font-bold mb-4 text-red-400">SilentSwap Error</h2>
        <p className="text-gray-300 mb-4">{silentSwapError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <h2 className="text-2xl font-bold mb-2">Create Private Payroll Payout</h2>
      <p className="text-sm text-gray-400 mb-6">
        Send SOL or SPL tokens privately using SilentSwap. Recipients won&apos;t be publicly linked to your wallet on-chain.
      </p>

      {/* Connection Status Warning */}
      {!isBothConnected && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
          <p className="text-yellow-400 font-semibold mb-2">⚠️ Wallet Connection Required</p>
          <p className="text-sm text-gray-300">
            Both Solana and EVM wallets must be connected to use SilentSwap.
            {!solAddress && " Connect your Solana wallet."}
            {!evmAddress && " Connect your EVM wallet (MetaMask)."}
          </p>
        </div>
      )}

      {/* SilentSwap Status */}
      {isBothConnected && !isSilentSwapReady && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
          <p className="text-blue-400">
            {walletLoading ? "Generating secure wallet..." : "Initializing SilentSwap connection..."}
          </p>
        </div>
      )}

      {/* Recipients Selection */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">Select Recipients</label>
          <div className="text-xs text-blue-400">
            {devnetRecipients.length} saved on Devnet
          </div>
        </div>

        {loadingRecipients ? (
          <div className="py-4 text-center text-gray-500 text-sm">Loading recipients from Devnet...</div>
        ) : devnetRecipients.length === 0 ? (
          <div className="p-4 bg-zinc-800/50 border border-dashed border-zinc-700 rounded-lg text-center">
            <p className="text-sm text-gray-400 mb-2">No active recipients found on Devnet.</p>
            <p className="text-xs text-gray-500">Add recipients in the &quot;Recipients&quot; tab first.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payoutRecipients.map((recipient) => (
              <div 
                key={recipient.id}
                className={`p-4 rounded-lg border transition-all ${
                  recipient.selected 
                    ? 'bg-purple-900/20 border-purple-500/50' 
                    : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={recipient.selected}
                      onChange={() => toggleRecipient(recipient.id)}
                      disabled={isSwapping || isProcessing}
                      className="w-5 h-5 rounded border-zinc-700 text-purple-600 focus:ring-purple-500 bg-zinc-900"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-sm font-semibold text-white">{recipient.alias}</div>
                        <div className="flex gap-1">
                          <span className="px-1.5 py-0.5 bg-zinc-800 text-[9px] text-gray-400 rounded uppercase font-bold">
                            {DEPARTMENTS.find(d => d.id === recipient.departmentId)?.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="font-mono text-gray-500">
                          {recipient.walletAddress.slice(0, 8)}...{recipient.walletAddress.slice(-8)}
                        </span>
                        {recipient.lastPaymentTimestamp > 0 ? (
                          <span className="text-green-500/80 font-medium">
                            Last Paid: {new Date(recipient.lastPaymentTimestamp * 1000).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-yellow-500/80 font-medium italic">Never Paid</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {recipient.selected && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={recipient.amount}
                        onChange={(e) => updateRecipientAmount(recipient.id, e.target.value)}
                        placeholder="Amount (SOL)"
                        disabled={isSwapping || isProcessing}
                        className="w-32 p-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-white focus:border-purple-500 focus:outline-none"
                      />
                      <span className="text-xs text-gray-400 font-medium">SOL</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total Amount Display */}
      {totalAmount > 0 && (
        <div className="mb-6 p-4 bg-zinc-800 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Total Payout:</span>
            <span className="text-xl font-bold">
              {totalAmount.toFixed(4)} SOL
            </span>
          </div>
          {(serviceFeeUsd || bridgeFeeIngressUsd || bridgeFeeEgressUsd) && (
            <div className="mt-2 pt-2 border-t border-zinc-700 space-y-1 text-sm">
              {serviceFeeUsd !== undefined && serviceFeeUsd > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Service Fee:</span>
                  <span>${serviceFeeUsd.toFixed(2)}</span>
                </div>
              )}
              {((bridgeFeeIngressUsd || 0) + (bridgeFeeEgressUsd || 0)) > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Bridge Fees:</span>
                  <span>${((bridgeFeeIngressUsd || 0) + (bridgeFeeEgressUsd || 0)).toFixed(2)}</span>
                </div>
              )}
              {slippageUsd !== undefined && slippageUsd > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Est. Slippage:</span>
                  <span className="text-red-400">-${slippageUsd.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Status Display */}
      {(isSwapping || isProcessing || statusMessage) && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
          <p className="font-semibold text-yellow-400 mb-2">
            {currentStep || statusMessage || "Processing..."}
          </p>
          {orderStatusTexts && orderStatusTexts.length > 0 && (
            <div className="space-y-1">
              {orderStatusTexts.map((text: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {swapError && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 font-semibold">Error:</p>
          <p className="text-red-300 text-sm mt-1">{swapError.message}</p>
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={handleBulkPayout}
        disabled={
          !isBothConnected ||
          !isSilentSwapReady ||
          isSwapping ||
          isProcessing ||
          egressEstimatesLoading ||
          totalAmount <= 0 ||
          payoutRecipients.filter((r) => r.selected && r.amount && parseFloat(r.amount) > 0).length === 0
        }
        className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {!isBothConnected
          ? "Connect Both Wallets First"
          : !isSilentSwapReady
          ? "Waiting for SilentSwap..."
          : isSwapping || isProcessing
          ? "Processing Private Payouts..."
          : `Execute Private Payout (${payoutRecipients.filter((r) => r.selected && r.amount && parseFloat(r.amount) > 0).length} recipient${payoutRecipients.filter((r) => r.selected && r.amount && parseFloat(r.amount) > 0).length !== 1 ? 's' : ''})`
        }
      </button>

      <div className="mt-4 space-y-2">
        <p className="text-xs text-gray-500 text-center">
          ⚡ Powered by SilentSwap • Private cross-chain transfers on Solana Mainnet
        </p>
        <p className="text-xs text-gray-600 text-center">
          Each recipient receives funds through an ephemeral facilitator account, keeping payment history hidden on-chain.
        </p>
      </div>
    </div>
  );
}
