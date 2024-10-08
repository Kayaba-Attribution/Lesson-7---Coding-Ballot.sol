import { createPublicClient, http, createWalletClient, formatEther } from "viem";
import { toHex, hexToString } from "viem/utils";
import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";
import { cropAddress, getWalletClient } from "./Helpers";
import { abi, bytecode } from "../artifacts/contracts/Ballot.sol/Ballot.json";

dotenv.config();

// cosntants
const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const deployerPrivateKey = process.env.PRIVATE_KEY || "";
const participantApiKey = process.env.PARTICIPANT_API_KEY || "";

// example
// ❯ npx ts-node --files ./scripts/CastVote.ts "0xaa9fc66cc11bf4268e08cf9431bf40ea4d8300a6" 0 

async function main() {

    // connect public client
    const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(`${providerApiKey}`),
    });

    // getting the args
    const parameters = process.argv.slice(2);
    //checks
    if (!parameters || parameters.length < 2)
        throw new Error("Parameters not provided");
    const contractAddress = parameters[0] as `0x${string}`;
    if (!contractAddress) throw new Error("Contract address not provided");
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress))
        throw new Error("Invalid contract address");

    const proposalIndex = parameters[1];
    if (isNaN(Number(proposalIndex))) throw new Error("Invalid proposal index");

    // contract proposalIndex

    // ! Attaching the contract and checking the selected option
    console.log("Proposal selected: ");
    const proposal = (await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: "proposals",
        args: [BigInt(proposalIndex)],
    })) as any[];
    const name = hexToString(proposal[0], { size: 32 });
    console.log("Voting to proposal", name);
    console.log("Confirm? (Y/n)");

    // get wallet client
    const deployer = await getWalletClient(publicClient, deployerPrivateKey);
    const participant = await getWalletClient(publicClient, participantApiKey);

    // TODO: how does this work? stdin.addListener
    // ! send tx

    // VOTE DONE
    const stdin = process.stdin;
    stdin.addListener("data", async function (d) {
        if (d.toString().trim().toLowerCase() != "n") {
            // change object to person that is voting
            // ie. deployer or participant
            const hash = await participant.writeContract({
                address: contractAddress,
                abi,
                functionName: "vote",
                args: [BigInt(proposalIndex)],
            });
            console.log("Transaction hash:", hash);
            console.log("Waiting for confirmations...");
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            console.log("Transaction confirmed");
        } else {
            console.log("Operation cancelled");
        }
        process.exit();
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});