"use client";

import { useAccount } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";

export function useUserAddress() {
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
