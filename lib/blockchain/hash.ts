export interface NotebookContent {
  title: string;
  sections: Array<{
    heading: string;
    body: string;
    metadata?: Record<string, unknown>;
  }>;
  sources?: Array<{
    id: string;
    name: string;
    pages: number;
  }>;
  coverage?: number;
  generatedAt?: string;
}

export function serializeNotebookContent(content: NotebookContent): string {
  return JSON.stringify(content, Object.keys(content).sort());
}

async function sha256(message: string | Uint8Array): Promise<string> {
  const msgBuffer = typeof message === 'string' 
    ? new TextEncoder().encode(message) 
    : message;
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeNotebookHash(content: NotebookContent): Promise<string> {
  const serialized = serializeNotebookContent(content);
  return sha256(serialized);
}

export async function computeBufferHash(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  return sha256(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer));
}

export async function computeStringHash(str: string): Promise<string> {
  return sha256(str);
}

export function hexToBytes32(hex: string): `0x${string}` {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (cleanHex.length !== 64) {
    throw new Error(`Invalid hex length for bytes32: expected 64 chars, got ${cleanHex.length}`);
  }
  return `0x${cleanHex}` as `0x${string}`;
}

export function bytes32ToHex(bytes32: `0x${string}`): string {
  return bytes32.startsWith('0x') ? bytes32.slice(2) : bytes32;
}

export function normalizeHash(hash: string): string {
  return hash.startsWith('0x') ? hash : `0x${hash}`;
}

export function validateNotebookHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash) || /^[a-fA-F0-9]{64}$/.test(hash);
}

export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}