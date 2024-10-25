import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

describe("Swap", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deploySwap() {
        const [owner] = await ethers.getSigners();
        const OldToken = await ethers.getContractFactory("OldToken");
        const oldToken = await OldToken.deploy();

        const Swap = await ethers.getContractFactory("Swap");
        const swap = await Swap.deploy(oldToken.target);

        const AIRDROP = process.env.AIRDROP_ADDRESS!;
        const GRANTS = process.env.GRANTS_ADDRESS!;
        const LIQUID = process.env.LIQUID_ADDRESS!;
        const TREASURY = process.env.TREASURY_ADDRESS!;

        const POOL = swap.target;

        const NewToken = await ethers.getContractFactory("LadysToken");
        const newToken = await NewToken.deploy(
            POOL,
            AIRDROP,
            GRANTS,
            LIQUID,
            TREASURY
        );

        return {
            oldToken,
            newToken,
            swap,
            owner,
            Swap,
        };
    }

    describe("Deployment", function () {
        it("Should set correct old token address", async function () {
            const { swap, oldToken } = await loadFixture(deploySwap);

            expect(await swap.oldToken()).to.equal(oldToken.target);
        });

        it("Should set the right owner", async function () {
            const { swap, owner } = await loadFixture(deploySwap);

            expect(await swap.owner()).to.equal(owner.address);
        });

        it("Should fail if deploy swap with old token equal zero address", async function () {
            const { Swap } = await loadFixture(deploySwap);

            await expect(Swap.deploy(ethers.ZeroAddress)).to.be.reverted;
        });
    });

    describe("Set old token", function () {
        it("Should set old token", async function () {
            const wallet = ethers.Wallet.createRandom();

            const { swap } = await loadFixture(deploySwap);
            await swap.setOldToken(wallet.address);

            expect(await swap.oldToken()).to.equal(wallet.address);
        });

        it("Should fail if not owner call set old token", async function () {
            const [, sb] = await ethers.getSigners();
            const wallet = ethers.Wallet.createRandom();

            const { swap } = await loadFixture(deploySwap);

            await expect(swap.connect(sb).setOldToken(wallet.address)).to.be
                .reverted;
        });

        it("Should fail if old token is zero address", async function () {
            const { swap } = await loadFixture(deploySwap);
            await expect(
                swap.setOldToken(ethers.ZeroAddress)
            ).to.be.revertedWith("Zero address");
        });
    });

    describe("Set new token", function () {
        it("Should set new token", async function () {
            const wallet = ethers.Wallet.createRandom();

            const { swap } = await loadFixture(deploySwap);
            await swap.setNewToken(wallet.address);

            expect(await swap.newToken()).to.equal(wallet.address);
        });

        it("Should fail if not owner call set new token", async function () {
            const [, sb] = await ethers.getSigners();
            const wallet = ethers.Wallet.createRandom();

            const { swap } = await loadFixture(deploySwap);

            await expect(swap.connect(sb).setNewToken(wallet.address)).to.be
                .reverted;
        });

        it("Should fail if new token is zero address", async function () {
            const { swap } = await loadFixture(deploySwap);
            await expect(
                swap.setNewToken(ethers.ZeroAddress)
            ).to.be.revertedWith("Zero address");
        });
    });

    describe("Withdraw token", function () {
        it("Should withdraw token", async function () {
            const { swap, newToken, owner } = await loadFixture(deploySwap);
            const preBalance = await newToken.balanceOf(owner.address);
            const poolBalance = await newToken.balanceOf(swap.target);

            await swap.withdrawToken(newToken.target);
            const postBalance = await newToken.balanceOf(owner.address);

            expect(preBalance + poolBalance).to.equal(postBalance);
        });

        it("Should fail if not owner call withdraw", async function () {
            const [, sb] = await ethers.getSigners();
            const { swap, newToken } = await loadFixture(deploySwap);

            await expect(swap.connect(sb).withdrawToken(newToken.target)).to.be
                .reverted;
        });
    });

    describe("Swap token", function () {
        it("Should swap token", async function () {
            const { swap, newToken, owner, oldToken } =
                await loadFixture(deploySwap);
            const swapAmount = ethers.parseEther("3");

            const preBalanceOldToken = await oldToken.balanceOf(owner.address);
            const preBalanceNewToken = await newToken.balanceOf(owner.address);

            await oldToken.approve(swap.target, swapAmount);
            await swap.swap(swapAmount);

            const postBalanceOldToken = await oldToken.balanceOf(owner.address);
            const postBalanceNewToken = await newToken.balanceOf(owner.address);

            expect(postBalanceOldToken - preBalanceOldToken).to.equal(
                swapAmount
            );
            expect(preBalanceNewToken + swapAmount).to.equal(
                postBalanceNewToken
            );
        });
    });
});
