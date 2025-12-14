/**
 * Enhanced UI System for SynapsePay
 * Supports real-time updates, mobile responsiveness, and multi-wallet integration
 */

export interface UIUpdateEvent {
  type: 'payment' | 'transaction' | 'balance' | 'notification' | 'status';
  data: any;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

export interface RealTimeUISystem {
  isConnected: boolean;
  activeConnections: number;
  updateQueue: UIUpdateEvent[];
  subscribers: Map<string, (event: UIUpdateEvent) => void>;
}

export interface MobileUIConfig {
  screenSize: 'small' | 'medium' | 'large';
  orientation: 'portrait' | 'landscape';
  touchEnabled: boolean;
  platform: 'ios' | 'android' | 'web';
}

export interface WalletIntegration {
  walletType: 'phantom' | 'solflare' | 'backpack' | 'coinbase' | 'ledger';
  isConnected: boolean;
  address?: string;
  balance?: number;
  supportedFeatures: string[];
}

export class EnhancedUISystem {
  private realTimeSystem: RealTimeUISystem;
  private mobileConfig: MobileUIConfig;
  private connectedWallets: Map<string, WalletIntegration> = new Map();
  private updateHistory: UIUpdateEvent[] = [];

  constructor(
    private config: {
      enableRealTime: boolean;
      enableMobile: boolean;
      enableMultiWallet: boolean;
      maxUpdateHistory: number;
      updateBatchSize: number;
    }
  ) {
    this.realTimeSystem = {
      isConnected: this.config.enableRealTime,
      activeConnections: 0,
      updateQueue: [],
      subscribers: new Map()
    };

    this.mobileConfig = {
      screenSize: 'medium',
      orientation: 'portrait',
      touchEnabled: false,
      platform: 'web'
    };
  }

  /**
   * Send real-time updates to UI
   */
  async sendRealTimeUpdate(update: UIUpdateEvent): Promise<{
    sent: boolean;
    deliveredTo: number;
    queueSize: number;
    timestamp: number;
  }> {
    if (!this.config.enableRealTime) {
      throw new Error('Real-time updates are not enabled');
    }

    const timestamp = Date.now();
    const enhancedUpdate = { ...update, timestamp };

    // Add to update queue
    this.realTimeSystem.updateQueue.push(enhancedUpdate);

    // Add to history
    this.updateHistory.push(enhancedUpdate);
    if (this.updateHistory.length > this.config.maxUpdateHistory) {
      this.updateHistory.splice(0, this.updateHistory.length - this.config.maxUpdateHistory);
    }

    // Deliver to subscribers
    let deliveredTo = 0;
    for (const [subscriberId, callback] of this.realTimeSystem.subscribers) {
      try {
        callback(enhancedUpdate);
        deliveredTo++;
      } catch (error) {
        console.error(`Failed to deliver update to subscriber ${subscriberId}:`, error);
      }
    }

    // Process queue in batches
    if (this.realTimeSystem.updateQueue.length >= this.config.updateBatchSize) {
      await this.processBatchUpdates();
    }

    return {
      sent: true,
      deliveredTo,
      queueSize: this.realTimeSystem.updateQueue.length,
      timestamp
    };
  }

  /**
   * Subscribe to real-time updates
   */
  subscribeToUpdates(subscriberId: string, callback: (event: UIUpdateEvent) => void): string {
    if (!this.config.enableRealTime) {
      throw new Error('Real-time updates are not enabled');
    }

    // Only increment if this is a new subscriber
    if (!this.realTimeSystem.subscribers.has(subscriberId)) {
      this.realTimeSystem.activeConnections++;
    }
    
    this.realTimeSystem.subscribers.set(subscriberId, callback);
    
    return subscriberId;
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribeFromUpdates(subscriberId: string): boolean {
    const existed = this.realTimeSystem.subscribers.has(subscriberId);
    if (existed) {
      this.realTimeSystem.subscribers.delete(subscriberId);
      this.realTimeSystem.activeConnections--;
    }
    return existed;
  }

  /**
   * Configure mobile UI settings
   */
  async configureMobileUI(config: Partial<MobileUIConfig>): Promise<{
    configured: boolean;
    activeConfig: MobileUIConfig;
    optimizationsApplied: string[];
  }> {
    if (!this.config.enableMobile) {
      throw new Error('Mobile UI is not enabled');
    }

    // Update mobile configuration
    this.mobileConfig = { ...this.mobileConfig, ...config };

    // Apply mobile-specific optimizations
    const optimizations: string[] = [];

    if (this.mobileConfig.screenSize === 'small') {
      optimizations.push('compact_layout', 'reduced_animations');
    }

    if (this.mobileConfig.touchEnabled) {
      optimizations.push('touch_gestures', 'larger_buttons');
    }

    if (this.mobileConfig.platform === 'ios' || this.mobileConfig.platform === 'android') {
      optimizations.push('native_scrolling', 'platform_styling');
    }

    return {
      configured: true,
      activeConfig: this.mobileConfig,
      optimizationsApplied: optimizations
    };
  }

  /**
   * Connect wallet integration
   */
  async connectWallet(walletType: WalletIntegration['walletType'], address: string): Promise<{
    connected: boolean;
    walletInfo: WalletIntegration;
    supportedFeatures: string[];
  }> {
    if (!this.config.enableMultiWallet) {
      throw new Error('Multi-wallet integration is not enabled');
    }

    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 1));

    const supportedFeatures = this.getWalletFeatures(walletType);
    
    const walletInfo: WalletIntegration = {
      walletType,
      isConnected: true,
      address,
      balance: Math.random() * 1000, // Mock balance
      supportedFeatures
    };

    this.connectedWallets.set(address, walletInfo);

    // Send real-time update about wallet connection
    if (this.config.enableRealTime) {
      await this.sendRealTimeUpdate({
        type: 'notification',
        data: { message: `${walletType} wallet connected`, address },
        timestamp: Date.now()
      });
    }

    return {
      connected: true,
      walletInfo,
      supportedFeatures
    };
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(address: string): Promise<boolean> {
    if (!this.config.enableMultiWallet) {
      throw new Error('Multi-wallet integration is not enabled');
    }

    const existed = this.connectedWallets.has(address);
    if (existed) {
      const wallet = this.connectedWallets.get(address)!;
      this.connectedWallets.delete(address);

      // Send real-time update about wallet disconnection
      if (this.config.enableRealTime) {
        await this.sendRealTimeUpdate({
          type: 'notification',
          data: { message: `${wallet.walletType} wallet disconnected`, address },
          timestamp: Date.now()
        });
      }
    }

    return existed;
  }

  /**
   * Get connected wallets
   */
  getConnectedWallets(): WalletIntegration[] {
    return Array.from(this.connectedWallets.values());
  }

  /**
   * Process batch updates
   */
  private async processBatchUpdates(): Promise<void> {
    const batch = this.realTimeSystem.updateQueue.splice(0, this.config.updateBatchSize);
    
    // Simulate batch processing
    await new Promise(resolve => setTimeout(resolve, 1));
    
    // In real implementation, this would send batch to UI components
    console.log(`Processed batch of ${batch.length} updates`);
  }

  /**
   * Get wallet-specific features
   */
  private getWalletFeatures(walletType: WalletIntegration['walletType']): string[] {
    const baseFeatures = ['send', 'receive', 'sign'];
    
    switch (walletType) {
      case 'phantom':
        return [...baseFeatures, 'swap', 'stake', 'nft'];
      case 'solflare':
        return [...baseFeatures, 'stake', 'governance'];
      case 'backpack':
        return [...baseFeatures, 'swap', 'nft', 'messaging'];
      case 'coinbase':
        return [...baseFeatures, 'swap', 'earn'];
      case 'ledger':
        return [...baseFeatures, 'hardware_security'];
      default:
        return baseFeatures;
    }
  }

  /**
   * Get system status
   */
  getSystemStatus(): {
    realTime: {
      enabled: boolean;
      connected: boolean;
      activeConnections: number;
      queueSize: number;
    };
    mobile: {
      enabled: boolean;
      config: MobileUIConfig;
    };
    wallets: {
      enabled: boolean;
      connectedCount: number;
      wallets: WalletIntegration[];
    };
    updateHistory: {
      totalUpdates: number;
      recentUpdates: UIUpdateEvent[];
    };
  } {
    return {
      realTime: {
        enabled: this.config.enableRealTime,
        connected: this.realTimeSystem.isConnected,
        activeConnections: this.realTimeSystem.activeConnections,
        queueSize: this.realTimeSystem.updateQueue.length
      },
      mobile: {
        enabled: this.config.enableMobile,
        config: this.mobileConfig
      },
      wallets: {
        enabled: this.config.enableMultiWallet,
        connectedCount: this.connectedWallets.size,
        wallets: this.getConnectedWallets()
      },
      updateHistory: {
        totalUpdates: this.updateHistory.length,
        recentUpdates: this.updateHistory.slice(-10)
      }
    };
  }
}