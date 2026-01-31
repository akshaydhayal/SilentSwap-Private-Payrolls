"use client";

import React, { useEffect, useState, useMemo } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mainnet, avalanche } from "wagmi/chains";
import { injected, metaMask } from "wagmi/connectors";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletModal } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { useAccount, useWalletClient } from "wagmi";
import { useConnection } from "@solana/wallet-adapter-react";
import "@solana/wallet-adapter-react-ui/styles.css";

const queryClient = new QueryClient();

// Create wagmi config using MetaMask and generic injected connectors
// Including Mainnet as it seems to be required by SilentSwap for some operations
const wagmiConfig = createConfig({
  chains: [mainnet, avalanche],
  connectors: [
    metaMask(),
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
    [avalanche.id]: http(),
  },
});

// Custom hook for user addresses
function useUserAddress() {
  const { address: evmAddress } = useAccount();
  const { publicKey: solanaPublicKey } = useWallet();

  const solAddress = useMemo(() => {
    return solanaPublicKey?.toBase58() || null;
  }, [solanaPublicKey]);

  return {
    evmAddress: evmAddress || null,
    solAddress,
    isEvmConnected: !!evmAddress,
    isSolanaConnected: !!solAddress,
    isBothConnected: !!evmAddress && !!solAddress,
  };
}

// SilentSwap Context for sharing the loaded modules
interface SilentSwapContextType {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  modules: {
    SilentSwapProvider: any;
    createSilentSwapClient: any;
    ENVIRONMENT: any;
    useSolanaAdapter: any;
  } | null;
}

const SilentSwapContext = React.createContext<SilentSwapContextType>({
  isReady: false,
  isLoading: true,
  error: null,
  modules: null,
});

export const useSilentSwapContext = () => React.useContext(SilentSwapContext);

// Inner component that uses the loaded SilentSwap modules
function SilentSwapProviderInner({ 
  children, 
  modules 
}: { 
  children: React.ReactNode;
  modules: NonNullable<SilentSwapContextType['modules']>;
}) {
  const { isConnected, connector } = useAccount();
  const { data: walletClient, isLoading: walletClientLoading, isError: walletClientError } = useWalletClient();
  const { evmAddress, solAddress } = useUserAddress();
  const { wallet, connected: solanaConnected } = useWallet();
  const { connection } = useConnection();
  
  const { SilentSwapProvider, createSilentSwapClient, ENVIRONMENT, useSolanaAdapter } = modules;
  
  // Use the built-in Solana adapter hook from SilentSwap
  // This provides the correct adapter format expected by SilentSwapProvider
  // Note: useSolanaAdapter is always defined (either real hook or stub from modules)
  const solanaAdapterResult = useSolanaAdapter();
  const { solanaConnector, solanaConnectionAdapter } = solanaAdapterResult || {};
  
  // Fallback: if useSolanaAdapter doesn't work, create our own adapter
  const fallbackSolanaConnector = useMemo(() => {
    if (solanaConnector) return solanaConnector;
    if (wallet?.adapter && solanaConnected) {
      return wallet.adapter;
    }
    return undefined;
  }, [solanaConnector, wallet?.adapter, solanaConnected]);
  
  const fallbackSolanaConnection = useMemo(() => {
    if (solanaConnectionAdapter) return solanaConnectionAdapter;
    return connection || undefined;
  }, [solanaConnectionAdapter, connection]);

  // Create SilentSwap client for MAINNET
  const environment = useMemo(() => {
    // FORCE MAINNET for Solana support
    return ENVIRONMENT.MAINNET;
  }, [ENVIRONMENT]);

  const client = useMemo(() => {
    return createSilentSwapClient({ 
      environment,
      // No baseUrl here, let it use default for MAINNET
    });
  }, [createSilentSwapClient, environment]);

  // Create fallback walletClient if wagmi's useWalletClient doesn't return one
  const [fallbackWalletClient, setFallbackWalletClient] = useState<any>(null);
  
  useEffect(() => {
    const createFallbackClient = async () => {
      // Log the current state for debugging
      console.log("Fallback walletClient check:", {
        hasWagmiWalletClient: !!walletClient,
        walletClientLoading,
        isConnected,
        hasEvmAddress: !!evmAddress,
        hasConnector: !!connector,
        connectorName: connector?.name,
        hasFallback: !!fallbackWalletClient,
      });
      
      // Create fallback if wagmi doesn't provide one but we're connected
      if (!walletClient && !walletClientLoading && isConnected && evmAddress && typeof window !== 'undefined') {
        try {
          let ethereum = (window as any).ethereum;
          
          // Handle multiple providers (EIP-6963 or generic multi-provider)
          if (ethereum && ethereum.providers) {
            ethereum = ethereum.providers.find((p: any) => p.isMetaMask) || ethereum;
          } else if (ethereum && !ethereum.isMetaMask && (window as any).metamask?.ethereum) {
            // Some versions of MetaMask inject into window.metamask
            ethereum = (window as any).metamask.ethereum;
          }
          
          if (ethereum) {
            console.log("Creating fallback walletClient from injected provider...");
            const { createWalletClient, custom } = await import('viem');
            
            const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
            const chainIdNumber = parseInt(chainIdHex, 16);
            
            // Prefer the chain the user is already on if it's supported
            const chain = chainIdNumber === mainnet.id ? mainnet : 
                         chainIdNumber === avalanche.id ? avalanche : 
                         avalanche; // Default to Avalanche
            
            const client = createWalletClient({
              account: evmAddress as `0x${string}`,
              chain: chain,
              transport: custom(ethereum),
            });
            
            console.log("✓ Fallback walletClient created successfully", { chain: chain.name });
            setFallbackWalletClient(client);
          } else {
            console.warn("No ethereum provider found for fallback walletClient");
          }
        } catch (error) {
          console.error("Failed to create fallback walletClient:", error);
        }
      } else if (walletClient && fallbackWalletClient) {
        // Clear fallback if wagmi now provides one
        console.log("Clearing fallback walletClient - wagmi now provides one");
        setFallbackWalletClient(null);
      }
    };
    
    createFallbackClient();
  }, [walletClient, walletClientLoading, isConnected, evmAddress, connector, fallbackWalletClient]);
  
  const effectiveWalletClient = walletClient || fallbackWalletClient;

  // Solana RPC URL - use Helius for reliability
  const solanaRpcUrl = useMemo(() => {
    return "https://mainnet.helius-rpc.com/?api-key=0f95fd89-7479-4046-8f4d-33123a60b966";
  }, []);

  // Log connection status for debugging
  useEffect(() => {
    if (isConnected || solanaConnected) {
      console.log("SilentSwap System Status:", {
        environmentEnum: ENVIRONMENT,
        selectedEnv: environment,
        solAddress,
        hasSolanaConnector: !!(solanaConnector || fallbackSolanaConnector),
        hasSolanaConnection: !!(solanaConnectionAdapter || fallbackSolanaConnection),
        solanaRpcUrl,
      });
      
      // CRITICAL AUTH DEBUG: Log all prerequisites for auth
      console.log("SilentSwap Auth Prerequisites:", {
        hasClient: !!client,
        clientType: client ? typeof client : 'null',
        evmAddress,
        hasEvmAddress: !!evmAddress,
        hasWalletClient: !!walletClient,
        hasFallbackWalletClient: !!fallbackWalletClient,
        hasEffectiveWalletClient: !!effectiveWalletClient,
        hasConnector: !!connector,
        connectorName: connector?.name,
        isConnected,
        walletClientLoading,
        walletClientError,
      });
    }
  }, [isConnected, solanaConnected, solAddress, solanaConnector, 
      fallbackSolanaConnector, solanaConnectionAdapter, fallbackSolanaConnection, solanaRpcUrl, environment, ENVIRONMENT,
      client, evmAddress, walletClient, fallbackWalletClient, effectiveWalletClient, connector, walletClientLoading, walletClientError]);

  // CRITICAL FIX: Don't render SilentSwapProvider until walletClient is ready
  // This avoids the race condition where auth skips because walletClient is undefined
  // We only wait when EVM is connected - if not connected, we still render the provider
  // so the UI can prompt the user to connect
  const isWalletClientReady = !isConnected || !!effectiveWalletClient || walletClientLoading;
  
  if (isConnected && !effectiveWalletClient && !walletClientLoading) {
    // EVM is connected but walletClient not ready yet and not loading - wait for fallback creation
    console.log("Waiting for walletClient to be ready before mounting SilentSwapProvider...");
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Initializing wallet connection...</p>
        </div>
      </div>
    );
  }

  return (
    <SilentSwapProvider
      client={client}
      environment={environment}
      evmAddress={evmAddress || undefined}
      solAddress={solAddress || undefined}
      isConnected={isConnected}
      connector={connector || undefined}
      walletClient={effectiveWalletClient || undefined}
      solanaConnector={solanaConnector || fallbackSolanaConnector || undefined}
      solanaConnection={solanaConnectionAdapter || fallbackSolanaConnection || undefined}
      solanaRpcUrl={solanaRpcUrl}
    >
      {children}
    </SilentSwapProvider>
  );
}

// Wrapper that loads SilentSwap modules dynamically
const SilentSwapWrapper = React.memo(({ children }: { children: React.ReactNode }) => {
  const [modules, setModules] = useState<SilentSwapContextType['modules']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    
    const loadModules = async () => {
      try {
        console.log("Loading SilentSwap modules...");
        
        // Import both modules
        const [silentSwapReact, silentSwapSdk] = await Promise.all([
          import('@silentswap/react'),
          import('@silentswap/sdk'),
        ]);
        
        if (!isMounted) return;
        
        console.log("✓ SilentSwap modules loaded", {
          hasProvider: !!silentSwapReact.SilentSwapProvider,
          hasUseSilentSwap: !!silentSwapReact.useSilentSwap,
          hasUseSolanaAdapter: !!silentSwapReact.useSolanaAdapter,
          hasClient: !!silentSwapSdk.createSilentSwapClient,
          hasEnvironment: !!silentSwapSdk.ENVIRONMENT,
        });
        
        setModules({
          SilentSwapProvider: silentSwapReact.SilentSwapProvider,
          createSilentSwapClient: silentSwapSdk.createSilentSwapClient,
          ENVIRONMENT: silentSwapSdk.ENVIRONMENT,
          useSolanaAdapter: silentSwapReact.useSolanaAdapter,
        });
        setError(null);
      } catch (err: any) {
        console.error("Failed to load SilentSwap modules:", err);
        setError(err.message || "Failed to load SilentSwap");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadModules();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const contextValue = useMemo(() => ({
    isReady: !!modules,
    isLoading,
    error,
    modules,
  }), [modules, isLoading, error]);

  // Always render children - don't block UI
  // If modules are loaded, wrap with SilentSwapProvider
  if (modules) {
    return (
      <SilentSwapContext.Provider value={contextValue}>
        <SilentSwapProviderInner modules={modules}>
          {children}
        </SilentSwapProviderInner>
      </SilentSwapContext.Provider>
    );
  }

  // If still loading or error, render children without provider
  // Components will use stub hooks
  return (
    <SilentSwapContext.Provider value={contextValue}>
      {children}
    </SilentSwapContext.Provider>
  );
});

SilentSwapWrapper.displayName = 'SilentSwapWrapper';

export function Providers({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider
          endpoint={"https://mainnet.helius-rpc.com/?api-key=0f95fd89-7479-4046-8f4d-33123a60b966"}
        >
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <SilentSwapWrapper>
                {children}
                <WalletModal />
              </SilentSwapWrapper>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
