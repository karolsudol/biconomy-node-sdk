import { ethers } from 'ethers';
import { createSmartAccountClient } from '@biconomy/account';
import { config } from './config';

// Initialize provider and signer
let provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
let signer = new ethers.Wallet(config.privateKey, provider);

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
  }
}

// Send a transaction
async function sendTransaction(smartWallet: any, toAddress: string, transactionData: string) {
  try {
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
  }
}

// Main function to execute the steps
async function main() {
  const smartWallet = await createSmartAccount();
  if (!smartWallet) return;

  const toAddress = '0xaddress'; // Replace with the recipient's address
  const transactionData = '0x123'; // Replace with actual transaction data

  await sendTransaction(smartWallet, toAddress, transactionData);
}

main();





// import http from 'http';

// const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
//   res.end('Hello, World!\n');
// });

// const port = 3000;
// server.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}/`);
// });
