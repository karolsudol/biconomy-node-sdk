import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import { createSmartAccountClient } from '@biconomy/account';
import { config } from './config';

// Initialize provider and signer
let provider = new JsonRpcProvider(config.rpcUrl);
let signer = new Wallet(config.privateKey, provider);

// Create Biconomy Smart Account instance
async function createSmartAccount() {
  try {
    const smartWallet = await createSmartAccountClient({
      signer,
      bundlerUrl: config.bundlerUrl,
    });

    const saAddress = await smartWallet.getAccountAddress();
    console.log('Smart Account Address:', saAddress);
    return smartWallet;
  } catch (error) {
    console.error('Error creating Smart Account:', error);
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
    console.log('Transaction Hash:', transactionHash);

    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success === 'true') {
      console.log('UserOp Receipt:', userOpReceipt);
      console.log('Transaction Receipt:', userOpReceipt.receipt);
    }
  } catch (error) {
    console.error('Error sending transaction:', error);
    process.exit(1);
  }
}

// Command-line interface
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: npm run biconomy <command> [args]');
  console.log('Commands:');
  console.log('  create-sa            Create Smart Account');
  console.log('  send-tx <to> <data>  Send transaction to address with data');
  process.exit(0);
}

const command = args[0];

if (command === 'create-sa') {
  createSmartAccount();
} else if (command === 'send-tx') {
  const [to, data] = args.slice(1);
  if (!to || !data) {
    console.log('Usage: npm run biconomy send-tx <to> <data>');
    process.exit(0);
  }
  sendTransaction(to, data);
} else {
  console.log('Unknown command:', command);
  process.exit(1);
}
