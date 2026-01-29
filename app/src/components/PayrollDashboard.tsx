"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useUserAddress } from "@/hooks/useUserAddress";
import { PayrollForm } from "./PayrollForm";
import { PayrollHistory } from "./PayrollHistory";

export function PayrollDashboard() {
  const { publicKey, disconnect: disconnectSolana } = useWallet();
  const { openWalletModal } = useWalletModal();
  const { isConnected: isEvmConnected, address: evmAddress } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { isBothConnected } = useUserAddress();

  // Get Phantom's injected connector for EVM
  const phantomConnector = connectors.find((c) => c.id === "injected");

  const handleConnectEVM = async () => {
    if (phantomConnector) {
      connect({ connector: phantomConnector });
    } else {
      alert("Please install Phantom wallet to connect to EVM");
    }
  };

  return (
    <div className="space-y-8">
      {/* Wallet Connection Status */}
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <h2 className="text-xl font-semibold mb-4">Wallet Connections</h2>
        <p className="text-sm text-gray-400 mb-4">
          Connect using Phantom wallet (supports both Solana and EVM)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Solana Wallet</label>
            <div className="flex items-center gap-3">
              {publicKey ? (
                <>
                  <div className="flex-1 bg-zinc-800 rounded-lg p-3">
                    <p className="text-sm font-mono">
                      {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
                    </p>
                  </div>
                  <button
                    onClick={disconnectSolana}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={openWalletModal}
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
                >
                  Connect Solana Wallet
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-400">EVM Wallet (Phantom)</label>
            <div className="flex items-center gap-3">
              {isEvmConnected ? (
                <>
                  <div className="flex-1 bg-zinc-800 rounded-lg p-3">
                    <p className="text-sm font-mono">
                      {evmAddress?.slice(0, 8)}...{evmAddress?.slice(-8)}
                    </p>
                  </div>
                  <button
                    onClick={() => disconnect()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnectEVM}
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
                >
                  Connect EVM (Phantom)
                </button>
              )}
            </div>
          </div>
        </div>
        {!isBothConnected && (
          <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <p className="text-sm text-yellow-400">
              ⚠️ Both Solana and EVM wallets must be connected to use SilentSwap. 
              Use Phantom wallet for both connections.
            </p>
          </div>
        )}
      </div>

      {/* Payroll Form */}
      {isBothConnected && (
        <>
          <PayrollForm />
          <PayrollHistory />
        </>
      )}
    </div>
  );
}
