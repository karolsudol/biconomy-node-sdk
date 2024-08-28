import dotenv from 'dotenv';

dotenv.config();

export const config = {
  privateKey: process.env.PRIVATE_KEY || '',
  bundlerUrl: process.env.BUNDLER_URL || '',
  baseRpcUrl: process.env.RPC_URL || '',
};
