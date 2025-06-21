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

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

app.get("/execute-all", async (req, res) => {
  try {
    const response = await fetch(PROOF_API_URL);
    const data = await response.json();
    const tx = await contract.executeAllPendingOrders(data.proof);
    await tx.wait();
    res.send({ success: true, txHash: tx.hash });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
