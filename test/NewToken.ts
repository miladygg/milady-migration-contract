import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

describe("LadysToken", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployNewTokenFixture() {
        const [owner] = await ethers.getSigners();

        const AIRDROP = process.env.AIRDROP_ADDRESS!;
        const GRANTS = process.env.GRANTS_ADDRESS!;
        const LIQUID = process.env.LIQUID_ADDRESS!;
        const TREASURY = process.env.TREASURY_ADDRESS!;

        const POOL = owner.address;

        const LadysToken = await ethers.getContractFactory("LadysToken");
        const ladysToken = await LadysToken.deploy(
            POOL,
            AIRDROP,
            GRANTS,
            LIQUID,
            TREASURY
        );

        return {
            AIRDROP,
            GRANTS,
            LIQUID,
            TREASURY,
            POOL,
            LadysToken,
            ladysToken,
            owner,
        };
    }

    describe("Deployment", function () {
        it("Should mint enough token for Public addresses", async function () {
            const { AIRDROP, GRANTS, LIQUID, TREASURY, POOL, ladysToken } =
                await loadFixture(deployNewTokenFixture);

            const poolAmount = ethers.parseEther("834720834720835");
            const airdropAmount = ethers.parseEther("253500000000000");
            const grantAmount = ethers.parseEther("316169165279165");
            const liquidAmount = ethers.parseEther("169000000000000");
            const treasuryAmount = ethers.parseEther("116610000000000");

            expect(await ladysToken.balanceOf(POOL)).to.equal(poolAmount);
            expect(await ladysToken.balanceOf(AIRDROP)).to.equal(airdropAmount);
            expect(await ladysToken.balanceOf(GRANTS)).to.equal(grantAmount);
            expect(await ladysToken.balanceOf(LIQUID)).to.equal(liquidAmount);
            expect(await ladysToken.balanceOf(TREASURY)).to.equal(
                treasuryAmount
            );
        });

        it("Should set the right owner", async function () {
            const { ladysToken, owner } = await loadFixture(
                deployNewTokenFixture
            );

            expect(await ladysToken.owner()).to.equal(owner.address);
        });

        it("Should fail if any public addresses is zero address", async function () {
            const { LadysToken, GRANTS, LIQUID, POOL, TREASURY } =
                await loadFixture(deployNewTokenFixture);

            await expect(
                LadysToken.deploy(
                    POOL,
                    ethers.ZeroAddress,
                    GRANTS,
                    LIQUID,
                    TREASURY
                )
            ).to.be.reverted;
        });
    });

    describe("Blacklist", function () {
        it("Should blacklist user", async function () {
            const sb = ethers.Wallet.createRandom();

            const { ladysToken } = await loadFixture(deployNewTokenFixture);
            await ladysToken.blacklist(sb.address, true);

            expect(await ladysToken.blacklists(sb.address)).to.true;
        });

        it("Should not blacklist user", async function () {
            const sb = ethers.Wallet.createRandom();

            const { ladysToken } = await loadFixture(deployNewTokenFixture);
            await ladysToken.blacklist(sb.address, false);

            expect(await ladysToken.blacklists(sb.address)).to.false;
        });

        it("Should fail if not owner call blacklist", async function () {
            const [, sb] = await ethers.getSigners();

            const { ladysToken } = await loadFixture(deployNewTokenFixture);

            await expect(ladysToken.connect(sb).blacklist(sb.address, false)).to
                .be.reverted;
        });

        it("Should fail if blacklist zero address", async function () {
            const { ladysToken } = await loadFixture(deployNewTokenFixture);
            await expect(
                ladysToken.blacklist(ethers.ZeroAddress, true)
            ).to.be.revertedWith("Zero Address");
        });

        it("Should fail if transfer blacklist address", async function () {
            const sb = ethers.Wallet.createRandom();
            const { ladysToken } = await loadFixture(deployNewTokenFixture);
            await ladysToken.blacklist(sb.address, true);

            await expect(
                ladysToken.transfer(sb.address, ethers.parseEther("1"))
            ).to.be.revertedWith("Blacklisted");
        });
    });

    describe("Set rule", function () {
        it("Should set correct rule", async function () {
            const { ladysToken } = await loadFixture(deployNewTokenFixture);
            const maxHoldingAmount = ethers.parseEther("100");
            const minHoldingAmount = ethers.parseEther("1");

            await ladysToken.setRule(
                true,
                ethers.ZeroAddress,
                maxHoldingAmount,
                minHoldingAmount
            );

            expect(await ladysToken.maxHoldingAmount()).equal(maxHoldingAmount);
            expect(await ladysToken.minHoldingAmount()).equal(minHoldingAmount);
            expect(await ladysToken.limited()).equal(true);
        });

        it("Should fail set rule when max holding amount less than min holding amount", async function () {
            const { ladysToken } = await loadFixture(deployNewTokenFixture);
            const maxHoldingAmount = ethers.parseEther("1");
            const minHoldingAmount = ethers.parseEther("100");

            await expect(
                ladysToken.setRule(
                    true,
                    ethers.ZeroAddress,
                    maxHoldingAmount,
                    minHoldingAmount
                )
            ).to.be.revertedWith("Holding amount");
        });

        it("Should fail if not owner call set rule", async function () {
            const [, sb] = await ethers.getSigners();

            const { ladysToken } = await loadFixture(deployNewTokenFixture);
            const maxHoldingAmount = ethers.parseEther("1");
            const minHoldingAmount = ethers.parseEther("100");

            await expect(
                ladysToken
                    .connect(sb)
                    .setRule(
                        true,
                        ethers.ZeroAddress,
                        maxHoldingAmount,
                        minHoldingAmount
                    )
            ).to.be.rejected;
        });

        it("Should fail if holding exceed rule", async function () {
            const [, sb] = await ethers.getSigners();

            const { ladysToken, owner } = await loadFixture(
                deployNewTokenFixture
            );
            const maxHoldingAmount = ethers.parseEther("1");
            const minHoldingAmount = ethers.parseEther("0");

            await ladysToken.setRule(
                true,
                owner.address,
                maxHoldingAmount,
                minHoldingAmount
            );

            await expect(
                ladysToken.transfer(sb.address, ethers.parseEther("2"))
            ).to.be.rejected;
        });
    });

    describe("Burn", function () {
        it("Should burn", async function () {
            const { ladysToken, owner } = await loadFixture(
                deployNewTokenFixture
            );
            const amount = ethers.parseEther("3");
            const preBalance = await ladysToken.balanceOf(owner.address);
            await ladysToken.burn(amount);
            const postBalance = await ladysToken.balanceOf(owner.address);

            expect(preBalance - postBalance).equal(amount);
        });
    });
});
