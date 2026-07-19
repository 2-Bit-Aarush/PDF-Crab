import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("NotebookProofModule", (m) => {
  const notebookProof = m.contract("NotebookProof");

  return { notebookProof };
});