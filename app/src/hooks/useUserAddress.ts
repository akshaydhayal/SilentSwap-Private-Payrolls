"use client";

import { useAccount } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";

export function useUserAddress() {
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { publicKey: solanaPublicKey, connected: isSolanaConnected } = useWallet();

  const solAddress = useMemo(() => {
    return solanaPublicKey?.toBase58() || null;
  }, [solanaPublicKey]);

  return {
    evmAddress: evmAddress || null,
    solAddress,
    isEvmConnected: isEvmConnected && !!evmAddress,
    isSolanaConnected: isSolanaConnected && !!solAddress,
    isBothConnected: isEvmConnected && !!evmAddress && isSolanaConnected && !!solAddress,
  };
}
