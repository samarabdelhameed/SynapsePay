/**
 * X402 Robot Control Interface - Complete Example
 * Demonstrates the full robot control workflow
 */

import {
  X402RobotControlInterface,
  RobotControlDashboard,
  DeviceRegistrySystem,
  PaymentIntegrationSystem,
  defaultRobotControlConfig,
  defaultDashboardConfig,
  defaultRegistryConfig,
  defaultPaymentConfig
} from '../src';

async function demonstrateRobotControl() {
  console.log('🤖 X402 Robot Control Interface Demo');
  console.log('=====================================\n');

  // Initialize systems
  const robotControl = new X402RobotControlInterface(defaultRobotControlConfig);
  const dashboard = new RobotControlDashboard(robotControl, defaultDashboardConfig);
  const deviceRegistry = new DeviceRegistrySystem(defaultRegistryConfig);
  const paymentSystem = new PaymentIntegrationSystem(defaultPaymentConfig);

  try {
    // 1. Register a robot device
    console.log('1. Registering robot device...');
    const registration = {
      deviceInfo: {
        name: 'Industrial Robot Arm v2.0',
        type: 'robot_arm' as const,
        owner: 'robot_owner_address_123',
        capabilities: [
          {
            id: 'move_to_position',
            name: 'Move to Position',
            description: 'Move robot arm to specified coordinates',
            parameters: [
              { name: 'x', type: 'number' as const, required: true, description: 'X coordinate' },
              { name: 'y', type: 'number' as const, required: true, description: 'Y coordinate' },
              { name: 'z', type: 'number' as const, required: true, description: 'Z coordinate' },
              { name: 'speed', type: 'number' as const, required: false, defaultValue: 50, description: 'Movement speed (0-100)' }
            ],
            costPerExecution: 0.02,
            executionTimeMs: 3000,
            category: 'movement' as const
          },
          {
            id: 'grip_object',
            name: 'Grip Object',
            description: 'Activate gripper to hold object',
            parameters: [
              { name: 'force', type: 'number' as const, required: false, defaultValue: 50, description: 'Grip force (0-100)' }
            ],
            costPerExecution: 0.01,
            executionTimeMs: 1000,
            category: 'manipulation' as const
          }
        ],
        connectionInfo: {
          protocol: 'http' as const,
          endpoint: 'http://localhost:8080/robot-arm',
          credentials: {
            apiKey: 'demo_api_key_12345'
          }
        },
        pricing: {
          baseRate: 0.1,
          capabilityRates: {
            'move_to_position': 0.02,
            'grip_object': 0.01
          },
          currency: 'SOL' as const,
          billingModel: 'per_action' as const
        },
        metadata: {
          manufacturer: 'RoboTech Industries',
          model: 'RT-ARM-2000',
          serialNumber: 'RT2000-001',
          location: 'Factory Floor A'
        }
      },
      ownerSignature: 'demo_signature_12345',
      timestamp: Date.now()
    };

    const deviceId = await robotControl.registerDevice(registration);
    console.log(`✅ Device registered with ID: ${deviceId}`);

    // Simulate device coming online
    const device = robotControl.getDeviceInfo(deviceId)!;
    device.status = 'online';
    console.log(`✅ Device is now online`);

    // 2. Start a control session
    console.log('\n2. Starting control session...');
    const userId = 'user_address_456';
    const sessionId = await robotControl.startSession(deviceId, userId);
    console.log(`✅ Session started with ID: ${sessionId}`);

    // 3. Create payment request
    console.log('\n3. Creating payment request...');
    const paymentRequestId = await paymentSystem.createPaymentRequest(
      sessionId,
      deviceId,
      userId,
      device.owner,
      0.1, // 0.1 SOL
      'Robot control session payment'
    );
    console.log(`✅ Payment request created: ${paymentRequestId}`);

    // 4. Process payment
    console.log('\n4. Processing payment...');
    const transactionId = await paymentSystem.processPayment(
      paymentRequestId,
      userId
    );
    console.log(`✅ Payment processed: ${transactionId}`);

    // 5. Execute robot commands
    console.log('\n5. Executing robot commands...');
    
    // Move robot to position
    const moveResult = await robotControl.executeCommand(
      sessionId,
      'move_to_position',
      { x: 100, y: 50, z: 75, speed: 60 }
    );
    console.log(`✅ Move command result:`, moveResult);

    // Grip object
    const gripResult = await robotControl.executeCommand(
      sessionId,
      'grip_object',
      { force: 70 }
    );
    console.log(`✅ Grip command result:`, gripResult);

    // Move to another position
    const moveResult2 = await robotControl.executeCommand(
      sessionId,
      'move_to_position',
      { x: 200, y: 100, z: 50, speed: 40 }
    );
    console.log(`✅ Second move command result:`, moveResult2);

    // 6. Check session status and costs
    console.log('\n6. Session status and costs...');
    const activeSessions = robotControl.getActiveSessions();
    const currentSession = activeSessions.find(s => s.sessionId === sessionId);
    
    if (currentSession) {
      console.log(`📊 Session Status:`);
      console.log(`   - Commands executed: ${currentSession.commands.length}`);
      console.log(`   - Total cost: ${currentSession.totalCost} SOL`);
      console.log(`   - Session duration: ${Date.now() - currentSession.startTime}ms`);
    }

    // 7. Dashboard monitoring
    console.log('\n7. Dashboard monitoring...');
    dashboard.start();
    
    const dashboardState = dashboard.getState();
    console.log(`📊 Dashboard State:`);
    console.log(`   - Total devices: ${dashboardState.devices.length}`);
    console.log(`   - Active sessions: ${dashboardState.activeSessions.length}`);
    console.log(`   - Recent commands: ${dashboardState.recentCommands.length}`);
    console.log(`   - System alerts: ${dashboardState.alerts.length}`);

    const systemHealth = dashboard.getSystemHealth();
    console.log(`🏥 System Health: ${systemHealth.overall}`);
    console.log(`   - Online devices: ${systemHealth.deviceHealth.online}/${systemHealth.deviceHealth.total}`);

    // 8. Device metrics
    console.log('\n8. Device metrics...');
    const deviceMetrics = dashboard.getDeviceMetrics(deviceId);
    if (deviceMetrics) {
      console.log(`📈 Device Metrics:`);
      console.log(`   - Commands executed: ${deviceMetrics.commandsExecuted}`);
      console.log(`   - Total revenue: ${deviceMetrics.totalRevenue} SOL`);
      console.log(`   - Average response time: ${deviceMetrics.averageResponseTime}ms`);
      console.log(`   - Error rate: ${(deviceMetrics.errorRate * 100).toFixed(2)}%`);
    }

    // 9. Payment analytics
    console.log('\n9. Payment analytics...');
    const revenueAnalytics = paymentSystem.getRevenueAnalytics('day');
    console.log(`💰 Revenue Analytics (24h):`);
    console.log(`   - Total transactions: ${revenueAnalytics.totalTransactions}`);
    console.log(`   - Total revenue: ${revenueAnalytics.totalRevenue} ${revenueAnalytics.currency}`);
    console.log(`   - Platform revenue: ${revenueAnalytics.platformRevenue} ${revenueAnalytics.currency}`);
    console.log(`   - Device owner revenue: ${revenueAnalytics.deviceOwnerRevenue} ${revenueAnalytics.currency}`);

    // 10. End session and finalize payments
    console.log('\n10. Ending session...');
    const completedSession = await robotControl.endSession(sessionId);
    console.log(`✅ Session completed with total cost: ${completedSession.totalCost} SOL`);

    const paymentSummary = await paymentSystem.finalizeSessionPayments(sessionId);
    console.log(`💳 Payment Summary:`);
    console.log(`   - Total amount: ${paymentSummary.totalAmount} ${paymentSummary.currency}`);
    console.log(`   - Platform fees: ${paymentSummary.platformFees} ${paymentSummary.currency}`);
    console.log(`   - Net amount: ${paymentSummary.netAmount} ${paymentSummary.currency}`);
    console.log(`   - Transaction count: ${paymentSummary.transactionCount}`);

    // 11. Device registry statistics
    console.log('\n11. Device registry statistics...');
    const registryStats = deviceRegistry.getRegistryStats();
    console.log(`📋 Registry Statistics:`);
    console.log(`   - Total devices: ${registryStats.totalDevices}`);
    console.log(`   - Verified devices: ${registryStats.verificationStats.verified}`);
    console.log(`   - Average trust score: ${registryStats.averageTrustScore.toFixed(1)}`);
    console.log(`   - Total revenue: ${registryStats.totalRevenue} SOL`);

    dashboard.stop();
    console.log('\n🎉 Demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

// Run the demo
demonstrateRobotControl().catch(console.error);

export { demonstrateRobotControl };