import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import {
    TOKEN_PROGRAM_ID,
    createMint,
    createAccount,
    mintTo,
    getAccount,
} from "@solana/spl-token";
import { assert } from "chai";
import { SynapsepayPayments } from "../target/types/synapsepay_payments";

describe("SynapsePay Payments Tests", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.SynapsepayPayments as Program<SynapsepayPayments>;

    const payer = provider.wallet;
    const recipient = Keypair.generate();

    let usdcMint: PublicKey;
    let payerTokenAccount: PublicKey;
    let recipientTokenAccount: PublicKey;
    let platformAuthority: PublicKey;
    let escrowAuthority: PublicKey;
    let feeTreasury: PublicKey;

    let invoicePda: PublicKey;
    let paymentPda: PublicKey;
    let escrowPda: PublicKey;

    const testAgentId = "pdf-summarizer";
    const paymentAmount = new anchor.BN(1_000_000); // 1 USDC

    before(async () => {
        console.log("🔧 Setting up Payments test environment...");

        // Create USDC mint (simulating Devnet USDC)
        usdcMint = await createMint(
            provider.connection,
            payer.payer,
            payer.publicKey,
            null,
            6 // USDC decimals
        );
        console.log("✓ USDC Mint created:", usdcMint.toBase58());

        // Create token accounts
        payerTokenAccount = await createAccount(
            provider.connection,
            payer.payer,
            usdcMint,
            payer.publicKey
        );

        recipientTokenAccount = await createAccount(
            provider.connection,
            payer.payer,
            usdcMint,
            recipient.publicKey
        );

        // Mint USDC to payer
        await mintTo(
            provider.connection,
            payer.payer,
            usdcMint,
            payerTokenAccount,
            payer.publicKey,
            10_000_000 // 10 USDC
        );
        console.log("✓ Minted 10 USDC to payer");

        // Derive PDAs
        [platformAuthority] = PublicKey.findProgramAddressSync(
            [Buffer.from("platform_authority")],
            program.programId
        );

        [escrowAuthority] = PublicKey.findProgramAddressSync(
            [Buffer.from("escrow_authority")],
            program.programId
        );

        [feeTreasury] = PublicKey.findProgramAddressSync(
            [Buffer.from("fee_treasury")],
            program.programId
        );

        console.log("✓ Platform Authority:", platformAuthority.toBase58());
        console.log("✓ Escrow Authority:", escrowAuthority.toBase58());
        console.log("✓ Fee Treasury:", feeTreasury.toBase58());
    });

    describe("1. Initialize Platform", () => {
        it("✅ Should initialize platform with fee treasury", async () => {
            console.log("\n📝 Test: Initialize Platform");

            const tx = await program.methods
                .initializePlatform()
                .accounts({
                    admin: payer.publicKey,
                    platformAuthority,
                    escrowAuthority,
                    usdcMint,
                    feeTreasury,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log("✓ Transaction signature:", tx);

            // Verify fee treasury was created
            const treasuryAccount = await getAccount(
                provider.connection,
                feeTreasury
            );

            assert.equal(treasuryAccount.mint.toBase58(), usdcMint.toBase58());
            assert.equal(treasuryAccount.amount.toString(), "0");

            console.log("✓ Platform initialized successfully");
            console.log("  - Fee Treasury:", feeTreasury.toBase58());
        });
    });

    describe("2. Create Invoice", () => {
        it("✅ Should create payment invoice", async () => {
            console.log("\n📝 Test: Create Invoice");

            const timestamp = Date.now();
            const expiresAt = new anchor.BN(Math.floor(Date.now() / 1000) + 300); // 5 minutes

            [invoicePda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("invoice"),
                    payer.publicKey.toBuffer(),
                    Buffer.from(testAgentId),
                    Buffer.from(timestamp.toString()),
                ],
                program.programId
            );

            const tx = await program.methods
                .createInvoice(testAgentId, paymentAmount, expiresAt)
                .accounts({
                    invoice: invoicePda,
                    payer: payer.publicKey,
                    recipient: recipient.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log("✓ Transaction signature:", tx);

            const invoiceAccount = await program.account.invoice.fetch(invoicePda);

            assert.equal(invoiceAccount.payer.toBase58(), payer.publicKey.toBase58());
            assert.equal(invoiceAccount.recipient.toBase58(), recipient.publicKey.toBase58());
            assert.equal(invoiceAccount.agentId, testAgentId);
            assert.equal(invoiceAccount.amount.toString(), paymentAmount.toString());

            console.log("✓ Invoice created successfully");
            console.log("  - Invoice ID:", invoiceAccount.invoiceId.toBase58());
            console.log("  - Amount:", invoiceAccount.amount.toString());
            console.log("  - State:", Object.keys(invoiceAccount.state)[0]);
        });
    });

    describe("3. Settle Payment", () => {
        it("✅ Should settle payment with signature", async () => {
            console.log("\n📝 Test: Settle Payment");

            const dummySignature = new Array(64).fill(0);

            [paymentPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("payment"), invoicePda.toBuffer()],
                program.programId
            );

            const tx = await program.methods
                .settlePayment(dummySignature)
                .accounts({
                    payer: payer.publicKey,
                    invoice: invoicePda,
                    payment: paymentPda,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log("✓ Transaction signature:", tx);

            const paymentAccount = await program.account.payment.fetch(paymentPda);
            const invoiceAccount = await program.account.invoice.fetch(invoicePda);

            assert.equal(Object.keys(invoiceAccount.state)[0], "pending");
            assert.equal(paymentAccount.amount.toString(), "950000"); // 95% of 1M
            assert.equal(paymentAccount.platformFee.toString(), "50000"); // 5% of 1M

            console.log("✓ Payment settled successfully");
            console.log("  - Net Amount:", paymentAccount.amount.toString());
            console.log("  - Platform Fee:", paymentAccount.platformFee.toString());
        });
    });

    describe("4. Verify Payment", () => {
        it("✅ Should verify payment and transfer to escrow", async () => {
            console.log("\n📝 Test: Verify Payment");

            [escrowPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("escrow"), paymentPda.toBuffer()],
                program.programId
            );

            // Create escrow token account
            const escrowTokenAccount = await createAccount(
                provider.connection,
                payer.payer,
                usdcMint,
                escrowAuthority,
                undefined,
                undefined,
                TOKEN_PROGRAM_ID
            );

            const tx = await program.methods
                .verifyPayment()
                .accounts({
                    payer: payer.publicKey,
                    payment: paymentPda,
                    payerTokenAccount,
                    escrowAccount: escrowTokenAccount,
                    feeTreasury,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            console.log("✓ Transaction signature:", tx);

            const paymentAccount = await program.account.payment.fetch(paymentPda);
            assert.equal(Object.keys(paymentAccount.state)[0], "executing");

            // Verify escrow balance
            const escrowBalance = await getAccount(
                provider.connection,
                escrowTokenAccount
            );
            assert.equal(escrowBalance.amount.toString(), "950000");

            // Verify fee treasury balance
            const treasuryBalance = await getAccount(
                provider.connection,
                feeTreasury
            );
            assert.equal(treasuryBalance.amount.toString(), "50000");

            console.log("✓ Payment verified and escrowed");
            console.log("  - Escrow Balance:", escrowBalance.amount.toString());
            console.log("  - Fee Treasury:", treasuryBalance.amount.toString());
        });
    });

    describe("5. Complete Task", () => {
        it("✅ Should mark task as completed with result CID", async () => {
            console.log("\n📝 Test: Complete Task");

            const resultCid = "QmResultABC123";

            const tx = await program.methods
                .completeTask(resultCid)
                .accounts({
                    authority: payer.publicKey,
                    payment: paymentPda,
                })
                .rpc();

            console.log("✓ Transaction signature:", tx);

            const paymentAccount = await program.account.payment.fetch(paymentPda);

            assert.equal(Object.keys(paymentAccount.state)[0], "completed");
            assert.equal(paymentAccount.resultCid, resultCid);

            console.log("✓ Task completed successfully");
            console.log("  - Result CID:", paymentAccount.resultCid);
        });
    });

    describe("6. Claim Payment", () => {
        it("✅ Should allow recipient to claim payment", async () => {
            console.log("\n📝 Test: Claim Payment");

            const [escrowTokenAccount] = await provider.connection.getTokenAccountsByOwner(
                escrowAuthority,
                { mint: usdcMint }
            );

            const tx = await program.methods
                .claimPayment()
                .accounts({
                    recipient: recipient.publicKey,
                    payment: paymentPda,
                    escrowAccount: escrowTokenAccount.pubkey,
                    recipientTokenAccount,
                    escrowAuthority,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .signers([recipient])
                .rpc();

            console.log("✓ Transaction signature:", tx);

            const paymentAccount = await program.account.payment.fetch(paymentPda);
            assert.equal(Object.keys(paymentAccount.state)[0], "claimed");

            // Verify recipient received payment
            const recipientBalance = await getAccount(
                provider.connection,
                recipientTokenAccount
            );
            assert.equal(recipientBalance.amount.toString(), "950000");

            console.log("✓ Payment claimed successfully");
            console.log("  - Recipient Balance:", recipientBalance.amount.toString());
        });
    });

    after(() => {
        console.log("\n✅ All Payments tests completed!");
    });
});
