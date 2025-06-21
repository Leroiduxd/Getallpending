import express from "express";
import fetch from "node-fetch";
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Variables d'environnement
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PROOF_API_URL = process.env.PROOF_API_URL;

// ABI minimale
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

// Endpoint API Railway
app.get("/execute", async (req, res) => {
  try {
    // 1. Setup ethers
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    // 2. Appel à l'API de proof
    const response = await fetch(PROOF_API_URL + "/proof");
    const data = await response.json();

    if (!data.proof || !data.proof.startsWith("0x")) {
      return res.status(400).json({ success: false, error: "Invalid proof format" });
    }

    // 3. Exécution du smart contract
    const tx = await contract.executeAllPendingOrders(data.proof);
    await tx.wait();

    res.json({ success: true, txHash: tx.hash });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Lancer le serveur Railway
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}/execute`);
});
