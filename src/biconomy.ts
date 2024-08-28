import { createWalletClient, http, createPublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygonAmoy, baseSepolia } from "viem/chains";
import { createSmartAccountClient } from "@biconomy/account";
import dotenv from 'dotenv';

dotenv.config();

const config = {
  privateKey: process.env.PRIVATE_KEY || '',
  bundlerUrl: process.env.BUNDLER_URL || '',
  baseRpcUrl: process.env.RPC_URL || '',
};

// Ensure the private key has the correct '0x' prefix and is of the correct type
const privateKey = config.privateKey.startsWith('0x') 
  ? (config.privateKey as `0x${string}`) 
  : `0x${config.privateKey}` as `0x${string}`;

// Biconomy Setup: Generate EOA from private key using Viem
const account = privateKeyToAccount(privateKey);
const biconomySigner = createWalletClient({
  account,
  chain: polygonAmoy,
  transport: http(),
});

// Base Sepolia Client Setup
const baseSepoliaClient = createPublicClient({
  chain: baseSepolia,
  transport: http(config.baseRpcUrl),
});

// Create Biconomy Smart Account instance
async function createSmartAccount() {
  try {
    const smartWallet = await createSmartAccountClient({
      signer: biconomySigner,
      bundlerUrl: config.bundlerUrl,
    });

    const saAddress = await smartWallet.getAccountAddress();
    console.log("Smart Account Address:", saAddress);
    return smartWallet;
  } catch (error) {
    console.error("Error creating Smart Account:", error);
    process.exit(1);
  }
}

// Send a transaction
async function sendTransaction(toAddress: string, transactionData: string) {
  try {
    const smartWallet = await createSmartAccount();
    if (!smartWallet) return;

    const tx = {
      to: toAddress,
      data: transactionData,
    };

    const userOpResponse = await smartWallet.sendTransaction(tx);
    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log("Transaction Hash:", transactionHash);

    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success === "true") {
      console.log("UserOp Receipt:", userOpReceipt);
      console.log("Transaction Receipt:", userOpReceipt.receipt);
    }
  } catch (error) {
    console.error("Error sending transaction:", error);
    process.exit(1);
  }
}

// Command-line interface
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: npm run biconomy <command> [args]");
  console.log("Commands:");
  console.log("  create-sa            Create Smart Account");
  console.log("  send-tx <to> <data>  Send transaction to address with data");
  process.exit(0);
}

const command = args[0];

if (command === "create-sa") {
  createSmartAccount();
} else if (command === "send-tx") {
  const [to, data] = args.slice(1);
  if (!to || !data) {
    console.log("Usage: npm run biconomy send-tx <to> <data>");
    process.exit(0);
  }
  sendTransaction(to, data);
} else {
  console.log("Unknown command:", command);
  process.exit(1);
}