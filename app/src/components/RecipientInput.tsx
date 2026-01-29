"use client";

import { Recipient } from "./PayrollForm";
import { isValidSolanaAddress } from "@/utils/solana";
import { useState } from "react";

interface RecipientInputProps {
  recipient: Recipient;
  index: number;
  onUpdate: (field: keyof Recipient, value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
}

export function RecipientInput({
  recipient,
  index,
  onUpdate,
  onRemove,
  canRemove,
  disabled,
}: RecipientInputProps) {
  const [addressError, setAddressError] = useState<string | null>(null);

  const handleAddressChange = (value: string) => {
    onUpdate("address", value);
    if (value.trim() && !isValidSolanaAddress(value.trim())) {
      setAddressError("Invalid Solana address");
    } else {
      setAddressError(null);
    }
  };

  return (
    <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-semibold text-gray-400">Recipient #{index + 1}</span>
        {canRemove && (
          <button
            onClick={onRemove}
            disabled={disabled}
            className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Solana Address</label>
          <input
            type="text"
            value={recipient.address}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
            disabled={disabled}
            className={`w-full p-2 bg-zinc-900 border rounded text-sm font-mono text-white disabled:opacity-50 ${
              addressError ? "border-red-500" : "border-zinc-700"
            }`}
          />
          {addressError && (
            <p className="text-xs text-red-400">{addressError}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Amount</label>
          <input
            type="number"
            step="0.000000001"
            value={recipient.amount}
            onChange={(e) => onUpdate("amount", e.target.value)}
            placeholder="0.0"
            disabled={disabled}
            className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-white disabled:opacity-50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Asset</label>
          <select
            value={recipient.asset}
            onChange={(e) => onUpdate("asset", e.target.value)}
            disabled={disabled}
            className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-white disabled:opacity-50"
          >
            <option value="SOL">SOL</option>
            <option value="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v">USDC</option>
          </select>
        </div>
      </div>
    </div>
  );
}
