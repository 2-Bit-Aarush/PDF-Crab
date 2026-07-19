// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title NotebookProof
/// @dev Simple, gas-efficient smart contract for storing cryptographic proofs of PDF-Crab Master Notebooks on Monad.
/// Only stores metadata and SHA-256 hash of notebook content. Never stores actual content on-chain.
contract NotebookProof {
    /// @notice Emitted when a new notebook proof is published
    event NotebookProofPublished(
        bytes32 indexed notebookHash,
        address indexed owner,
        string notebookTitle,
        uint256 timestamp,
        string transactionHash
    );

    /// @notice Emitted when a notebook proof is updated (re-published)
    event NotebookProofUpdated(
        bytes32 indexed notebookHash,
        address indexed owner,
        string notebookTitle,
        uint256 timestamp,
        string transactionHash
    );

    /// @notice Notebook proof data structure
    struct ProofData {
        bytes32 notebookHash;
        address owner;
        string notebookTitle;
        uint256 timestamp;
        string transactionHash;
        bool exists;
    }

    /// @notice Mapping from notebook hash to proof data
    mapping(bytes32 => ProofData) public proofs;

    /// @notice Mapping from owner address to array of notebook hashes they own
    mapping(address => bytes32[]) public ownerNotebooks;

    /// @notice Mapping from notebook hash to block number when published
    mapping(bytes32 => uint256) public publishedAtBlock;

    /// @notice Publish a cryptographic proof of a notebook on-chain
    /// @param notebookHash SHA-256 hash of the notebook content (32 bytes)
    /// @param notebookTitle Title of the notebook (stored on-chain for reference)
    /// @param transactionHash Transaction hash that triggered this publication (for verification)
    function publishProof(
        bytes32 notebookHash,
        string calldata notebookTitle,
        string calldata transactionHash
    ) external {
        require(notebookHash != bytes32(0), "Notebook hash cannot be zero");
        require(bytes(notebookTitle).length > 0, "Notebook title cannot be empty");
        require(bytes(transactionHash).length > 0, "Transaction hash cannot be empty");

        address owner = msg.sender;
        uint256 timestamp = block.timestamp;
        uint256 blockNumber = block.number;

        ProofData storage proof = proofs[notebookHash];

        if (proof.exists) {
            // Update existing proof (only owner can update)
            require(proof.owner == owner, "Only owner can update proof");
            
            proof.notebookTitle = notebookTitle;
            proof.timestamp = timestamp;
            proof.transactionHash = transactionHash;
            publishedAtBlock[notebookHash] = blockNumber;

            emit NotebookProofUpdated(notebookHash, owner, notebookTitle, timestamp, transactionHash);
        } else {
            // Create new proof - assign each field individually
            proof.notebookHash = notebookHash;
            proof.owner = owner;
            proof.notebookTitle = notebookTitle;
            proof.timestamp = timestamp;
            proof.transactionHash = transactionHash;
            proof.exists = true;

            ownerNotebooks[owner].push(notebookHash);
            publishedAtBlock[notebookHash] = blockNumber;

            emit NotebookProofPublished(notebookHash, owner, notebookTitle, timestamp, transactionHash);
        }
    }

    /// @notice Verify if a notebook proof exists on-chain
    /// @param notebookHash SHA-256 hash of the notebook content to verify
    /// @return exists Whether the proof exists
    /// @return proof The proof data if it exists
    function verifyProof(bytes32 notebookHash) external view returns (bool exists, ProofData memory proof) {
        ProofData storage storageProof = proofs[notebookHash];
        exists = storageProof.exists;
        proof.notebookHash = storageProof.notebookHash;
        proof.owner = storageProof.owner;
        proof.notebookTitle = storageProof.notebookTitle;
        proof.timestamp = storageProof.timestamp;
        proof.transactionHash = storageProof.transactionHash;
        proof.exists = storageProof.exists;
    }

    /// @notice Get all notebook hashes owned by an address
    /// @param owner Address to query
    /// @return Array of notebook hashes owned by the address
    function getOwnerNotebooks(address owner) external view returns (bytes32[] memory) {
        return ownerNotebooks[owner];
    }

    /// @notice Get the block number when a proof was published
    /// @param notebookHash SHA-256 hash of the notebook
    /// @return Block number when published (0 if not published)
    function getPublishedBlock(bytes32 notebookHash) external view returns (uint256) {
        return publishedAtBlock[notebookHash];
    }

    /// @notice Check if a proof exists for a given hash
    /// @param notebookHash SHA-256 hash to check
    /// @return True if proof exists, false otherwise
    function proofExists(bytes32 notebookHash) external view returns (bool) {
        return proofs[notebookHash].exists;
    }

    /// @notice Get total number of proofs published by an address
    /// @param owner Address to query
    /// @return Count of proofs owned
    function getProofCount(address owner) external view returns (uint256) {
        return ownerNotebooks[owner].length;
    }
}