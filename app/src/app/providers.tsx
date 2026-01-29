"use client";

import React from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, avalanche } from "wagmi/chains";
import { SilentSwapProvider } from "@silentswap/react";
import { createSilentSwapClient, ENVIRONMENT } from "@silentswap/sdk";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { useAccount, useWalletClient } from "wagmi";
import { useSolanaAdapter } from "@silentswap/react";
import { useUserAddress } from "@/hooks/useUserAddress";
import "@rainbow-me/rainbowkit/styles.css";
import "@solana/wallet-adapter-react-ui/styles.css";

const queryClient = new QueryClient();

const wagmiConfig = getDefaultConfig({
  appName: "SilentSwap Payroll",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "default",
  chains: [mainnet, avalanche],
  ssr: true,
});

const SilentSwapWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isConnected, connector } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { evmAddress, solAddress } = useUserAddress();
  const { solanaConnector, solanaConnectionAdapter } = useSolanaAdapter();

  const environment = (process.env.NEXT_PUBLIC_SILENTSWAP_ENV as any) || ENVIRONMENT.STAGING;
  const client = createSilentSwapClient({ environment });

  return (
    <SilentSwapProvider
      client={client}
      environment={environment}
      evmAddress={evmAddress || undefined}
      solAddress={solAddress || undefined}
      isConnected={isConnected}
      connector={connector || undefined}
      walletClient={walletClient || undefined}
      solanaConnector={solanaConnector || undefined}
      solanaConnection={solanaConnectionAdapter || undefined}
      solanaRpcUrl={process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"}
    >
      {children}
    </SilentSwapProvider>
  );
};

export function Providers({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Mainnet;
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ConnectionProvider
            endpoint={process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"}
          >
            <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>
                <SilentSwapWrapper>{children}</SilentSwapWrapper>
              </WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
