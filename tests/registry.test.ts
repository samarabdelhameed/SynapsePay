import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { SynapsepayRegistry } from "../target/types/synapsepay_registry";

describe("SynapsePay Registry Tests", () => {
    // Configure the client
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.SynapsepayRegistry as Program<SynapsepayRegistry>;

    // Test accounts
    const owner = provider.wallet;
    let agentPda: PublicKey;
    let agentBump: number;

    const testAgentId = "test-agent-" + Date.now();
    const testMetadataCid = "QmTest123456789";
    const testPrice = new anchor.BN(1_000_000); // 1 USDC

    before(async () => {
        console.log("🔧 Setting up test environment...");
        console.log("Owner:", owner.publicKey.toBase58());

        // Derive agent PDA
        [agentPda, agentBump] = PublicKey.findProgramAddressSync(
            [Buffer.from("agent"), Buffer.from(testAgentId)],
            program.programId
        );

        console.log("Agent PDA:", agentPda.toBase58());
    });

    describe("1. Register Agent", () => {
        it("✅ Should register a new agent successfully", async () => {
            console.log("\n📝 Test: Register Agent");

            const tx = await program.methods
                .registerAgent(
                    testAgentId,
                    testMetadataCid,
                    testPrice,
                    { ai: {} } // AgentCategory::AI
                )
                .accounts({
                    agent: agentPda,
                    owner: owner.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log("✓ Transaction signature:", tx);

            // Fetch and verify agent data
            const agentAccount = await program.account.agent.fetch(agentPda);

            assert.equal(agentAccount.owner.toBase58(), owner.publicKey.toBase58());
            assert.equal(agentAccount.agentId, testAgentId);
            assert.equal(agentAccount.metadataCid, testMetadataCid);
            assert.equal(agentAccount.price.toString(), testPrice.toString());
            assert.equal(agentAccount.totalRuns.toString(), "0");
            assert.equal(agentAccount.totalEarned.toString(), "0");
            assert.equal(agentAccount.isActive, true);

            console.log("✓ Agent registered successfully");
            console.log("  - Owner:", agentAccount.owner.toBase58());
            console.log("  - Agent ID:", agentAccount.agentId);
            console.log("  - Price:", agentAccount.price.toString(), "lamports");
            console.log("  - Active:", agentAccount.isActive);
        });

        it("❌ Should fail to register duplicate agent", async () => {
            console.log("\n📝 Test: Duplicate Agent Registration");

            try {
                await program.methods
                    .registerAgent(
                        testAgentId, // Same ID
                        testMetadataCid,
                        testPrice,
                        { ai: {} }
                    )
                    .accounts({
                        agent: agentPda,
                        owner: owner.publicKey,
                        systemProgram: SystemProgram.programId,
                    })
                    .rpc();

                assert.fail("Should have thrown an error");
            } catch (error) {
                console.log("✓ Correctly rejected duplicate registration");
                assert.ok(error);
            }
        });
    });

    describe("2. Update Agent", () => {
        it("✅ Should update agent metadata and price", async () => {
            console.log("\n📝 Test: Update Agent");

            const newMetadataCid = "QmUpdated987654321";
            const newPrice = new anchor.BN(2_000_000); // 2 USDC

            const tx = await program.methods
                .updateAgent(newMetadataCid, newPrice)
                .accounts({
                    agent: agentPda,
                    owner: owner.publicKey,
                })
                .rpc();

            console.log("✓ Transaction signature:", tx);

            // Verify updates
            const agentAccount = await program.account.agent.fetch(agentPda);

            assert.equal(agentAccount.metadataCid, newMetadataCid);
            assert.equal(agentAccount.price.toString(), newPrice.toString());

            console.log("✓ Agent updated successfully");
            console.log("  - New Metadata CID:", agentAccount.metadataCid);
            console.log("  - New Price:", agentAccount.price.toString(), "lamports");
        });

        it("❌ Should fail when non-owner tries to update", async () => {
            console.log("\n📝 Test: Unauthorized Update");

            const unauthorizedUser = Keypair.generate();

            try {
                await program.methods
                    .updateAgent("QmHacker", new anchor.BN(1))
                    .accounts({
                        agent: agentPda,
                        owner: unauthorizedUser.publicKey,
                    })
                    .signers([unauthorizedUser])
                    .rpc();

                assert.fail("Should have thrown an error");
            } catch (error) {
                console.log("✓ Correctly rejected unauthorized update");
                assert.ok(error);
            }
        });
    });

    describe("3. Deactivate Agent", () => {
        it("✅ Should deactivate agent", async () => {
            console.log("\n📝 Test: Deactivate Agent");

            const tx = await program.methods
                .deactivateAgent()
                .accounts({
                    agent: agentPda,
                    owner: owner.publicKey,
                })
                .rpc();

            console.log("✓ Transaction signature:", tx);

            const agentAccount = await program.account.agent.fetch(agentPda);
            assert.equal(agentAccount.isActive, false);

            console.log("✓ Agent deactivated successfully");
        });
    });

    describe("4. Reactivate Agent", () => {
        it("✅ Should reactivate agent", async () => {
            console.log("\n📝 Test: Reactivate Agent");

            const tx = await program.methods
                .reactivateAgent()
                .accounts({
                    agent: agentPda,
                    owner: owner.publicKey,
                })
                .rpc();

            console.log("✓ Transaction signature:", tx);

            const agentAccount = await program.account.agent.fetch(agentPda);
            assert.equal(agentAccount.isActive, true);

            console.log("✓ Agent reactivated successfully");
        });
    });

    describe("5. Transfer Ownership", () => {
        it("✅ Should transfer agent ownership", async () => {
            console.log("\n📝 Test: Transfer Ownership");

            const newOwner = Keypair.generate();

            const tx = await program.methods
                .transferOwnership(newOwner.publicKey)
                .accounts({
                    agent: agentPda,
                    currentOwner: owner.publicKey,
                })
                .rpc();

            console.log("✓ Transaction signature:", tx);

            const agentAccount = await program.account.agent.fetch(agentPda);
            assert.equal(agentAccount.owner.toBase58(), newOwner.publicKey.toBase58());

            console.log("✓ Ownership transferred successfully");
            console.log("  - New Owner:", agentAccount.owner.toBase58());
        });
    });

    after(() => {
        console.log("\n✅ All Registry tests completed!");
    });
});
