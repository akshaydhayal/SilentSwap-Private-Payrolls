"use client";

import { useState, useCallback } from "react";
import { useSilentSwap } from "@silentswap/react";
import { useUserAddress } from "@/hooks/useUserAddress";
import { RecipientInput } from "./RecipientInput";
import { isValidSolanaAddress } from "@/utils/solana";

export interface Recipient {
  id: string;
  address: string;
  amount: string;
  asset: string;
}

export function PayrollForm() {
  const { solAddress, evmAddress } = useUserAddress();
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
  } = useSilentSwap();

  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: "1", address: "", amount: "", asset: "SOL" },
  ]);
  const [sourceAsset, setSourceAsset] = useState("SOL");
  const [isProcessing, setIsProcessing] = useState(false);

  const addRecipient = useCallback(() => {
    if (recipients.length >= 5) return;
    setRecipients([
      ...recipients,
      { id: Date.now().toString(), address: "", amount: "", asset: "SOL" },
    ]);
  }, [recipients]);

  const removeRecipient = useCallback(
    (id: string) => {
      setRecipients(recipients.filter((r) => r.id !== id));
    },
    [recipients]
  );

  const updateRecipient = useCallback(
    (id: string, field: keyof Recipient, value: string) => {
      setRecipients(
        recipients.map((r) => (r.id === id ? { ...r, [field]: value } : r))
      );
    },
    [recipients]
  );

  const handleBulkPayout = async () => {
    if (!solAddress || !evmAddress) {
      alert("Both wallets must be connected");
      return;
    }

    // Validate inputs
    const validRecipients = recipients.filter(
      (r) => {
        const hasAddress = r.address.trim().length > 0;
        const hasAmount = r.amount.trim().length > 0 && parseFloat(r.amount) > 0;
        const isValidAddress = isValidSolanaAddress(r.address.trim());
        return hasAddress && hasAmount && isValidAddress;
      }
    );

    if (validRecipients.length === 0) {
      alert("Please add at least one valid recipient with a valid Solana address and amount");
      return;
    }

    // Check for invalid addresses
    const invalidRecipients = recipients.filter(
      (r) => r.address.trim() && !isValidSolanaAddress(r.address.trim())
    );
    if (invalidRecipients.length > 0) {
      alert(`Invalid Solana addresses detected. Please check recipient addresses.`);
      return;
    }

    setIsProcessing(true);

    try {
      // For bulk payouts, we'll execute multiple swaps
      // Each recipient gets their own private swap
      const swapPromises = validRecipients.map(async (recipient) => {
        const recipientAmount = recipient.amount;

        // Determine asset CAIP-19 format
        const sourceAssetCaip19 =
          sourceAsset === "SOL"
            ? "solana:5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1/slip44:501"
            : `solana:5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1/erc20:${sourceAsset}`;

        const destAssetCaip19 =
          recipient.asset === "SOL"
            ? "solana:5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1/slip44:501"
            : `solana:5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1/erc20:${recipient.asset}`;

        // Execute swap for this recipient
        return executeSwap({
          sourceAsset: sourceAssetCaip19,
          sourceAmount: recipientAmount,
          destinations: [
            {
              asset: destAssetCaip19,
              contact: `caip10:solana:*:${recipient.address}`,
              amount: "",
            },
          ],
          splits: [1],
          senderContactId: `caip10:solana:*:${solAddress}`,
          integratorId: process.env.NEXT_PUBLIC_INTEGRATOR_ID,
        });
      });

      // Execute all swaps sequentially to avoid rate limits
      const results = [];
      for (const promise of swapPromises) {
        try {
          const result = await promise;
          results.push(result);
          // Small delay between swaps
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error("Swap failed for recipient:", error);
          results.push({ error });
        }
      }

      console.log("Bulk payout results:", results);
      alert(
        `Bulk payout initiated! ${results.filter((r) => !r.error).length} of ${validRecipients.length} swaps started.`
      );
    } catch (error) {
      console.error("Bulk payout error:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalAmount = recipients.reduce(
    (sum, r) => sum + (parseFloat(r.amount) || 0),
    0
  );

  if (orderComplete && orderId) {
    return (
      <div className="bg-green-900/20 border border-green-500/50 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4 text-green-400">Payout Complete!</h2>
        <p className="text-sm text-gray-300 mb-4">Order ID: {orderId}</p>
        <button
          onClick={handleNewSwap}
          className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg"
        >
          New Payout
        </button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <h2 className="text-2xl font-bold mb-6">Create Private Payroll Payout</h2>

      {/* Source Asset Selection */}
      <div className="mb-6 space-y-2">
        <label className="text-sm text-gray-400">Source Asset</label>
        <select
          value={sourceAsset}
          onChange={(e) => setSourceAsset(e.target.value)}
          className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
          disabled={isSwapping || isProcessing}
        >
          <option value="SOL">SOL (Native)</option>
          <option value="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v">USDC</option>
        </select>
      </div>

      {/* Recipients List */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">Recipients</label>
          <button
            onClick={addRecipient}
            disabled={recipients.length >= 5 || isSwapping || isProcessing}
            className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            + Add Recipient
          </button>
        </div>

        {recipients.map((recipient, index) => (
          <RecipientInput
            key={recipient.id}
            recipient={recipient}
            index={index}
            onUpdate={(field, value) => updateRecipient(recipient.id, field, value)}
            onRemove={() => removeRecipient(recipient.id)}
            canRemove={recipients.length > 1}
            disabled={isSwapping || isProcessing}
          />
        ))}
      </div>

      {/* Total Amount Display */}
      {totalAmount > 0 && (
        <div className="mb-6 p-4 bg-zinc-800 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Total Amount:</span>
            <span className="text-xl font-bold">{totalAmount} {sourceAsset}</span>
          </div>
          {(serviceFeeUsd || bridgeFeeIngressUsd || bridgeFeeEgressUsd) && (
            <div className="mt-2 pt-2 border-t border-zinc-700 space-y-1 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Service Fee:</span>
                <span>${serviceFeeUsd?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Bridge Fees:</span>
                <span>
                  ${((bridgeFeeIngressUsd || 0) + (bridgeFeeEgressUsd || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Display */}
      {(isSwapping || isProcessing) && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
          <p className="font-semibold text-yellow-400 mb-2">
            Status: {currentStep || "Processing..."}
          </p>
          {orderStatusTexts && orderStatusTexts.length > 0 && (
            <div className="space-y-1">
              {orderStatusTexts.map((text, i) => (
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
          <p className="text-red-400">Error: {swapError.message}</p>
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={handleBulkPayout}
        disabled={
          isSwapping ||
          isProcessing ||
          egressEstimatesLoading ||
          totalAmount <= 0 ||
          recipients.filter((r) => r.address && r.amount).length === 0
        }
        className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {isSwapping || isProcessing
          ? "Processing Payouts..."
          : `Execute Private Payout (${recipients.filter((r) => r.address && r.amount).length} recipients)`}
      </button>

      <p className="mt-4 text-xs text-gray-500 text-center">
        Each recipient will receive funds through a private swap, keeping payment history hidden
        on-chain
      </p>
    </div>
  );
}
