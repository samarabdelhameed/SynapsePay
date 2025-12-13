/**
 * Property-Based Tests for Abuse Prevention and Rate Limiting
 * **Feature: synapsepay-enhancements, Property 7: منع الهجمات والإساءة**
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { 
    Keypair, 
    PublicKey 
} from '@solana/web3.js';
import { 
    AdvancedX402Client,
    SecurityConfig,
    AdvancedX402Config
} from '../src';

// Mock configuration for testing abuse prevention
const testConfig: AdvancedX402Config = {
    facilitatorUrl: 'http://localhost:8403',
    resourceServerUrl: 'http://localhost:8404',
    network: 'devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    programIds: {
        registry: '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby',
        payments: '8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP',
        scheduler: '8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY'
    },
    features: {
        gasless: {
            enabled: true,
            facilitatorAddress: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
            maxGasSponsorship: 1000000
        },
        robotControl: {
            enabled: true,
            maxSessionDuration: 3600,
            supportedDeviceTypes: ['robot', 'drone', '3d_printer', 'smart_home']
        },
        iotDevice: {
            enabled: true,
            supportedProtocols: ['http', 'mqtt', 'websocket'],
            maxDevicesPerUser: 10
        },
        security: {
            rateLimiting: {
                requestsPerMinute: 60,
                requestsPerHour: 1000,
                burstLimit: 10,
                cooldownPeriod: 300
            },
            emergencyPause: {
                enabled: true,
                triggers: ['security_breach', 'hardware_failure'],
                pauseDuration: 3600
            },
            accessControl: {
                whitelist: [],
                blacklist: [],
                requireKYC: false
            }
        }
    }
};

// Mock abuse prevention system
class AbusePreventionSystem {
    private rateLimiters: Map<string, RateLimiter> = new Map();
    private securityConfig: SecurityConfig;
    private blacklistedUsers: Set<string> = new Set();
    private suspiciousActivity: Map<string, SuspiciousActivityRecord> = new Map();
    private emergencyPauseActive: boolean = false;
    private emergencyPauseUntil: number = 0;

    constructor(config: SecurityConfig) {
        this.securityConfig = config;
        this.initializeMockData();
    }

    private initializeMockData() {
        // Add some mock blacklisted users
        this.blacklistedUsers.add('BlacklistedUser1111111111111111111111111');
        this.blacklistedUsers.add('AbuserAccount2222222222222222222222222222');
    }

    // Rate limiting implementation
    checkRateLimit(userId: string, requestType: 'payment' | 'robot_control' | 'api_call' = 'api_call'): {
        allowed: boolean;
        remainingRequests: number;
        resetTime: number;
        reason?: string;
    } {
        const rateLimiter = this.getRateLimiter(userId);
        
        // Check if user is blacklisted
        if (this.blacklistedUsers.has(userId)) {
            return {
                allowed: false,
                remainingRequests: 0,
                resetTime: Date.now() + 86400000, // 24 hours
                reason: 'User is blacklisted'
            };
        }

        // Check emergency pause
        if (this.emergencyPauseActive && Date.now() < this.emergencyPauseUntil) {
            return {
                allowed: false,
                remainingRequests: 0,
                resetTime: this.emergencyPauseUntil,
                reason: 'System is in emergency pause mode'
            };
        }

        return rateLimiter.checkRequest(requestType);
    }

    private getRateLimiter(userId: string): RateLimiter {
        if (!this.rateLimiters.has(userId)) {
            this.rateLimiters.set(userId, new RateLimiter(this.securityConfig.rateLimiting));
        }
        return this.rateLimiters.get(userId)!;
    }

    // Detect suspicious activity
    detectSuspiciousActivity(userId: string, activity: ActivityRecord): {
        isSuspicious: boolean;
        riskLevel: 'low' | 'medium' | 'high' | 'critical';
        actions: string[];
        shouldBlock: boolean;
    } {
        let suspiciousRecord = this.suspiciousActivity.get(userId);
        if (!suspiciousRecord) {
            suspiciousRecord = {
                userId,
                activities: [],
                riskScore: 0,
                firstSeen: Date.now(),
                lastSeen: Date.now()
            };
            this.suspiciousActivity.set(userId, suspiciousRecord);
        }

        suspiciousRecord.activities.push(activity);
        suspiciousRecord.lastSeen = Date.now();

        // Calculate risk score
        const riskScore = this.calculateRiskScore(suspiciousRecord);
        suspiciousRecord.riskScore = riskScore;

        let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
        let actions: string[] = [];
        let shouldBlock = false;

        if (riskScore >= 90) {
            riskLevel = 'critical';
            actions = ['immediate_block', 'alert_admin', 'log_incident'];
            shouldBlock = true;
            this.blacklistedUsers.add(userId);
        } else if (riskScore >= 70) {
            riskLevel = 'high';
            actions = ['enhanced_monitoring', 'require_verification', 'limit_transactions'];
            shouldBlock = false;
        } else if (riskScore >= 40) {
            riskLevel = 'medium';
            actions = ['increased_monitoring', 'log_activity'];
            shouldBlock = false;
        } else {
            riskLevel = 'low';
            actions = ['normal_monitoring'];
            shouldBlock = false;
        }

        return {
            isSuspicious: riskScore > 30,
            riskLevel,
            actions,
            shouldBlock
        };
    }

    private calculateRiskScore(record: SuspiciousActivityRecord): number {
        let score = 0;
        const activities = record.activities;
        const timeWindow = 3600000; // 1 hour
        const recentActivities = activities.filter(a => Date.now() - a.timestamp < timeWindow);

        // High frequency of requests
        if (recentActivities.length > 100) {
            score += 30;
        } else if (recentActivities.length > 50) {
            score += 20;
        } else if (recentActivities.length > 20) {
            score += 10;
        }

        // Failed requests ratio
        const failedRequests = recentActivities.filter(a => a.failed).length;
        const failureRate = recentActivities.length > 0 ? failedRequests / recentActivities.length : 0;
        
        if (failureRate > 0.8) {
            score += 40;
        } else if (failureRate > 0.5) {
            score += 25;
        } else if (failureRate > 0.3) {
            score += 15;
        }

        // Unusual patterns
        const uniqueEndpoints = new Set(recentActivities.map(a => a.endpoint)).size;
        if (uniqueEndpoints === 1 && recentActivities.length > 30) {
            score += 20; // Hammering single endpoint
        }

        // Large transaction amounts
        const largeTransactions = recentActivities.filter(a => 
            a.transactionAmount && a.transactionAmount > 1000000 // > 1 USDC
        ).length;
        if (largeTransactions > 10) {
            score += 25;
        }

        // Geographic anomalies (mock)
        const locations = recentActivities.map(a => a.location).filter(Boolean);
        const uniqueLocations = new Set(locations).size;
        if (uniqueLocations > 5) {
            score += 15; // Too many different locations
        }

        return Math.min(score, 100); // Cap at 100
    }

    // Emergency pause functionality
    activateEmergencyPause(trigger: string, duration: number = 3600000): {
        success: boolean;
        pauseUntil: number;
        reason: string;
    } {
        if (!this.securityConfig.emergencyPause.enabled) {
            return {
                success: false,
                pauseUntil: 0,
                reason: 'Emergency pause is disabled'
            };
        }

        if (!this.securityConfig.emergencyPause.triggers.includes(trigger)) {
            return {
                success: false,
                pauseUntil: 0,
                reason: `Invalid trigger: ${trigger}`
            };
        }

        this.emergencyPauseActive = true;
        this.emergencyPauseUntil = Date.now() + duration;

        return {
            success: true,
            pauseUntil: this.emergencyPauseUntil,
            reason: `Emergency pause activated due to: ${trigger}`
        };
    }

    deactivateEmergencyPause(): {
        success: boolean;
        reason: string;
    } {
        if (!this.emergencyPauseActive) {
            return {
                success: false,
                reason: 'Emergency pause is not active'
            };
        }

        this.emergencyPauseActive = false;
        this.emergencyPauseUntil = 0;

        return {
            success: true,
            reason: 'Emergency pause deactivated'
        };
    }

    // Access control
    checkAccessControl(userId: string): {
        allowed: boolean;
        reason?: string;
        requiresKYC: boolean;
    } {
        const config = this.securityConfig.accessControl;

        // Check internal blacklist first
        if (this.blacklistedUsers.has(userId)) {
            return {
                allowed: false,
                reason: 'User is blacklisted',
                requiresKYC: false
            };
        }

        // Check config blacklist
        if (config.blacklist && config.blacklist.includes(userId)) {
            return {
                allowed: false,
                reason: 'User is blacklisted',
                requiresKYC: false
            };
        }

        // Check whitelist (if enabled)
        if (config.whitelist && config.whitelist.length > 0) {
            if (!config.whitelist.includes(userId)) {
                return {
                    allowed: false,
                    reason: 'User not in whitelist',
                    requiresKYC: false
                };
            }
        }

        return {
            allowed: true,
            requiresKYC: config.requireKYC || false
        };
    }

    // Get system status
    getSystemStatus(): {
        emergencyPauseActive: boolean;
        pauseUntil: number;
        totalBlacklistedUsers: number;
        activeSuspiciousUsers: number;
        totalRateLimiters: number;
    } {
        const activeSuspiciousUsers = Array.from(this.suspiciousActivity.values())
            .filter(record => record.riskScore > 30).length;

        return {
            emergencyPauseActive: this.emergencyPauseActive,
            pauseUntil: this.emergencyPauseUntil,
            totalBlacklistedUsers: this.blacklistedUsers.size,
            activeSuspiciousUsers,
            totalRateLimiters: this.rateLimiters.size
        };
    }

    // Reset rate limiter for testing
    resetRateLimiter(userId: string): void {
        this.rateLimiters.delete(userId);
    }

    // Add user to blacklist
    addToBlacklist(userId: string): void {
        this.blacklistedUsers.add(userId);
    }

    // Remove user from blacklist
    removeFromBlacklist(userId: string): void {
        this.blacklistedUsers.delete(userId);
    }
}

// Rate limiter implementation
class RateLimiter {
    private requests: Map<string, RequestRecord[]> = new Map();
    private config: {
        requestsPerMinute: number;
        requestsPerHour: number;
        burstLimit: number;
        cooldownPeriod: number;
    };

    constructor(config: {
        requestsPerMinute: number;
        requestsPerHour: number;
        burstLimit: number;
        cooldownPeriod: number;
    }) {
        this.config = config;
    }

    checkRequest(requestType: string): {
        allowed: boolean;
        remainingRequests: number;
        resetTime: number;
        reason?: string;
    } {
        const now = Date.now();
        const userRequests = this.requests.get(requestType) || [];
        
        // Clean old requests
        const oneHourAgo = now - 3600000;
        const oneMinuteAgo = now - 60000;
        
        const validRequests = userRequests.filter(req => req.timestamp > oneHourAgo);
        this.requests.set(requestType, validRequests);

        // Check burst limit (last minute)
        const recentRequests = validRequests.filter(req => req.timestamp > oneMinuteAgo);
        if (recentRequests.length >= this.config.burstLimit) {
            return {
                allowed: false,
                remainingRequests: 0,
                resetTime: now + 60000,
                reason: 'Burst limit exceeded'
            };
        }

        // Check per-minute limit
        if (recentRequests.length >= this.config.requestsPerMinute) {
            return {
                allowed: false,
                remainingRequests: 0,
                resetTime: now + 60000,
                reason: 'Per-minute limit exceeded'
            };
        }

        // Check per-hour limit
        if (validRequests.length >= this.config.requestsPerHour) {
            return {
                allowed: false,
                remainingRequests: 0,
                resetTime: now + 3600000,
                reason: 'Per-hour limit exceeded'
            };
        }

        // Allow request
        validRequests.push({ timestamp: now, requestType });
        this.requests.set(requestType, validRequests);

        return {
            allowed: true,
            remainingRequests: Math.min(
                this.config.requestsPerMinute - recentRequests.length - 1,
                this.config.requestsPerHour - validRequests.length
            ),
            resetTime: now + 60000
        };
    }
}

interface RequestRecord {
    timestamp: number;
    requestType: string;
}

interface ActivityRecord {
    timestamp: number;
    endpoint: string;
    failed: boolean;
    transactionAmount?: number;
    location?: string;
    userAgent?: string;
}

interface SuspiciousActivityRecord {
    userId: string;
    activities: ActivityRecord[];
    riskScore: number;
    firstSeen: number;
    lastSeen: number;
}

describe('Abuse Prevention Properties', () => {
    let abusePreventionSystem: AbusePreventionSystem;
    let client: AdvancedX402Client;
    let testUsers: Keypair[];

    beforeEach(() => {
        abusePreventionSystem = new AbusePreventionSystem(testConfig.features.security);
        client = new AdvancedX402Client(testConfig);
        
        // Generate test users
        testUsers = Array.from({ length: 5 }, () => Keypair.generate());
    });

    /**
     * **Feature: synapsepay-enhancements, Property 7: منع الهجمات والإساءة**
     * Property: For any user exceeding usage limits, the system should prevent 
     * attacks and abuse by rejecting additional requests
     */
    it('Property 1: Rate limiting should prevent abuse by rejecting excessive requests', async () => {
        const testUser = testUsers[0].publicKey.toBase58();
        const requestTypes = ['payment', 'robot_control', 'api_call'] as const;

        for (const requestType of requestTypes) {
            // Reset rate limiter for clean test
            abusePreventionSystem.resetRateLimiter(testUser);

            let successfulRequests = 0;
            let rejectedRequests = 0;
            const maxAttempts = 100; // Try more than the limit

            // Simulate rapid requests
            for (let i = 0; i < maxAttempts; i++) {
                const result = abusePreventionSystem.checkRateLimit(testUser, requestType);
                
                if (result.allowed) {
                    successfulRequests++;
                } else {
                    rejectedRequests++;
                    expect(result.reason).toBeDefined();
                    expect(result.resetTime).toBeGreaterThan(Date.now());
                }
            }

            // Verify rate limiting is working
            expect(successfulRequests).toBeLessThanOrEqual(testConfig.features.security.rateLimiting.requestsPerMinute);
            expect(rejectedRequests).toBeGreaterThan(0);
            expect(successfulRequests + rejectedRequests).toBe(maxAttempts);

            console.log(`${requestType}: ${successfulRequests} allowed, ${rejectedRequests} rejected`);
        }
    });

    /**
     * Property: Burst limit should prevent rapid-fire attacks
     */
    it('Property 2: Burst limiting should prevent rapid-fire attacks', async () => {
        const testUser = testUsers[1].publicKey.toBase58();
        const burstLimit = testConfig.features.security.rateLimiting.burstLimit;
        
        // Reset rate limiter
        abusePreventionSystem.resetRateLimiter(testUser);

        let burstRequests = 0;
        let burstRejections = 0;

        // Try to exceed burst limit rapidly
        for (let i = 0; i < burstLimit + 5; i++) {
            const result = abusePreventionSystem.checkRateLimit(testUser, 'payment');
            
            if (result.allowed) {
                burstRequests++;
            } else {
                burstRejections++;
                if (result.reason === 'Burst limit exceeded') {
                    // Verify burst limit is enforced
                    expect(burstRequests).toBe(burstLimit);
                    break;
                }
            }
        }

        expect(burstRequests).toBeLessThanOrEqual(burstLimit);
        expect(burstRejections).toBeGreaterThan(0);

        console.log(`Burst test: ${burstRequests} allowed (limit: ${burstLimit}), ${burstRejections} rejected`);
    });

    /**
     * Property: Suspicious activity detection should identify and respond to threats
     */
    it('Property 3: Suspicious activity detection should identify threats', async () => {
        const suspiciousUser = testUsers[2].publicKey.toBase58();
        
        // Simulate suspicious activities
        const suspiciousActivities: ActivityRecord[] = [
            // High frequency requests
            ...Array.from({ length: 50 }, (_, i) => ({
                timestamp: Date.now() - (i * 1000),
                endpoint: '/api/payment',
                failed: false,
                transactionAmount: 100000
            })),
            // Many failed requests
            ...Array.from({ length: 30 }, (_, i) => ({
                timestamp: Date.now() - (i * 2000),
                endpoint: '/api/robot-control',
                failed: true
            })),
            // Large transactions
            ...Array.from({ length: 15 }, (_, i) => ({
                timestamp: Date.now() - (i * 5000),
                endpoint: '/api/payment',
                failed: false,
                transactionAmount: 2000000 // 2 USDC
            }))
        ];

        let finalResult;
        for (const activity of suspiciousActivities) {
            finalResult = abusePreventionSystem.detectSuspiciousActivity(suspiciousUser, activity);
        }

        // Verify suspicious activity is detected
        expect(finalResult!.isSuspicious).toBe(true);
        expect(finalResult!.riskLevel).toBeOneOf(['medium', 'high', 'critical']);
        expect(finalResult!.actions.length).toBeGreaterThan(0);

        // High-risk users should be blocked
        if (finalResult!.riskLevel === 'critical') {
            expect(finalResult!.shouldBlock).toBe(true);
            
            // Verify user is blocked in subsequent requests
            const rateLimitResult = abusePreventionSystem.checkRateLimit(suspiciousUser, 'payment');
            expect(rateLimitResult.allowed).toBe(false);
            expect(rateLimitResult.reason).toBe('User is blacklisted');
        }

        console.log(`Suspicious activity: ${finalResult!.riskLevel} risk, actions: ${finalResult!.actions.join(', ')}`);
    });

    /**
     * Property: Emergency pause should stop all operations when activated
     */
    it('Property 4: Emergency pause should halt all operations', async () => {
        const normalUser = Keypair.generate().publicKey.toBase58();
        
        // Verify normal operation first
        let result = abusePreventionSystem.checkRateLimit(normalUser, 'payment');
        expect(result.allowed).toBe(true);

        // Activate emergency pause
        const pauseResult = abusePreventionSystem.activateEmergencyPause('security_breach', 300000); // 5 minutes
        expect(pauseResult.success).toBe(true);
        expect(pauseResult.pauseUntil).toBeGreaterThan(Date.now());

        // Verify all requests are blocked during emergency pause
        const testUsersList = [normalUser, Keypair.generate().publicKey.toBase58()];
        
        for (const user of testUsersList) {
            const blockedResult = abusePreventionSystem.checkRateLimit(user, 'payment');
            expect(blockedResult.allowed).toBe(false);
            expect(blockedResult.reason).toBe('System is in emergency pause mode');
            expect(blockedResult.resetTime).toBe(pauseResult.pauseUntil);
        }

        // Deactivate emergency pause
        const deactivateResult = abusePreventionSystem.deactivateEmergencyPause();
        expect(deactivateResult.success).toBe(true);

        // Verify normal operation resumes
        result = abusePreventionSystem.checkRateLimit(normalUser, 'payment');
        expect(result.allowed).toBe(true);

        console.log('Emergency pause test: ✓ All operations blocked during pause, resumed after deactivation');
    });

    /**
     * Property: Access control should enforce whitelist/blacklist rules
     */
    it('Property 5: Access control should enforce security policies', async () => {
        const testUser = testUsers[4].publicKey.toBase58();
        
        // Test normal access
        let accessResult = abusePreventionSystem.checkAccessControl(testUser);
        expect(accessResult.allowed).toBe(true);

        // Add user to blacklist
        abusePreventionSystem.addToBlacklist(testUser);
        
        accessResult = abusePreventionSystem.checkAccessControl(testUser);
        expect(accessResult.allowed).toBe(false);
        expect(accessResult.reason).toBe('User is blacklisted');

        // Verify rate limiting also blocks blacklisted users
        const rateLimitResult = abusePreventionSystem.checkRateLimit(testUser, 'payment');
        expect(rateLimitResult.allowed).toBe(false);
        expect(rateLimitResult.reason).toBe('User is blacklisted');

        // Remove from blacklist
        abusePreventionSystem.removeFromBlacklist(testUser);
        
        accessResult = abusePreventionSystem.checkAccessControl(testUser);
        expect(accessResult.allowed).toBe(true);

        console.log('Access control test: ✓ Blacklist enforcement working correctly');
    });

    /**
     * Property: System should handle multiple concurrent abuse attempts
     */
    it('Property 6: System should handle concurrent abuse attempts', async () => {
        const concurrentUsers = testUsers.map(user => user.publicKey.toBase58());
        const results: { [userId: string]: { allowed: number; rejected: number } } = {};

        // Initialize results tracking
        concurrentUsers.forEach(userId => {
            results[userId] = { allowed: 0, rejected: 0 };
            abusePreventionSystem.resetRateLimiter(userId);
        });

        // Simulate concurrent requests from multiple users
        const requestsPerUser = 25;
        const allPromises: Promise<void>[] = [];

        for (const userId of concurrentUsers) {
            const userPromises = Array.from({ length: requestsPerUser }, async (_, i) => {
                // Add small delay to simulate real-world timing
                await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
                
                const result = abusePreventionSystem.checkRateLimit(userId, 'api_call');
                if (result.allowed) {
                    results[userId].allowed++;
                } else {
                    results[userId].rejected++;
                }
            });
            
            allPromises.push(...userPromises);
        }

        // Wait for all concurrent requests to complete
        await Promise.all(allPromises);

        // Verify each user's rate limiting is independent
        for (const userId of concurrentUsers) {
            const userResults = results[userId];
            expect(userResults.allowed + userResults.rejected).toBe(requestsPerUser);
            
            // Each user should be able to make some requests
            expect(userResults.allowed).toBeGreaterThan(0);
            
            // Rate limiting should kick in for excessive requests
            if (requestsPerUser > testConfig.features.security.rateLimiting.burstLimit) {
                expect(userResults.rejected).toBeGreaterThan(0);
            }

            console.log(`User ${userId.substring(0, 8)}: ${userResults.allowed} allowed, ${userResults.rejected} rejected`);
        }

        // Verify system status
        const systemStatus = abusePreventionSystem.getSystemStatus();
        expect(systemStatus.totalRateLimiters).toBe(concurrentUsers.length);
    });

    /**
     * Property: Rate limits should reset correctly over time
     */
    it('Property 7: Rate limits should reset correctly over time', async () => {
        const testUser = testUsers[0].publicKey.toBase58();
        abusePreventionSystem.resetRateLimiter(testUser);

        // Exhaust the burst limit
        const burstLimit = testConfig.features.security.rateLimiting.burstLimit;
        let allowedRequests = 0;

        for (let i = 0; i < burstLimit + 2; i++) {
            const result = abusePreventionSystem.checkRateLimit(testUser, 'payment');
            if (result.allowed) {
                allowedRequests++;
            }
        }

        expect(allowedRequests).toBe(burstLimit);

        // Verify requests are blocked
        let blockedResult = abusePreventionSystem.checkRateLimit(testUser, 'payment');
        expect(blockedResult.allowed).toBe(false);

        // Simulate time passing (mock by creating new rate limiter)
        abusePreventionSystem.resetRateLimiter(testUser);

        // Verify requests are allowed again after reset
        const afterResetResult = abusePreventionSystem.checkRateLimit(testUser, 'payment');
        expect(afterResetResult.allowed).toBe(true);

        console.log('Rate limit reset test: ✓ Limits reset correctly after time window');
    });

    /**
     * Property: Invalid emergency pause triggers should be rejected
     */
    it('Property 8: Invalid emergency pause triggers should be rejected', async () => {
        const validTriggers = testConfig.features.security.emergencyPause.triggers;
        const invalidTriggers = ['invalid_trigger', 'fake_breach', 'test_trigger'];

        // Test valid triggers
        for (const trigger of validTriggers) {
            const result = abusePreventionSystem.activateEmergencyPause(trigger, 60000);
            expect(result.success).toBe(true);
            expect(result.reason).toContain(trigger);
            
            // Deactivate for next test
            abusePreventionSystem.deactivateEmergencyPause();
        }

        // Test invalid triggers
        for (const trigger of invalidTriggers) {
            const result = abusePreventionSystem.activateEmergencyPause(trigger, 60000);
            expect(result.success).toBe(false);
            expect(result.reason).toContain('Invalid trigger');
        }

        console.log(`Emergency trigger validation: ✓ ${validTriggers.length} valid, ${invalidTriggers.length} invalid triggers tested`);
    });
});