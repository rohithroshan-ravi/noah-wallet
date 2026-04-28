import { ethers } from "ethers";
import type { EvmNetwork } from "../../../src/shared/networks";

const ERC20_ABI = [
  "function transfer(address to, uint256 value) returns (bool)",
  "function decimals() view returns (uint8)"
];

export function getProvider(network: EvmNetwork) {
  return new ethers.JsonRpcProvider(network.rpcUrls[0]);
}

export async function getNativeBalance(address: string, network: EvmNetwork) {
  const provider = getProvider(network);
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

export async function estimateNativeTransfer(
  privateKey: string,
  network: EvmNetwork,
  to: string,
  amountEth: string
) {
  const provider = getProvider(network);
  const wallet = new ethers.Wallet(privateKey, provider);
  const tx = {
    to,
    value: ethers.parseEther(amountEth)
  };

  const gasLimit = await provider.estimateGas({ ...tx, from: wallet.address });
  const feeData = await provider.getFeeData();

  return {
    gasLimit: gasLimit.toString(),
    gasPrice: feeData.gasPrice?.toString() || null,
    maxFeePerGas: feeData.maxFeePerGas?.toString() || null,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() || null
  };
}

export async function sendNativeTransfer(
  privateKey: string,
  network: EvmNetwork,
  to: string,
  amountEth: string
) {
  const provider = getProvider(network);
  const wallet = new ethers.Wallet(privateKey, provider);
  const tx = await wallet.sendTransaction({
    to,
    value: ethers.parseEther(amountEth)
  });
  return tx.hash;
}

export async function sendErc20Transfer(
  privateKey: string,
  network: EvmNetwork,
  tokenAddress: string,
  to: string,
  amount: string,
  decimals: number
) {
  const provider = getProvider(network);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
  const tx = await contract.transfer(to, ethers.parseUnits(amount, decimals));
  return tx.hash as string;
}
