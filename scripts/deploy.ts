import { network } from "hardhat";

async function main() {
  const networkName = "monadTestnet";
  const { ethers } = await network.create({
    network: networkName,
    chainType: "l1",
  });

  console.log(`Deploying to network: ${networkName} (chain type: L1)`);

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "MON");

  const NotebookProof = await ethers.getContractFactory("NotebookProof");
  console.log("Deploying NotebookProof...");

  const notebookProof = await NotebookProof.deploy();
  await notebookProof.waitForDeployment();

  const contractAddress = await notebookProof.getAddress();
  const deployTx = notebookProof.deploymentTransaction();

  console.log("\n=== Deployment Successful ===");
  console.log("Contract address:", contractAddress);
  console.log("Transaction hash:", deployTx?.hash);
  console.log("Deployer address:", deployer.address);
  console.log("Network:", networkName);
  console.log("=============================\n");

  // Verify contract is accessible
  const code = await ethers.provider.getCode(contractAddress);
  if (code === "0x") {
    throw new Error("Contract deployment failed - no code at address");
  }
  console.log("Contract code verified at address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });