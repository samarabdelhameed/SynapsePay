/**
 * Basic Tests for Deployment System
 * Verifies core functionality is working
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { 
    EnvironmentManager,
    Environment,
    EnvironmentConfig,
    AutomatedTestPipeline,
    TestStage
} from '../src/deployment-system';

describe('Deployment System Basic Tests', () => {
    let envManager: EnvironmentManager;

    beforeEach(() => {
        envManager = new EnvironmentManager();
    });

    it('should create and manage environments', () => {
        const testEnv: Environment = {
            name: 'test-env',
            type: 'development',
            config: {
                solanaNetwork: 'devnet',
                rpcUrl: 'https://api.devnet.solana.com',
                wsUrl: 'wss://api.devnet.solana.com',
                programIds: {
                    registry: 'TEST_REGISTRY_ID',
                    payments: 'TEST_PAYMENTS_ID',
                    scheduler: 'TEST_SCHEDULER_ID'
                },
                features: {
                    gasless: true,
                    robotControl: true,
                    iotDevice: true,
                    monitoring: true
                },
                security: {
                    rateLimiting: false,
                    emergencyPause: true,
                    multiSig: false
                },
                resources: {
                    maxConcurrentUsers: 100,
                    maxTransactionsPerSecond: 500,
                    storageLimit: 1024 * 1024
                }
            },
            status: 'inactive'
        };

        // Create environment
        const created = envManager.createEnvironment(testEnv);
        expect(created).toBe(true);

        // Retrieve environment
        const retrieved = envManager.getEnvironment('test-env');
        expect(retrieved).toBeDefined();
        expect(retrieved!.name).toBe('test-env');
        expect(retrieved!.type).toBe('development');
    });

    it('should create and run test pipelines', async () => {
        const pipeline: AutomatedTestPipeline = {
            id: 'test-pipeline',
            name: 'Test Pipeline',
            environment: 'development',
            stages: [
                {
                    name: 'unit_test',
                    type: 'unit',
                    command: 'npm test',
                    timeout: 30000,
                    required: true,
                    parallelizable: true
                }
            ],
            status: 'idle'
        };

        // Create pipeline
        const created = envManager.createTestPipeline(pipeline);
        expect(created).toBe(true);

        // Run tests
        const results = await envManager.runAutomatedTests('test-pipeline');
        expect(results).toBeDefined();
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('unit_test');
        expect(['passed', 'failed', 'skipped']).toContain(results[0].status);
    });

    it('should handle rollback operations', async () => {
        // Create environment with deployment history
        const testEnv: Environment = {
            name: 'rollback-test',
            type: 'staging',
            config: {
                solanaNetwork: 'devnet',
                rpcUrl: 'https://api.devnet.solana.com',
                wsUrl: 'wss://api.devnet.solana.com',
                programIds: {
                    registry: 'TEST_REGISTRY_ID',
                    payments: 'TEST_PAYMENTS_ID',
                    scheduler: 'TEST_SCHEDULER_ID'
                },
                features: {
                    gasless: true,
                    robotControl: true,
                    iotDevice: true,
                    monitoring: true
                },
                security: {
                    rateLimiting: true,
                    emergencyPause: true,
                    multiSig: true
                },
                resources: {
                    maxConcurrentUsers: 1000,
                    maxTransactionsPerSecond: 500,
                    storageLimit: 1024 * 1024 * 1024
                }
            },
            status: 'active'
        };

        envManager.createEnvironment(testEnv);

        // Add deployment history
        const previousDeployment = {
            id: 'deploy_v1',
            timestamp: Date.now() - 3600000,
            version: 'v1.0.0',
            environment: 'rollback-test',
            status: 'success' as const,
            duration: 300000,
            artifacts: [],
            tests: []
        };

        const currentDeployment = {
            id: 'deploy_v2',
            timestamp: Date.now(),
            version: 'v2.0.0',
            environment: 'rollback-test',
            status: 'failed' as const,
            duration: 180000,
            artifacts: [],
            tests: []
        };

        envManager['deploymentHistory'].push(previousDeployment);
        envManager['deploymentHistory'].push(currentDeployment);

        const env = envManager.getEnvironment('rollback-test')!;
        env.lastDeployment = currentDeployment;
        env.status = 'failed';

        // Perform rollback
        const rollbackResult = await envManager.rollbackDeployment('rollback-test', 'test_rollback');

        expect(rollbackResult).toBeDefined();
        expect(rollbackResult.success).toBe(true);
        expect(rollbackResult.rolledBackTo).toBe('v1.0.0');
    });

    it('should validate environment configurations', () => {
        const validConfig: EnvironmentConfig = {
            solanaNetwork: 'devnet',
            rpcUrl: 'https://api.devnet.solana.com',
            wsUrl: 'wss://api.devnet.solana.com',
            programIds: {
                registry: 'VALID_REGISTRY_ID',
                payments: 'VALID_PAYMENTS_ID',
                scheduler: 'VALID_SCHEDULER_ID'
            },
            features: {
                gasless: true,
                robotControl: true,
                iotDevice: true,
                monitoring: true
            },
            security: {
                rateLimiting: true,
                emergencyPause: true,
                multiSig: true
            },
            resources: {
                maxConcurrentUsers: 1000,
                maxTransactionsPerSecond: 500,
                storageLimit: 1024 * 1024
            }
        };

        const validation = envManager.validateEnvironmentConfig(validConfig);
        expect(validation.valid).toBe(true);
        expect(validation.errors.length).toBe(0);

        // Test invalid config
        const invalidConfig: EnvironmentConfig = {
            ...validConfig,
            solanaNetwork: 'invalid-network',
            rpcUrl: 'invalid-url',
            resources: {
                maxConcurrentUsers: -1,
                maxTransactionsPerSecond: 0,
                storageLimit: -100
            }
        };

        const invalidValidation = envManager.validateEnvironmentConfig(invalidConfig);
        expect(invalidValidation.valid).toBe(false);
        expect(invalidValidation.errors.length).toBeGreaterThan(0);
    });

    it('should list default environments', () => {
        const environments = envManager.listEnvironments();
        expect(environments.length).toBeGreaterThanOrEqual(3);
        
        const envNames = environments.map(env => env.name);
        expect(envNames).toContain('development');
        expect(envNames).toContain('staging');
        expect(envNames).toContain('production');
    });
});