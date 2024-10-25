import { Web3Utils } from "../utils";

const main = async () => {
    const web3Utils = new Web3Utils();

    const AIRDROP = process.env.AIRDROP_ADDRESS!;
    const GRANTS = process.env.GRANTS_ADDRESS!;
    const LIQUID = process.env.LIQUID_ADDRESS!;
    const TREASURY = process.env.TREASURY_ADDRESS!;

    let oldToken = process.env.OLD_TOKEN;

    if (!oldToken) {
        const oldTokenContract = await web3Utils.deployContract("OldToken", []);
        oldToken = oldTokenContract.target as string;
    }

    const swap = await web3Utils.deployContract("Swap", [oldToken]);
    const newToken = await web3Utils.deployContract("LadysToken", [
        swap.target,
        AIRDROP,
        GRANTS,
        LIQUID,
        TREASURY,
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (swap as any).setNewToken(newToken.target);
};

main().catch((err) => console.log(err));
