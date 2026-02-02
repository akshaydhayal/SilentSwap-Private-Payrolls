import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { AnchorProvider, Program, Idl, BN } from '@coral-xyz/anchor';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useMemo, useState, useCallback, useEffect } from 'react';

// Program ID deployed on Devnet
export const PROGRAM_ID = new PublicKey('9ideARSjLdYXZut2MqH4zwDXn4yZhFyopzjQHJKVFudn');

// Devnet connection for program interactions
const DEVNET_RPC_URL = clusterApiUrl('devnet');

// IDL - imported from generated file
import idlJson from '../idl/silentswap_payroll.json';

// Constants for Off-chain metadata mapping
export const DEPARTMENTS = [
  { id: 0, label: 'Engineering' },
  { id: 1, label: 'Marketing' },
  { id: 2, label: 'Sales' },
  { id: 3, label: 'Operations' },
  { id: 4, label: 'HR' },
];

export const CATEGORIES = [
  { id: 0, label: 'Full-time' },
  { id: 1, label: 'Part-time' },
  { id: 2, label: 'Contractor' },
];

// Types
export interface Employer {
  owner: PublicKey;
  name: string;
  recipientCount: number;
  paymentCount: number;
  createdAt: BN;
  bump: number;
}

export interface Recipient {
  employer: PublicKey;
  wallet: PublicKey;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: BN;
  lastPaymentTimestamp: BN;
  totalPayments: number;
  departmentId: number;
  category: number;
  bump: number;
}

export interface PaymentRecord {
  employer: PublicKey;
  recipient: PublicKey;
  recipientWallet: PublicKey;
  status: { pending?: {} } | { completed?: {} } | { failed?: {} };
  silentswapOrderId: string;
  createdAt: BN;
  updatedAt: BN;
  bump: number;
}

// PDA derivation functions
export function getEmployerPda(owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('employer'), owner.toBuffer()],
    PROGRAM_ID
  );
}

export function getRecipientPda(employer: PublicKey, wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('recipient'), employer.toBuffer(), wallet.toBuffer()],
    PROGRAM_ID
  );
}

export function getPaymentRecordPda(
  employer: PublicKey,
  recipient: PublicKey,
  paymentIndex: number
): [PublicKey, number] {
  const indexBuffer = Buffer.alloc(4);
  indexBuffer.writeUInt32LE(paymentIndex, 0);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('payment'), employer.toBuffer(), recipient.toBuffer(), indexBuffer],
    PROGRAM_ID
  );
}

// Custom hook for payroll program
export function usePayrollProgram() {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a DEVNET connection specifically for program interactions
  const devnetConnection = useMemo(() => {
    return new Connection(DEVNET_RPC_URL, 'confirmed');
  }, []);

  // Create Anchor provider with Devnet connection
  const provider = useMemo(() => {
    if (!publicKey || !signTransaction) return null;
    
    const wallet = {
      publicKey,
      signTransaction,
      signAllTransactions: signAllTransactions || (async (txs: any[]) => {
        const signed = [];
        for (const tx of txs) {
          signed.push(await signTransaction(tx));
        }
        return signed;
      }),
    };

    return new AnchorProvider(devnetConnection, wallet as any, {
      commitment: 'confirmed',
    });
  }, [publicKey, signTransaction, signAllTransactions, devnetConnection]);

  // Create program instance
  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(idlJson as Idl, provider);
  }, [provider]);

  // Get employer account
  const getEmployer = useCallback(async (): Promise<Employer | null> => {
    if (!program || !publicKey) return null;
    
    try {
      const [employerPda] = getEmployerPda(publicKey);
      const account = await (program.account as any).employer.fetch(employerPda);
      return account as Employer;
    } catch (err) {
      // Account doesn't exist
      return null;
    }
  }, [program, publicKey]);

  // Initialize employer account
  const initializeEmployer = useCallback(async (name: string): Promise<string> => {
    if (!program || !publicKey) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [employerPda] = getEmployerPda(publicKey);
      
      const tx = await (program.methods as any)
        .initializeEmployer(name)
        .accounts({
          employer: employerPda,
          owner: publicKey,
          systemProgram: PublicKey.default,
        })
        .rpc();
      
      return tx;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [program, publicKey]);

  // Get all recipients for employer
  const getRecipients = useCallback(async (): Promise<{ publicKey: PublicKey; account: Recipient }[]> => {
    if (!program || !publicKey) return [];
    
    try {
      const [employerPda] = getEmployerPda(publicKey);
      const accounts = await (program.account as any).recipient.all([
        {
          memcmp: {
            offset: 8, // After discriminator
            bytes: employerPda.toBase58(),
          },
        },
      ]);
      return accounts.map((a: any) => ({
        publicKey: a.publicKey,
        account: a.account as Recipient,
      }));
    } catch (err) {
      console.error('Error fetching recipients:', err);
      return [];
    }
  }, [program, publicKey]);

  // Add recipient
  const addRecipient = useCallback(async (
    walletAddress: string,
    name: string,
    role: string,
    departmentId: number = 0,
    category: number = 0
  ): Promise<string> => {
    if (!program || !publicKey) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [employerPda] = getEmployerPda(publicKey);
      const walletPubkey = new PublicKey(walletAddress);
      const [recipientPda] = getRecipientPda(employerPda, walletPubkey);
      
      const tx = await (program.methods as any)
        .addRecipient(name, role, departmentId, category)
        .accounts({
          recipient: recipientPda,
          employer: employerPda,
          wallet: walletPubkey,
          owner: publicKey,
          systemProgram: PublicKey.default,
        })
        .rpc();
      
      return tx;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [program, publicKey]);

  // Update recipient
  const updateRecipient = useCallback(async (
    walletAddress: string,
    name?: string,
    role?: string,
    departmentId?: number,
    category?: number
  ): Promise<string> => {
    if (!program || !publicKey) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [employerPda] = getEmployerPda(publicKey);
      const walletPubkey = new PublicKey(walletAddress);
      const [recipientPda] = getRecipientPda(employerPda, walletPubkey);
      
      const tx = await (program.methods as any)
        .updateRecipient(
          name || null, 
          role || null, 
          departmentId !== undefined ? departmentId : null, 
          category !== undefined ? category : null
        )
        .accounts({
          recipient: recipientPda,
          employer: employerPda,
          owner: publicKey,
        })
        .rpc();
      
      return tx;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [program, publicKey]);

  // Deactivate recipient
  const deactivateRecipient = useCallback(async (walletAddress: string): Promise<string> => {
    if (!program || !publicKey) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [employerPda] = getEmployerPda(publicKey);
      const walletPubkey = new PublicKey(walletAddress);
      const [recipientPda] = getRecipientPda(employerPda, walletPubkey);
      
      const tx = await (program.methods as any)
        .deactivateRecipient()
        .accounts({
          recipient: recipientPda,
          employer: employerPda,
          owner: publicKey,
        })
        .rpc();
      
      return tx;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [program, publicKey]);

  // Create payment record (when initiating SilentSwap payment)
  const createPaymentRecord = useCallback(async (
    recipientWallet: string,
    silentswapOrderId: string
  ): Promise<string> => {
    if (!program || !publicKey) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [employerPda] = getEmployerPda(publicKey);
      const employer = await getEmployer();
      if (!employer) throw new Error('Employer account not found');
      
      const walletPubkey = new PublicKey(recipientWallet);
      const [recipientPda] = getRecipientPda(employerPda, walletPubkey);
      const [paymentRecordPda] = getPaymentRecordPda(
        employerPda,
        recipientPda,
        employer.paymentCount
      );
      
      const tx = await (program.methods as any)
        .createPaymentRecord(silentswapOrderId)
        .accounts({
          paymentRecord: paymentRecordPda,
          employer: employerPda,
          recipient: recipientPda,
          owner: publicKey,
          systemProgram: PublicKey.default,
        })
        .rpc();
      
      return tx;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [program, publicKey, getEmployer]);

  return {
    program,
    provider,
    devnetConnection,
    isLoading,
    error,
    publicKey,
    // Functions
    getEmployer,
    initializeEmployer,
    getRecipients,
    addRecipient,
    updateRecipient,
    deactivateRecipient,
    createPaymentRecord,
  };
}

// Export types for component use
export type RecipientWithKey = { publicKey: PublicKey; account: Recipient };
