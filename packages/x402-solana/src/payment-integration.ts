/**
 * Payment Integration System for Robot Control
 * Handles payment-per-action, session billing, and revenue distribution
 */

import { EventEmitter } from 'events';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface PaymentConfig {
  facilitatorAddress: string;
  platformFeePercentage: number; // 0-100
  defaultCurrency: 'SOL' | 'USDC';
  gaslessEnabled: boolean;
  escrowEnabled: boolean;
  minimumPayment: number;
  maximumPayment: number;
}

export interface PaymentRequest {
  requestId: string;
  sessionId: string;
  deviceId: string;
  userId: string;
  deviceOwner: string;
  amount: number;
  currency: 'SOL' | 'USDC';
  description: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface PaymentTransaction {
  transactionId: string;
  paymentRequestId: string;
  sessionId: string;
  deviceId: string;
  payer: string;
  recipient: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  currency: 'SOL' | 'USDC';
  status: PaymentStatus;
  blockchainTxId?: string;
  timestamp: number;
  completedAt?: number;
  failureReason?: string;
}

export interface EscrowAccount {
  escrowId: string;
  sessionId: string;
  payer: string;
  recipient: string;
  amount: number;
  currency: 'SOL' | 'USDC';
  status: 'locked' | 'released' | 'refunded';
  createdAt: number;
  releaseConditions: ReleaseCondition[];
  autoReleaseAt?: number;
}

export interface ReleaseCondition {
  type: 'session_completion' | 'manual_approval' | 'timeout' | 'dispute_resolution';
  parameters?: Record<string, any>;
  satisfied: boolean;
  satisfiedAt?: number;
}

export interface PaymentSummary {
  sessionId: string;
  totalAmount: number;
  platformFees: number;
  netAmount: number;
  currency: 'SOL' | 'USDC';
  transactionCount: number;
  transactions: PaymentTransaction[];
}

export interface RevenueShare {
  deviceOwner: string;
  platform: string;
  amounts: {
    deviceOwner: number;
    platform: number;
    total: number;
  };
  currency: 'SOL' | 'USDC';
}

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'refunded';

export class PaymentIntegrationSystem extends EventEmitter {
  private paymentRequests: Map<string, PaymentRequest> = new Map();
  private transactions: Map<string, PaymentTransaction> = new Map();
  private escrowAccounts: Map<string, EscrowAccount> = new Map();
  private sessionPayments: Map<string, PaymentSummary> = new Map();

  constructor(private config: PaymentConfig) {
    super();
    this.validateConfig();
  }

  // Payment Request Management
  async createPaymentRequest(
    sessionId: string,
    deviceId: string,
    userId: string,
    deviceOwner: string,
    amount: number,
    description: string,
    currency: 'SOL' | 'USDC' = this.config.defaultCurrency
  ): Promise<string> {
    // Validate payment amount
    if (amount < this.config.minimumPayment) {
      throw new Error(`Payment amount below minimum: ${this.config.minimumPayment}`);
    }
    
    if (amount > this.config.maximumPayment) {
      throw new Error(`Payment amount exceeds maximum: ${this.config.maximumPayment}`);
    }

    const requestId = this.generatePaymentRequestId();
    const paymentRequest: PaymentRequest = {
      requestId,
      sessionId,
      deviceId,
      userId,
      deviceOwner,
      amount,
      currency,
      description,
      timestamp: Date.now()
    };

    this.paymentRequests.set(requestId, paymentRequest);
    this.emit('paymentRequestCreated', paymentRequest);

    return requestId;
  }

  async processPayment(
    paymentRequestId: string,
    payerAddress: string,
    signature?: string
  ): Promise<string> {
    const paymentRequest = this.paymentRequests.get(paymentRequestId);
    if (!paymentRequest) {
      throw new Error('Payment request not found');
    }

    // Calculate fees
    const platformFee = this.calculatePlatformFee(paymentRequest.amount);
    const netAmount = paymentRequest.amount - platformFee;

    const transactionId = this.generateTransactionId();
    const transaction: PaymentTransaction = {
      transactionId,
      paymentRequestId,
      sessionId: paymentRequest.sessionId,
      deviceId: paymentRequest.deviceId,
      payer: payerAddress,
      recipient: paymentRequest.deviceOwner,
      amount: paymentRequest.amount,
      platformFee,
      netAmount,
      currency: paymentRequest.currency,
      status: 'pending',
      timestamp: Date.now()
    };

    this.transactions.set(transactionId, transaction);

    try {
      // Process payment based on configuration
      if (this.config.escrowEnabled) {
        await this.processEscrowPayment(transaction, paymentRequest);
      } else {
        await this.processDirectPayment(transaction, paymentRequest, signature);
      }

      // Update session payment summary
      this.updateSessionPaymentSummary(paymentRequest.sessionId, transaction);

      this.emit('paymentProcessed', transaction);
      return transactionId;
    } catch (error) {
      transaction.status = 'failed';
      transaction.failureReason = (error as Error).message;
      this.transactions.set(transactionId, transaction);
      
      this.emit('paymentFailed', { transaction, error: (error as Error).message });
      throw error;
    }
  }

  // Escrow Management
  async createEscrowAccount(
    sessionId: string,
    payer: string,
    recipient: string,
    amount: number,
    currency: 'SOL' | 'USDC',
    releaseConditions: Omit<ReleaseCondition, 'satisfied' | 'satisfiedAt'>[]
  ): Promise<string> {
    const escrowId = this.generateEscrowId();
    const escrowAccount: EscrowAccount = {
      escrowId,
      sessionId,
      payer,
      recipient,
      amount,
      currency,
      status: 'locked',
      createdAt: Date.now(),
      releaseConditions: releaseConditions.map(condition => ({
        ...condition,
        satisfied: false
      })),
      autoReleaseAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours default
    };

    this.escrowAccounts.set(escrowId, escrowAccount);
    this.emit('escrowCreated', escrowAccount);

    return escrowId;
  }

  async releaseEscrow(escrowId: string, reason: string): Promise<void> {
    const escrow = this.escrowAccounts.get(escrowId);
    if (!escrow) {
      throw new Error('Escrow account not found');
    }

    if (escrow.status !== 'locked') {
      throw new Error(`Cannot release escrow with status: ${escrow.status}`);
    }

    // Check if release conditions are met
    const conditionsMet = this.checkReleaseConditions(escrow);
    if (!conditionsMet) {
      throw new Error('Release conditions not met');
    }

    // Process escrow release
    await this.executeEscrowRelease(escrow);

    escrow.status = 'released';
    this.escrowAccounts.set(escrowId, escrow);

    this.emit('escrowReleased', { escrow, reason });
  }

  async refundEscrow(escrowId: string, reason: string): Promise<void> {
    const escrow = this.escrowAccounts.get(escrowId);
    if (!escrow) {
      throw new Error('Escrow account not found');
    }

    if (escrow.status !== 'locked') {
      throw new Error(`Cannot refund escrow with status: ${escrow.status}`);
    }

    // Process escrow refund
    await this.executeEscrowRefund(escrow);

    escrow.status = 'refunded';
    this.escrowAccounts.set(escrowId, escrow);

    this.emit('escrowRefunded', { escrow, reason });
  }

  // Session Payment Management
  getSessionPaymentSummary(sessionId: string): PaymentSummary | undefined {
    return this.sessionPayments.get(sessionId);
  }

  async finalizeSessionPayments(sessionId: string): Promise<PaymentSummary> {
    const summary = this.sessionPayments.get(sessionId);
    if (!summary) {
      throw new Error('No payments found for session');
    }

    // Release any pending escrow accounts for this session
    const sessionEscrows = Array.from(this.escrowAccounts.values())
      .filter(escrow => escrow.sessionId === sessionId && escrow.status === 'locked');

    for (const escrow of sessionEscrows) {
      try {
        await this.releaseEscrow(escrow.escrowId, 'Session completed');
      } catch (error) {
        console.warn(`Failed to release escrow ${escrow.escrowId}:`, (error as Error).message);
      }
    }

    this.emit('sessionPaymentsFinalized', summary);
    return summary;
  }

  // Revenue and Analytics
  calculateRevenueShare(amount: number, currency: 'SOL' | 'USDC'): RevenueShare {
    const platformFee = this.calculatePlatformFee(amount);
    const deviceOwnerAmount = amount - platformFee;

    return {
      deviceOwner: 'device_owner_address', // Would be actual address
      platform: this.config.facilitatorAddress,
      amounts: {
        deviceOwner: deviceOwnerAmount,
        platform: platformFee,
        total: amount
      },
      currency
    };
  }

  getPaymentHistory(
    filter?: PaymentHistoryFilter
  ): PaymentTransaction[] {
    let transactions = Array.from(this.transactions.values());

    if (filter) {
      transactions = transactions.filter(tx => {
        if (filter.sessionId && tx.sessionId !== filter.sessionId) return false;
        if (filter.deviceId && tx.deviceId !== filter.deviceId) return false;
        if (filter.payer && tx.payer !== filter.payer) return false;
        if (filter.recipient && tx.recipient !== filter.recipient) return false;
        if (filter.status && tx.status !== filter.status) return false;
        if (filter.currency && tx.currency !== filter.currency) return false;
        if (filter.fromDate && tx.timestamp < filter.fromDate) return false;
        if (filter.toDate && tx.timestamp > filter.toDate) return false;
        return true;
      });
    }

    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  getRevenueAnalytics(period: 'day' | 'week' | 'month' | 'year'): RevenueAnalytics {
    const transactions = this.getCompletedTransactions();
    const now = Date.now();
    const periodMs = this.getPeriodMilliseconds(period);
    const periodStart = now - periodMs;

    const periodTransactions = transactions.filter(tx => 
      tx.timestamp >= periodStart && tx.timestamp <= now
    );

    const totalRevenue = periodTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const platformRevenue = periodTransactions.reduce((sum, tx) => sum + tx.platformFee, 0);
    const deviceOwnerRevenue = periodTransactions.reduce((sum, tx) => sum + tx.netAmount, 0);

    return {
      period,
      periodStart,
      periodEnd: now,
      totalTransactions: periodTransactions.length,
      totalRevenue,
      platformRevenue,
      deviceOwnerRevenue,
      averageTransactionAmount: periodTransactions.length > 0 
        ? totalRevenue / periodTransactions.length 
        : 0,
      currency: this.config.defaultCurrency
    };
  }

  // Private Methods
  private async processDirectPayment(
    transaction: PaymentTransaction,
    paymentRequest: PaymentRequest,
    signature?: string
  ): Promise<void> {
    transaction.status = 'processing';
    this.transactions.set(transaction.transactionId, transaction);

    if (this.config.gaslessEnabled) {
      // Process gasless payment through facilitator
      transaction.blockchainTxId = await this.processGaslessPayment(transaction);
    } else {
      // Process regular payment
      if (!signature) {
        throw new Error('Transaction signature required for non-gasless payments');
      }
      transaction.blockchainTxId = await this.processRegularPayment(transaction, signature);
    }

    transaction.status = 'completed';
    transaction.completedAt = Date.now();
    this.transactions.set(transaction.transactionId, transaction);
  }

  private async processEscrowPayment(
    transaction: PaymentTransaction,
    paymentRequest: PaymentRequest
  ): Promise<void> {
    // Create escrow account
    const escrowId = await this.createEscrowAccount(
      paymentRequest.sessionId,
      transaction.payer,
      transaction.recipient,
      transaction.amount,
      transaction.currency,
      [
        { type: 'session_completion' },
        { type: 'timeout', parameters: { timeoutHours: 24 } }
      ]
    );

    transaction.status = 'completed'; // Payment is in escrow
    transaction.completedAt = Date.now();
    transaction.blockchainTxId = `escrow_${escrowId}`;
    this.transactions.set(transaction.transactionId, transaction);
  }

  private async processGaslessPayment(transaction: PaymentTransaction): Promise<string> {
    // Simulate gasless payment processing
    // In production, this would integrate with the gasless transaction engine
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
    return `gasless_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async processRegularPayment(
    transaction: PaymentTransaction, 
    signature: string
  ): Promise<string> {
    // Simulate regular payment processing
    // In production, this would submit the transaction to Solana
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
    return `regular_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async executeEscrowRelease(escrow: EscrowAccount): Promise<void> {
    // Simulate escrow release
    // In production, this would execute the actual blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async executeEscrowRefund(escrow: EscrowAccount): Promise<void> {
    // Simulate escrow refund
    // In production, this would execute the actual blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private checkReleaseConditions(escrow: EscrowAccount): boolean {
    // Check if any release condition is satisfied
    return escrow.releaseConditions.some(condition => {
      switch (condition.type) {
        case 'session_completion':
          // Check if session is completed
          return this.isSessionCompleted(escrow.sessionId);
        case 'timeout':
          // Check if timeout has passed
          return Date.now() >= (escrow.autoReleaseAt || 0);
        case 'manual_approval':
          // Check if manually approved
          return condition.satisfied;
        default:
          return false;
      }
    });
  }

  private isSessionCompleted(sessionId: string): boolean {
    // This would check with the robot control system
    // For now, return true after some time
    return true;
  }

  private updateSessionPaymentSummary(
    sessionId: string, 
    transaction: PaymentTransaction
  ): void {
    let summary = this.sessionPayments.get(sessionId);
    
    if (!summary) {
      summary = {
        sessionId,
        totalAmount: 0,
        platformFees: 0,
        netAmount: 0,
        currency: transaction.currency,
        transactionCount: 0,
        transactions: []
      };
    }

    summary.totalAmount += transaction.amount;
    summary.platformFees += transaction.platformFee;
    summary.netAmount += transaction.netAmount;
    summary.transactionCount += 1;
    summary.transactions.push(transaction);

    this.sessionPayments.set(sessionId, summary);
  }

  private calculatePlatformFee(amount: number): number {
    return (amount * this.config.platformFeePercentage) / 100;
  }

  private getCompletedTransactions(): PaymentTransaction[] {
    return Array.from(this.transactions.values())
      .filter(tx => tx.status === 'completed');
  }

  private getPeriodMilliseconds(period: 'day' | 'week' | 'month' | 'year'): number {
    switch (period) {
      case 'day': return 24 * 60 * 60 * 1000;
      case 'week': return 7 * 24 * 60 * 60 * 1000;
      case 'month': return 30 * 24 * 60 * 60 * 1000;
      case 'year': return 365 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }

  private validateConfig(): void {
    if (!this.config.facilitatorAddress) {
      throw new Error('Facilitator address is required');
    }

    if (this.config.platformFeePercentage < 0 || this.config.platformFeePercentage > 100) {
      throw new Error('Platform fee percentage must be between 0 and 100');
    }

    if (this.config.minimumPayment < 0) {
      throw new Error('Minimum payment cannot be negative');
    }

    if (this.config.maximumPayment <= this.config.minimumPayment) {
      throw new Error('Maximum payment must be greater than minimum payment');
    }
  }

  private generatePaymentRequestId(): string {
    return `pay_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEscrowId(): string {
    return `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Additional Types
export interface PaymentHistoryFilter {
  sessionId?: string;
  deviceId?: string;
  payer?: string;
  recipient?: string;
  status?: PaymentStatus;
  currency?: 'SOL' | 'USDC';
  fromDate?: number;
  toDate?: number;
}

export interface RevenueAnalytics {
  period: 'day' | 'week' | 'month' | 'year';
  periodStart: number;
  periodEnd: number;
  totalTransactions: number;
  totalRevenue: number;
  platformRevenue: number;
  deviceOwnerRevenue: number;
  averageTransactionAmount: number;
  currency: 'SOL' | 'USDC';
}

// Default Configuration
export const defaultPaymentConfig: PaymentConfig = {
  facilitatorAddress: 'TEST_FACILITATOR_ADDRESS_123456789',
  platformFeePercentage: 5, // 5% platform fee
  defaultCurrency: 'SOL',
  gaslessEnabled: true,
  escrowEnabled: true,
  minimumPayment: 0.001, // 0.001 SOL
  maximumPayment: 100 // 100 SOL
};