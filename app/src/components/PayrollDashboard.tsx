"use client";

import { useCallback, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAccount, useConnect, useDisconnect, useWalletClient } from "wagmi";
import { useUserAddress } from "@/hooks/useUserAddress";
import { PayrollForm } from "./PayrollForm";
import { PayrollHistory } from "./PayrollHistory";
import { useSilentSwapContext } from "@/app/providers";

export function PayrollDashboard() {
  const { publicKey, disconnect: disconnectSolana, connect: connectSolana, wallet, select, connected: solanaConnected } = useWallet();
  const { setVisible } = useWalletModal();
  const { isConnected: isEvmConnected, address: evmAddress } = useAccount();
  const { data: walletClient, isLoading: walletClientLoading } = useWalletClient();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { isBothConnected, solAddress } = useUserAddress();
  const { isReady: isSilentSwapReady, isLoading: isSilentSwapLoading, error: silentSwapError } = useSilentSwapContext();

  // Get connectors
  const metaMaskConnector = connectors.find((c) => c.id === "metaMask" || c.id === "io.metamask" || c.name === "MetaMask");
  const injectedConnector = connectors.find((c) => c.id === "injected");

  // Debug log connectors once
  useEffect(() => {
    if (connectors.length > 0) {
      console.log("Available EVM Connectors:", connectors.map(c => ({ id: c.id, name: c.name })));
    }
  }, [connectors]);

  const handleConnectEVM = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      console.log("Attempting to connect EVM wallet...", { 
        hasMetaMask: !!metaMaskConnector, 
        hasInjected: !!injectedConnector 
      });
      
      if (metaMaskConnector) {
        connect({ connector: metaMaskConnector, chainId: 1 }); // Force Ethereum Mainnet
      } else if (injectedConnector) {
        connect({ connector: injectedConnector, chainId: 1 });
      } else {
        // Try to find any available connector
        const anyConnector = connectors[0];
        if (anyConnector) {
          connect({ connector: anyConnector });
        } else {
          alert("Please install MetaMask to connect to EVM");
        }
      }
    } catch (error) {
      console.error("EVM connection error:", error);
      alert("Failed to connect EVM wallet. Please try again.");
    }
  }, [metaMaskConnector, injectedConnector, connect, connectors]);

  const handleConnectSolana = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // If already connected, do nothing
      if (publicKey || solanaConnected) {
        console.log("Solana wallet already connected");
        return;
      }

      // Priority 1: If we have a wallet adapter already selected, connect directly
      if (wallet?.adapter && !publicKey) {
        console.log("Connecting via adapter:", wallet.adapter.name);
        try {
          await wallet.adapter.connect();
          return;
        } catch (adapterError) {
          console.warn("Direct adapter connection failed:", adapterError);
        }
      }
      
      // Priority 2: If Phantom is detected, try to select and connect
      if (typeof window !== 'undefined' && (window as any).solana?.isPhantom) {
        console.log("Phantom detected, attempting selection...");
        
        if (select && typeof select === 'function') {
          try {
            select('Phantom' as any);
            
            // Wait a moment for selection to take effect
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check if we can now connect
            if (wallet?.adapter) {
              await wallet.adapter.connect();
              return;
            }
            
            // Try the connectSolana function if available
            if (connectSolana && typeof connectSolana === 'function') {
              await connectSolana();
              return;
            }
          } catch (selectError) {
            console.warn("Phantom selection/connection failed:", selectError);
          }
        }
      }
      
      // Fallback: Open wallet modal
      console.log("Opening wallet selection modal...");
      setVisible(true);
      
    } catch (error) {
      console.error("Error connecting Solana wallet:", error);
      // Don't alert on every error, just open the modal as fallback
      setVisible(true);
    }
  }, [setVisible, connectSolana, wallet, publicKey, select, solanaConnected]);

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
          SilentSwap requires both Solana (Phantom) and EVM (MetaMask) wallets connected.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Solana Wallet */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${solanaConnected ? 'bg-green-500' : 'bg-gray-500'}`}></span>
              Solana Wallet {solanaConnected ? '(Connected)' : ''}
            </label>
            <div className="flex items-center gap-3">
              {publicKey ? (
                <>
                  <div className="flex-1 bg-zinc-800 rounded-lg p-3">
                    <p className="text-sm font-mono text-green-400">
                      {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
                    </p>
                  </div>
                  <button
                    onClick={handleDisconnectSolana}
                    type="button"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm cursor-pointer transition-colors"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnectSolana}
                  type="button"
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold cursor-pointer transition-colors"
                >
                  Connect Solana Wallet
                </button>
              )}
            </div>
          </div>

          {/* EVM Wallet */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isEvmConnected ? 'bg-green-500' : 'bg-gray-500'}`}></span>
              EVM Wallet (MetaMask) {isEvmConnected ? '(Connected)' : ''}
            </label>
            <div className="flex items-center gap-3">
              {isEvmConnected && evmAddress ? (
                <>
                  <div className="flex-1 bg-zinc-800 rounded-lg p-3">
                    <p className="text-sm font-mono text-green-400">
                      {evmAddress.slice(0, 8)}...{evmAddress.slice(-8)}
                    </p>
                    {walletClientLoading && (
                      <p className="text-xs text-yellow-400 mt-1">Initializing...</p>
                    )}
                  </div>
                  <button
                    onClick={handleDisconnectEVM}
                    type="button"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm cursor-pointer transition-colors"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnectEVM}
                  type="button"
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold cursor-pointer transition-colors"
                >
                  Connect EVM (MetaMask)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Connection Status Messages */}
        {!isBothConnected && (
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
            <p className="text-sm text-yellow-400 font-medium mb-1">⚠️ Both wallets required</p>
            <p className="text-xs text-yellow-300/80">
              SilentSwap needs both Solana and EVM wallets connected to facilitate private transfers.
              The EVM wallet is used for signing facilitator operations.
            </p>
          </div>
        )}

        {isBothConnected && isSilentSwapLoading && (
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-blue-400">Initializing SilentSwap connection...</p>
            </div>
          </div>
        )}

        {isBothConnected && isSilentSwapReady && !isSilentSwapLoading && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
            <p className="text-sm text-green-400">✓ SilentSwap ready - You can now make private payouts</p>
          </div>
        )}

        {isBothConnected && silentSwapError && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-400 font-medium">SilentSwap Error</p>
            <p className="text-xs text-red-300/80 mt-1">{silentSwapError}</p>
          </div>
        )}
      </div>

      {/* Payroll Form and History - only show when both wallets connected */}
      {isBothConnected && (
        <>
          <PayrollForm />
          <PayrollHistory />
        </>
      )}

      {/* Instructions when not connected */}
      {!isBothConnected && (
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <h3 className="text-lg font-semibold mb-4">How to use SilentSwap Payroll</h3>
          <ol className="space-y-3 text-gray-400 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">1</span>
              <span>Install <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Phantom</a> for Solana and <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">MetaMask</a> for EVM</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">2</span>
              <span>Connect your Solana wallet (Phantom)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">3</span>
              <span>Connect your EVM wallet (MetaMask)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">4</span>
              <span>Add recipients and amounts, then execute private payouts</span>
            </li>
          </ol>
          <div className="mt-4 p-3 bg-zinc-800 rounded-lg">
            <p className="text-xs text-gray-500">
              💡 <strong>Privacy:</strong> SilentSwap routes payments through ephemeral facilitator accounts, 
              breaking the on-chain link between sender and recipient.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
