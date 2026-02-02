"use client";

import { useCallback, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAccount, useConnect, useDisconnect, useWalletClient } from "wagmi";
import { useUserAddress } from "@/hooks/useUserAddress";
import { PayrollForm } from "./PayrollForm";
import { PayrollHistory } from "./PayrollHistory";
import RecipientsPage from "./RecipientsPage";
import { useSilentSwapContext } from "@/app/providers";

type Tab = 'recipients' | 'payroll' | 'history';

export function PayrollDashboard() {
  const { publicKey, disconnect: disconnectSolana, connect: connectSolana, wallet, select, connected: solanaConnected } = useWallet();
  const { setVisible } = useWalletModal();
  const { isConnected: isEvmConnected, address: evmAddress } = useAccount();
  const { data: walletClient, isLoading: walletClientLoading } = useWalletClient();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { isBothConnected, solAddress } = useUserAddress();
  const { isReady: isSilentSwapReady, isLoading: isSilentSwapLoading, error: silentSwapError } = useSilentSwapContext();
  
  const [activeTab, setActiveTab] = useState<Tab>('recipients');

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

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'recipients', label: 'Recipients', icon: '👥' },
    { id: 'payroll', label: 'Execute Payroll', icon: '💸' },
    { id: 'history', label: 'History', icon: '📋' },
  ];

  return (
    <div className="space-y-6">
      {/* Wallet Connection Status - Compact */}
      <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Solana Status */}
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${solanaConnected ? 'bg-green-500' : 'bg-gray-500'}`}></span>
              {publicKey ? (
                <span className="text-sm font-mono text-green-400">
                  SOL: {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                </span>
              ) : (
                <button
                  onClick={handleConnectSolana}
                  className="text-sm px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Connect Solana
                </button>
              )}
              {publicKey && (
                <button onClick={handleDisconnectSolana} className="text-xs text-gray-500 hover:text-red-400">✕</button>
              )}
            </div>

            {/* EVM Status */}
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isEvmConnected ? 'bg-green-500' : 'bg-gray-500'}`}></span>
              {isEvmConnected && evmAddress ? (
                <span className="text-sm font-mono text-green-400">
                  EVM: {evmAddress.slice(0, 4)}...{evmAddress.slice(-4)}
                </span>
              ) : (
                <button
                  onClick={handleConnectEVM}
                  className="text-sm px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Connect EVM
                </button>
              )}
              {isEvmConnected && (
                <button onClick={handleDisconnectEVM} className="text-xs text-gray-500 hover:text-red-400">✕</button>
              )}
            </div>
          </div>

          {/* SilentSwap Status */}
          <div className="flex items-center gap-2">
            {isBothConnected && isSilentSwapLoading && (
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                Initializing...
              </span>
            )}
            {isBothConnected && isSilentSwapReady && (
              <span className="text-xs text-green-400">✓ SilentSwap Ready</span>
            )}
            {!isBothConnected && (
              <span className="text-xs text-yellow-400">⚠️ Both wallets required for payments</span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-zinc-700">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-purple-500 bg-zinc-800/50'
                  : 'text-gray-400 hover:text-white hover:bg-zinc-800/30'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'recipients' && (
          <RecipientsPage />
        )}
        
        {activeTab === 'payroll' && (
          <>
            {isBothConnected ? (
              <PayrollForm />
            ) : (
              <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
                <h3 className="text-xl font-semibold mb-4">Connect Wallets to Execute Payroll</h3>
                <p className="text-gray-400 mb-6">
                  SilentSwap requires both Solana and EVM wallets connected to execute private payments on Mainnet.
                </p>
                <div className="flex justify-center gap-4">
                  {!solanaConnected && (
                    <button
                      onClick={handleConnectSolana}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
                    >
                      Connect Solana
                    </button>
                  )}
                  {!isEvmConnected && (
                    <button
                      onClick={handleConnectEVM}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
                    >
                      Connect EVM
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        
        {activeTab === 'history' && (
          <PayrollHistory />
        )}
      </div>

      {/* Network Info Footer */}
      <div className="flex justify-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          Recipients: Solana Devnet (free)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
          Payments: Solana Mainnet (SilentSwap)
        </span>
      </div>
    </div>
  );
}
