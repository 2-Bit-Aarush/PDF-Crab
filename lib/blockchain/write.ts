'use client';

import { ethers, BrowserProvider, Contract } from 'ethers';
import { 
  getMonadConfig, 
  isContractConfigured, 
  getExplorerUrl, 
  getRpcUrl,
  getContractAddress,
  getContractAbi 
} from './config';
import { 
  validateNotebookHash, 
  normalizeHash,
  type NotebookContent 
} from './hash';
import type { 
  NotebookProof, 
  VerifyProofResult, 
  OwnerNotebooksResult,
  PublishProofParams,
  PublishProofResult 
} from './read';

export interface WalletState {
  connected: boolean;
  address: string | null;
  chainId: number | null;
}

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider;
  }
}

function getConfig() {
  return getMonadConfig();
}

export async function connectWallet(): Promise<{ address: string; chainId: number } | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet provider found. Please install MetaMask or a compatible wallet.');
  }

  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send('eth_requestAccounts', []);
  
  if (accounts.length === 0) {
    throw new Error('No accounts found');
  }

  const network = await provider.getNetwork();
  return {
    address: accounts[0],
    chainId: Number(network.chainId),
  };
}

export async function getConnectedAccount(): Promise<string | null> {
  if (typeof window === 'undefined' || !window.ethereum) return null;

  try {
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.listAccounts();
    if (accounts.length > 0) {
      return accounts[0].address;
    }
    return null;
  } catch {
    return null;
  }
}

export async function switchToMonadNetwork(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) return false;

  const config = getConfig();
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${config.chainId.toString(16)}` }],
    });
    return true;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${config.chainId.toString(16)}`,
            chainName: 'Monad Testnet',
            nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
            rpcUrls: [config.rpcUrl],
            blockExplorerUrls: [config.explorerUrl],
          }],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

export async function publishProof(
  params: { notebookHash: string; notebookTitle: string; transactionHash: string },
  onTxHash?: (hash: string) => void
): Promise<PublishProofResult> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return { success: false, error: 'No wallet provider found' };
  }

  if (!isContractConfigured()) {
    return { success: false, error: 'Contract not configured' };
  }

  if (!validateNotebookHash(params.notebookHash)) {
    return { success: false, error: 'Invalid notebook hash format' };
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    const contract = new Contract(getContractAddress(), getContractAbi(), signer);
    
    const tx = await contract.publishProof(
      normalizeHash(params.notebookHash),
      params.notebookTitle,
      params.transactionHash
    );
    
    if (onTxHash) onTxHash(tx.hash);
    
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt?.hash || tx.hash,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
    
    if (errorMessage.includes('user rejected') || errorMessage.includes('User rejected')) {
      return { success: false, error: 'Transaction rejected by user' };
    }
    if (errorMessage.includes('insufficient funds')) {
      return { success: false, error: 'Insufficient funds for transaction' };
    }
    if (errorMessage.includes('already published') || errorMessage.includes('Only owner can update')) {
      return { success: false, error: 'This notebook has already been published by another account' };
    }
    
    return { success: false, error: errorMessage };
  }
}

export async function computeNotebookHash(content: NotebookContent): Promise<string> {
  const { computeNotebookHash: computeHash } = await import('./hash');
  return computeHash(content);
}