import { ethers, InterfaceAbi } from 'ethers';

export interface MonadConfig {
  rpcUrl: string;
  chainId: number;
  explorerUrl: string;
  contractAddress: string;
  contractAbi: InterfaceAbi;
}

export function getMonadConfig(): MonadConfig {
  const rpcUrl = process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
  const chainId = parseInt(process.env.NEXT_PUBLIC_MONAD_CHAIN_ID || '10143', 10);
  const explorerUrl = process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL || 'https://testnet.monadexplorer.com';
  const contractAddress = process.env.NEXT_PUBLIC_NOTEBOOK_PROOF_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

  const contractAbi: InterfaceAbi = [
    'event NotebookProofPublished(bytes32 indexed notebookHash, address indexed owner, string notebookTitle, uint256 timestamp, string transactionHash)',
    'event NotebookProofUpdated(bytes32 indexed notebookHash, address indexed owner, string notebookTitle, uint256 timestamp, string transactionHash)',
    'function publishProof(bytes32 notebookHash, string calldata notebookTitle, string calldata transactionHash) external',
    'function verifyProof(bytes32 notebookHash) external view returns (bool exists, tuple(bytes32 notebookHash, address owner, string notebookTitle, uint256 timestamp, string transactionHash, bool exists) proof)',
    'function getOwnerNotebooks(address owner) external view returns (bytes32[] memory)',
    'function getPublishedBlock(bytes32 notebookHash) external view returns (uint256)',
    'function proofExists(bytes32 notebookHash) external view returns (bool)',
    'function getProofCount(address owner) external view returns (uint256)',
  ];

  return {
    rpcUrl,
    chainId,
    explorerUrl,
    contractAddress,
    contractAbi,
  };
}

export function isContractConfigured(): boolean {
  const config = getMonadConfig();
  return config.contractAddress !== '0x0000000000000000000000000000000000000000' && config.contractAddress !== '';
}

export function getExplorerUrl(txHash: string): string {
  const config = getMonadConfig();
  return `${config.explorerUrl}/tx/${txHash}`;
}

export function getContractExplorerUrl(address: string): string {
  const config = getMonadConfig();
  return `${config.explorerUrl}/address/${address}`;
}

export function getRpcUrl(): string {
  return getMonadConfig().rpcUrl;
}

export function getChainId(): number {
  return getMonadConfig().chainId;
}

export function getContractAddress(): string {
  return getMonadConfig().contractAddress;
}

export function getContractAbi(): InterfaceAbi {
  return getMonadConfig().contractAbi;
}