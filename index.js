
import express from "express";
import fetch from "node-fetch";
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PROOF_API_URL = process.env.PROOF_API_URL;

const ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "proof",
        "type": "bytes"
      }
    ],
    "name": "executeAllPendingOrders",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

app.get("/execute", async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    const response = await fetch(PROOF_API_URL + "/proof");
    const data = await response.json();

    if (!data.proof || typeof data.proof !== "string" || !data.proof.startsWith("0x")) {
      return res.status(400).json({ success: false, error: "Invalid proof format received from API." });
    }

    const proofBytes = ethers.getBytes(data.proof);
    const tx = await contract.executeAllPendingOrders(proofBytes);
    await tx.wait();

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error("Execution error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`✅ Server ready on http://localhost:${port}/execute`);
});
