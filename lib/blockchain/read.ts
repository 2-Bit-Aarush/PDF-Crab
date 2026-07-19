import { ethers, JsonRpcProvider, Contract, InterfaceAbi } from 'ethers';
import { 
  getMonadConfig, 
  isContractConfigured, 
  getExplorerUrl, 
  getRpcUrl,
  getContractAddress,
  getContractAbi 
} from './config';
import { validateNotebookHash, normalizeHash, type NotebookContent } from './hash';

export interface NotebookProof {
  notebookHash: string;
  owner: string;
  notebookTitle: string;
  timestamp: number;
  transactionHash: string;
  exists: boolean;
}

export interface VerifyProofResult {
  exists: boolean;
  proof?: NotebookProof;
  error?: string;
}

export interface OwnerNotebooksResult {
  notebookHashes: string[];
  error?: string;
}

export interface PublishProofParams {
  notebookHash: string;
  notebookTitle: string;
  transactionHash: string;
}

export interface PublishProofResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

function getReadOnlyProvider(): JsonRpcProvider | null {
  const rpcUrl = getRpcUrl();
  if (!rpcUrl) return null;
  return new JsonRpcProvider(rpcUrl);
}

function getReadOnlyContract(provider?: JsonRpcProvider): Contract | null {
  if (!isContractConfigured()) return null;
  
  const rpcProvider = provider || getReadOnlyProvider();
  if (!rpcProvider) return null;
  
  return new Contract(getContractAddress(), getContractAbi(), rpcProvider);
}

export async function verifyProof(notebookHash: string, provider?: JsonRpcProvider): Promise<VerifyProofResult> {
  if (!validateNotebookHash(notebookHash)) {
    return { exists: false, error: 'Invalid notebook hash format' };
  }

  const contract = getReadOnlyContract(provider);
  if (!contract) {
    return { 
      exists: false, 
      error: 'Contract not configured. Deploy the contract and set NEXT_PUBLIC_NOTEBOOK_PROOF_CONTRACT_ADDRESS.' 
    };
  }

  try {
    const result = await contract.verifyProof(normalizeHash(notebookHash));
    const [exists, proof] = result;

    if (!exists) {
      return { exists: false };
    }

    return {
      exists: true,
      proof: {
        notebookHash: proof.notebookHash,
        owner: proof.owner,
        notebookTitle: proof.notebookTitle,
        timestamp: Number(proof.timestamp),
        transactionHash: proof.transactionHash,
        exists: proof.exists,
      },
    };
  } catch (error) {
    return { 
      exists: false, 
      error: error instanceof Error ? error.message : 'Verification failed' 
    };
  }
}

export async function proofExists(notebookHash: string, provider?: JsonRpcProvider): Promise<boolean> {
  if (!validateNotebookHash(notebookHash)) return false;

  const contract = getReadOnlyContract(provider);
  if (!contract) return false;

  try {
    return await contract.proofExists(normalizeHash(notebookHash));
  } catch {
    return false;
  }
}

export async function getOwnerNotebooks(address: string, provider?: JsonRpcProvider): Promise<OwnerNotebooksResult> {
  const contract = getReadOnlyContract(provider);
  if (!contract) {
    return { notebookHashes: [], error: 'Contract not configured' };
  }

  try {
    const hashes = await contract.getOwnerNotebooks(address);
    return {
      notebookHashes: hashes.map((h: string) => h.startsWith('0x') ? h : `0x${h}`),
    };
  } catch (error) {
    return { 
      notebookHashes: [], 
      error: error instanceof Error ? error.message : 'Failed to fetch owner notebooks' 
    };
  }
}

export async function getProofCount(address: string, provider?: JsonRpcProvider): Promise<number> {
  const contract = getReadOnlyContract(provider);
  if (!contract) return 0;

  try {
    const count = await contract.getProofCount(address);
    return Number(count);
  } catch {
    return 0;
  }
}

export async function getPublishedBlock(notebookHash: string, provider?: JsonRpcProvider): Promise<number> {
  if (!validateNotebookHash(notebookHash)) return 0;

  const contract = getReadOnlyContract(provider);
  if (!contract) return 0;

  try {
    const block = await contract.getPublishedBlock(normalizeHash(notebookHash));
    return Number(block);
  } catch {
    return 0;
  }
}

export function getExplorerUrlForTx(txHash: string): string {
  return getExplorerUrl(txHash);
}

export function isContractDeployed(): boolean {
  return isContractConfigured();
}

export { 
  computeNotebookHash, 
  validateNotebookHash, 
  normalizeHash, 
  formatAddress,
  formatTimestamp,
  type NotebookContent 
} from './hash';
export { 
  isContractConfigured, 
  getExplorerUrl, 
  getRpcUrl, 
  getContractAddress, 
  getContractAbi 
} from './config';
export type { MonadConfig } from './config';