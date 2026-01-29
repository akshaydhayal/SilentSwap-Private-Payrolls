import { PublicKey } from "@solana/web3.js";

/**
 * Validates a Solana address
 * @param address - The address to validate
 * @returns true if valid, false otherwise
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats a Solana address for display
 * @param address - The address to format
 * @param startChars - Number of characters to show at start (default: 4)
 * @param endChars - Number of characters to show at end (default: 4)
 * @returns Formatted address string
 */
export function formatSolanaAddress(
  address: string,
  startChars: number = 4,
  endChars: number = 4
): string {
  if (address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}
