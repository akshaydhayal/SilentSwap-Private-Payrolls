"use client";

import React, { useEffect, useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mainnet, avalanche } from "wagmi/chains";
import { injected } from "@wagmi/connectors";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletModal } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { useAccount, useWalletClient } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { useUserAddress } from "@/hooks/useUserAddress";
import "@solana/wallet-adapter-react-ui/styles.css";

const queryClient = new QueryClient();

// Create wagmi config using injected connector (Phantom's EVM support)
// Injected connector auto-detects browser wallets like Phantom
const wagmiConfig = createConfig({
  chains: [mainnet, avalanche],
  connectors: [
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
    [avalanche.id]: http(),
  },
});

const SilentSwapWrapper = React.memo(({ children }: { children: React.ReactNode }) => {
  const { isConnected, connector } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { evmAddress, solAddress } = useUserAddress();
  const { wallet } = useWallet();
  const [silentSwapModule, setSilentSwapModule] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Dynamically import SilentSwap only on client side
    if (typeof window !== 'undefined') {
      Promise.all([
        import('@silentswap/react'),
        import('@silentswap/sdk'),
      ]).then(([silentSwapReact, silentSwapSdk]) => {
        setSilentSwapModule({
          SilentSwapProvider: silentSwapReact.SilentSwapProvider,
          createSilentSwapClient: silentSwapSdk.createSilentSwapClient,
          ENVIRONMENT: silentSwapSdk.ENVIRONMENT,
        });
        setIsLoading(false);
      }).catch((error) => {
        console.error('Failed to load SilentSwap:', error);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Get environment - must be called unconditionally (before any early returns)
  const environment = React.useMemo(() => {
    if (!silentSwapModule) {
      return null;
    }
    const { ENVIRONMENT } = silentSwapModule;
    return (process.env.NEXT_PUBLIC_SILENTSWAP_ENV as any) || ENVIRONMENT.STAGING;
  }, [silentSwapModule]);

  // Create client - must be called unconditionally (before any early returns)
  const client = React.useMemo(() => {
    if (!silentSwapModule || !environment) {
      return null;
    }
    const { createSilentSwapClient } = silentSwapModule;
    return createSilentSwapClient({ environment });
  }, [silentSwapModule, environment]);

  // Show children without SilentSwapProvider if not loaded yet or on server
  if (isLoading || !silentSwapModule || !client || typeof window === 'undefined') {
    return <>{children}</>;
  }

  const { SilentSwapProvider } = silentSwapModule;

  // Get Solana adapter from wallet
  const solanaConnector = wallet?.adapter || undefined;
  const solanaConnection = wallet?.adapter || undefined;

  return (
    <SilentSwapProvider
      client={client}
      environment={environment}
      evmAddress={evmAddress || undefined}
      solAddress={solAddress || undefined}
      isConnected={isConnected}
      connector={connector || undefined}
      walletClient={walletClient || undefined}
      solanaConnector={solanaConnector}
      solanaConnection={solanaConnection}
      solanaRpcUrl={process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"}
    >
      {children}
    </SilentSwapProvider>
  );
});

SilentSwapWrapper.displayName = 'SilentSwapWrapper';

export function Providers({ children }: { children: React.ReactNode }) {
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider
          endpoint={process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"}
        >
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <SilentSwapWrapper>
                {children}
                {/* Wallet Modal rendered once at app level */}
                <WalletModal />
              </SilentSwapWrapper>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
