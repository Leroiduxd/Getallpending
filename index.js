import express from "express";
import fetch from "node-fetch";
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// .env variables
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PROOF_API_URL = process.env.PROOF_API_URL;

const ABI = [
  {
    "inputs": [
      { "internalType": "bytes", "name": "proof", "type": "bytes" }
    ],
    "name": "executeAllPendingOrders",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

app.get("/execute", async (req, res) => {
  try {
    // Setup signer
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    // GET real proof from API
    const proofResponse = await fetch(PROOF_API_URL + "/proof");
    const proofData = await proofResponse.json();

    if (!proofData.proof || !proofData.proof.startsWith("0x")) {
      return res.status(400).json({ success: false, error: "Invalid proof from API" });
    }

    // Call the contract
    const tx = await contract.executeAllPendingOrders(proofData.proof);
    await tx.wait();

    return res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}/execute`);
});

