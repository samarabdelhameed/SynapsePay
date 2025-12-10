# 🧪 SynapsePay Smart Contracts - Test Suite

## 📋 Overview

Comprehensive test suite for all SynapsePay Anchor programs, similar to Foundry tests but for Solana.

---

## 🎯 Test Coverage

### ✅ Registry Tests (`registry.test.ts`)
- ✅ Register Agent
- ✅ Update Agent (metadata & price)
- ✅ Deactivate Agent
- ✅ Reactivate Agent
- ✅ Transfer Ownership
- ❌ Unauthorized Access Prevention

### ✅ Payments Tests (`payments.test.ts`)
- ✅ Initialize Platform
- ✅ Create Invoice
- ✅ Settle Payment
- ✅ Verify Payment & Escrow
- ✅ Complete Task
- ✅ Mint Receipt
- ✅ Claim Payment
- ✅ Refund Payment
- ✅ Withdraw Fees

### ✅ Scheduler Tests (`scheduler.test.ts`)
- ✅ Initialize Scheduler
- ✅ Create Subscription
- ✅ Fund Subscription
- ✅ Update Subscription Cadence
- ✅ Pause Subscription
- ✅ Resume Subscription
- ✅ Trigger Scheduled Task
- ✅ Cancel Subscription & Refund

---

## 🚀 Running Tests

### Prerequisites
```bash
# Make sure Anchor is installed
anchor --version

# Make sure Solana CLI is configured
solana config get
```

### Run All Tests
```bash
# Build and test all contracts
anchor test

# Or using npm
npm run test
```

### Run Individual Test Suites
```bash
# Test Registry only
npm run test:registry

# Test Payments only
npm run test:payments

# Test Scheduler only
npm run test:scheduler
```

### Run with Localnet
```bash
# Start local validator
solana-test-validator

# Run tests (in another terminal)
anchor test --skip-local-validator
```

---

## 📊 Test Output Example

```
🔧 Setting up test environment...
Owner: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
Agent PDA: 7xKXtg2CW87d9VqQzJkHT5J5E1mRQWz4vNrYhS9QT2Ni

  SynapsePay Registry Tests
    1. Register Agent
      📝 Test: Register Agent
      ✓ Transaction signature: 5KtP9...
      ✓ Agent registered successfully
        - Owner: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
        - Agent ID: test-agent-1702166000
        - Price: 1000000 lamports
        - Active: true
      ✅ Should register a new agent successfully (2.5s)

    2. Update Agent
      📝 Test: Update Agent
      ✓ Transaction signature: 4RmQ7...
      ✓ Agent updated successfully
        - New Metadata CID: QmUpdated987654321
        - New Price: 2000000 lamports
      ✅ Should update agent metadata and price (1.8s)

  ✅ All Registry tests completed!
  ✓ 5 passing (12s)
```

---

## 🔍 What Each Test Validates

### Registry Tests
| Test | Validates |
|------|-----------|
| Register Agent | PDA creation, initial state, ownership |
| Update Agent | State mutation, authorization |
| Deactivate/Reactivate | Boolean state changes |
| Transfer Ownership | Owner field update |
| Unauthorized Access | Error handling |

### Payments Tests
| Test | Validates |
|------|-----------|
| Initialize Platform | PDA creation, token account setup |
| Create Invoice | Invoice state, expiry, nonce |
| Settle Payment | State transition, signature storage |
| Verify Payment | Token transfer to escrow, fee collection |
| Complete Task | Result CID storage, state update |
| Claim Payment | Token transfer to recipient |
| Refund Payment | Token return to payer |

### Scheduler Tests
| Test | Validates |
|------|-----------|
| Create Subscription | PDA creation, cadence setup |
| Fund Subscription | Token transfer to vault |
| Update Subscription | Cadence modification |
| Pause/Resume | State flags |
| Trigger Task | Balance deduction, run counter |
| Cancel Subscription | Account closure, refund |

---

## 🛠️ Test Utilities

### Token Setup
```typescript
// Create USDC mint (simulating Devnet USDC)
usdcMint = await createMint(
  provider.connection,
  payer.payer,
  payer.publicKey,
  null,
  6 // USDC decimals
);

// Mint tokens for testing
await mintTo(
  provider.connection,
  payer.payer,
  usdcMint,
  payerTokenAccount,
  payer.publicKey,
  10_000_000 // 10 USDC
);
```

### PDA Derivation
```typescript
// Derive agent PDA
[agentPda, agentBump] = PublicKey.findProgramAddressSync(
  [Buffer.from("agent"), Buffer.from(testAgentId)],
  program.programId
);
```

---

## 📈 Expected Results

All tests should pass with:
- ✅ Correct state transitions
- ✅ Proper token transfers
- ✅ Valid PDA derivations
- ✅ Authorization checks
- ✅ Error handling

---

## 🐛 Debugging Tests

### Enable Verbose Logging
```bash
RUST_LOG=debug anchor test
```

### View Transaction Logs
```bash
solana logs --url localhost
```

### Check Account State
```typescript
const account = await program.account.agent.fetch(agentPda);
console.log("Account:", JSON.stringify(account, null, 2));
```

---

## 📝 Adding New Tests

1. Create new test file in `tests/`
2. Import required dependencies
3. Set up test environment in `before()` hook
4. Write test cases using `describe()` and `it()`
5. Add assertions with `assert` from chai
6. Run tests with `anchor test`

Example:
```typescript
describe("My New Feature", () => {
  it("should do something", async () => {
    const tx = await program.methods
      .myNewInstruction()
      .accounts({ /* ... */ })
      .rpc();
    
    assert.ok(tx);
  });
});
```

---

## ✅ Test Checklist

Before deployment:
- [ ] All Registry tests pass
- [ ] All Payments tests pass
- [ ] All Scheduler tests pass
- [ ] Token transfers verified
- [ ] PDAs correctly derived
- [ ] Error cases handled
- [ ] Gas costs acceptable

---

**Built with ❤️ for Solana Hyperdrive Hackathon**
