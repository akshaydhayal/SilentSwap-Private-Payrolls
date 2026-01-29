"use client";

import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useUserAddress } from "@/hooks/useUserAddress";
import { PayrollForm } from "./PayrollForm";
import { PayrollHistory } from "./PayrollHistory";

export function PayrollDashboard() {
  const { publicKey, disconnect: disconnectSolana, connect: connectSolana, wallet, select } = useWallet();
  const { setVisible, visible } = useWalletModal();
  const { isConnected: isEvmConnected, address: evmAddress } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { isBothConnected } = useUserAddress();

  // Get Phantom's injected connector for EVM
  const phantomConnector = connectors.find((c) => c.id === "injected");

  const handleConnectEVM = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (phantomConnector) {
        connect({ connector: phantomConnector });
      } else {
        alert("Please install Phantom wallet to connect to EVM");
      }
    } catch (error) {
      console.error("EVM connection error:", error);
      alert("Failed to connect EVM wallet");
    }
  }, [phantomConnector, connect]);

  const handleConnectSolana = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Priority 1: If we have a wallet adapter already selected, connect directly
      if (wallet?.adapter && !publicKey) {
        console.log("Connecting via adapter:", wallet.adapter.name);
        await wallet.adapter.connect();
        return;
      }
      
      // Priority 2: If Phantom is detected, select it first, then connect
      if (typeof window !== 'undefined' && (window as any).solana) {
        const phantom = (window as any).solana;
        if (phantom && phantom.isPhantom) {
          console.log("Phantom detected, selecting adapter");
          
          // First, select the Phantom adapter (required before connecting)
          if (select && typeof select === 'function') {
            try {
              await select('Phantom');
              console.log("Phantom adapter selected");
              
              // Wait for the wallet context to update with the selected adapter
              // Poll for the adapter to be available (max 2 seconds)
              let attempts = 0;
              const maxAttempts = 20;
              while (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                if (wallet?.adapter && wallet.adapter.name === 'Phantom') {
                  console.log("Phantom adapter is now available, connecting");
                  await wallet.adapter.connect();
                  return;
                }
                attempts++;
              }
              
              // If adapter still not available, try connectSolana
              if (connectSolana && typeof connectSolana === 'function') {
                console.log("Connecting via connectSolana after selection");
                await connectSolana();
                return;
              }
              
              throw new Error("Adapter selected but not available for connection");
            } catch (selectError) {
              console.error("Failed to select/connect Phantom:", selectError);
              // Continue to modal fallback
            }
          }
        }
      }
      
      // Priority 3: Open wallet modal to let user choose
      if (setVisible && typeof setVisible === 'function') {
        console.log("Opening wallet modal");
        setVisible(true);
        return;
      }
      
      // Last resort: Alert user
      alert("Please install a Solana wallet extension (Phantom recommended) and refresh the page.");
    } catch (error) {
      console.error("Error connecting Solana wallet:", error);
      alert(`Failed to connect Solana wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [setVisible, connectSolana, wallet, publicKey, select]);

  const handleDisconnectSolana = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await disconnectSolana();
    } catch (error) {
      console.error("Error disconnecting Solana wallet:", error);
    }
  }, [disconnectSolana]);

  const handleDisconnectEVM = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      disconnect();
    } catch (error) {
      console.error("Error disconnecting EVM wallet:", error);
    }
  }, [disconnect]);

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
                    onClick={handleDisconnectSolana}
                    type="button"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm cursor-pointer"
                    style={{ pointerEvents: 'auto', zIndex: 100 }}
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnectSolana}
                  type="button"
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold cursor-pointer"
                  style={{ pointerEvents: 'auto', zIndex: 100 }}
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
                    onClick={handleDisconnectEVM}
                    type="button"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm cursor-pointer"
                    style={{ pointerEvents: 'auto', zIndex: 100 }}
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnectEVM}
                  type="button"
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold cursor-pointer"
                  style={{ pointerEvents: 'auto', zIndex: 100 }}
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
