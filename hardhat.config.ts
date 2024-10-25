import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const privateKey = process.env.PRIVATE_KEY;

const config: HardhatUserConfig = {
    solidity: "0.8.24",
    networks: {
        ganache: {
            accounts: [privateKey!],
            chainId: 1337,
            url: "http://localhost:8545",
        },
        base: {
            accounts: [privateKey!],
            chainId: 84532,
            url: "https://sepolia.base.org",
        },
        sepolia: {
            accounts: [privateKey!],
            chainId: 11155111,
            url: "https://rpc.sepolia.org",
        },
    },
};

export default config;
