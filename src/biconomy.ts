import { Hex, createWalletClient, http, createPublicClient, parseAbi, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { createSmartAccountClient, PaymasterMode } from "@biconomy/account";
import dotenv from 'dotenv';

dotenv.config();

const config = {
  privateKey: process.env.PRIVATE_KEY || '',
  biconomyPaymasterApiKey: process.env.BICONOMY_PAYMASTER_API_KEY || '',
  bundlerUrl: process.env.BUNDLER_URL || '',
  baseRpcUrl: process.env.RPC_URL || '',
  nftAddress: "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e", 
  erc20Address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};

// Ensure the private key has the correct '0x' prefix and is of the correct type
const privateKey = config.privateKey.startsWith('0x') 
  ? (config.privateKey as `0x${string}`) 
  : `0x${config.privateKey}` as `0x${string}`;

// Biconomy Setup: Generate EOA from private key using Viem
const account = privateKeyToAccount(privateKey);
const biconomySigner = createWalletClient({
  account,
  chain: baseSepolia,
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
      biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
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

async function getSmartAccount() {
  try {
    const smartWallet = await createSmartAccount();
    if (!smartWallet) return;

    const saAddress = await smartWallet.getAccountAddress();
    console.log("Smart Account Address:", saAddress);

    return smartWallet;
  } catch (error) {
    console.error("Error creating Smart Account:", error);
    process.exit(1);
  }
}

// Send a transaction to mint NFT
async function sendTransaction(toAddress: string) {
  try {
    const smartWallet = await createSmartAccount();
    if (!smartWallet) return;

    const saAddress = await smartWallet.getAccountAddress();

    // Mint NFT Transaction
    const parsedAbi = parseAbi(["function safeMint(address _to)"]);
    const nftData = encodeFunctionData({
      abi: parsedAbi,
      functionName: "safeMint",
      args: [saAddress as Hex],
    });

    const tx = {
      to: config.nftAddress,
      data: nftData,
    };

    const userOpResponse = await smartWallet.sendTransaction(tx);
    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log("Transaction Hash:", transactionHash);

    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success === "true") {
      console.log("UserOp Receipt:", userOpReceipt);
      console.log("Transaction Receipt:", userOpReceipt.receipt);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Transaction Error:", error.message);
    }
  }
}

// Send a gasless transaction using Biconomy Paymaster
async function sendGaslessTransaction(toAddress: string, transactionData: string) {
  try {
    const smartWallet = await createSmartAccount();
    if (!smartWallet) return;

    const tx = {
      to: toAddress,
      data: transactionData,
    };

    // Send the transaction with Paymaster mode SPONSORED
    const userOpResponse = await smartWallet.sendTransaction(tx, {
      paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });
    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log("Gasless Transaction Hash:", transactionHash);

    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success === "true") {
      console.log("Gasless UserOp Receipt:", userOpReceipt);
      console.log("Gasless Transaction Receipt:", userOpReceipt.receipt);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Gasless Transaction Error:", error.message);
    }
  }
}

// Send a gasless ERC20 token transfer (e.g., USDC)
async function sendGaslessERC20(toAddress: string, amount: string) {
  try {
    const smartWallet = await createSmartAccount();
    if (!smartWallet) return;

    // Ensure the toAddress starts with '0x'
    const formattedAddress = toAddress.startsWith('0x') ? toAddress as `0x${string}` : `0x${toAddress}` as `0x${string}`;

    // Convert amount to bigint (1 USDC = 1 * 10^6 units)
    const amountBigInt = BigInt(amount);

    // Encode ERC20 transfer function data
    const parsedAbi = parseAbi(["function transfer(address to, uint256 value)"]);
    const transactionData = encodeFunctionData({
      abi: parsedAbi,
      functionName: "transfer",
      args: [formattedAddress, amountBigInt],
    });

    const tx = {
      to: config.erc20Address, // Your USDC contract address
      data: transactionData,
    };

    // Send gasless transaction using Biconomy Paymaster
    const userOpResponse = await smartWallet.sendTransaction(tx, {
      paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });

    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log("Gasless ERC20 Transfer Transaction Hash:", transactionHash);

    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success === "true") {
      console.log("Gasless ERC20 Transfer Receipt:", userOpReceipt);
      console.log("Transaction Receipt:", userOpReceipt.receipt);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Gasless ERC20 Transfer Error:", error.message);

      // Additional error logging for debugging
      if (error.message.includes('getPaymasterAndData')) {
        console.error("Ensure your Biconomy Paymaster is properly configured and associated with the correct network.");
      }
    }
  }
}




// Send a gasless NFT mint transaction
async function sendGaslessNFTMint(toAddress: string) {
  try {
    const smartWallet = await createSmartAccount();
    if (!smartWallet) return;

    const formattedAddress = toAddress.startsWith('0x') ? toAddress as `0x${string}` : `0x${toAddress}` as `0x${string}`;

    // Encode NFT mint function data
    const parsedAbi = parseAbi(["function safeMint(address _to)"]);
    const nftData = encodeFunctionData({
      abi: parsedAbi,
      functionName: "safeMint",
      args: [formattedAddress],
    });

    const tx = {
      to: config.nftAddress,
      data: nftData,
    };

    // Send gasless transaction using Biconomy Paymaster
    const userOpResponse = await smartWallet.sendTransaction(tx, {
      paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });
    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log("Gasless NFT Mint Transaction Hash:", transactionHash);

    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success === "true") {
      console.log("Gasless NFT Mint Receipt:", userOpReceipt);
      console.log("Transaction Receipt:", userOpReceipt.receipt);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Gasless NFT Mint Error:", error.message);
    }
  }
}

// Command-line interface
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: npm run biconomy <command> [args]");
  console.log("Commands:");
  console.log("  create-sa                        Create Smart Account");
  console.log("  send-gasless-erc20 <to> <amount> Send gasless ERC20 token transfer");
  console.log("  send-gasless-nft <to>            Send gasless NFT mint transaction");
  process.exit(0);
}

const command = args[0];

if (command === "create-sa") {
  createSmartAccount();
} else if (command === "send-gasless-erc20") {
  const [to, amount] = args.slice(1);
  if (!to || !amount) {
    console.log("Usage: npm run biconomy send-gasless-erc20 <to> <amount>");
    process.exit(0);
  }
  sendGaslessERC20(to, amount);
} else if (command === "send-gasless-nft") {
  const [to] = args.slice(1);
  if (!to) {
    console.log("Usage: npm run biconomy send-gasless-nft <to>");
    process.exit(0);
  }
  sendGaslessNFTMint(to);
} else {
  console.log("Unknown command:", command);
  process.exit(1);
}
