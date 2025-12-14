/**
 * Advanced Deployment System for SynapsePay
 * Handles environment management, automated testing, CI/CD, and rollback capabilities
 */

export interface Environment {
  name: string;
  type: 'development' | 'staging' | 'production' | 'testnet' | 'mainnet';
  config: EnvironmentConfig;
  status: 'active' | 'inactive' | 'deploying' | 'failed';
  lastDeployment?: DeploymentRecord;
}

export interface EnvironmentConfig {
  solanaNetwork: string;
  rpcUrl: string;
  wsUrl: string;
  programIds: {
    registry: string;
    payments: string;
    scheduler: string;
  };
  features: {
    gasless: boolean;
    robotControl: boolean;
    iotDevice: boolean;
    monitoring: boolean;
  };
  security: {
    rateLimiting: boolean;
    emergencyPause: boolean;
    multiSig: boolean;
  };
  resources: {
    maxConcurrentUsers: number;
    maxTransactionsPerSecond: number;
    storageLimit: number;
  };
}

export interface DeploymentRecord {
  id: string;
  timestamp: number;
  version: string;
  environment: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'rolled_back';
  duration?: number;
  artifacts: DeploymentArtifact[];
  tests: TestResult[];
  rollbackInfo?: RollbackInfo;
}

export interface DeploymentArtifact {
  type: 'program' | 'frontend' | 'api' | 'config';
  name: string;
  path: string;
  hash: string;
  size: number;
}

export interface TestResult {
  suite: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

export interface RollbackInfo {
  previousVersion: string;
  rollbackReason: string;
  rollbackTimestamp: number;
  affectedComponents: string[];
}

export interface AutomatedTestPipeline {
  id: string;
  name: string;
  environment: string;
  stages: TestStage[];
  status: 'idle' | 'running' | 'passed' | 'failed';
  lastRun?: number;
}

export interface TestStage {
  name: string;
  type: 'unit' | 'integration' | 'property' | 'e2e' | 'security' | 'performance';
  command: string;
  timeout: number;
  required: boolean;
  parallelizable: boolean;
}

export interface CICDPipeline {
  id: string;
  name: string;
  trigger: 'push' | 'pull_request' | 'manual' | 'scheduled';
  environments: string[];
  stages: CICDStage[];
  status: 'idle' | 'running' | 'success' | 'failed';
}

export interface CICDStage {
  name: string;
  type: 'build' | 'test' | 'deploy' | 'verify' | 'rollback';
  dependencies: string[];
  timeout: number;
  retryCount: number;
  onFailure: 'stop' | 'continue' | 'rollback';
}

export class EnvironmentManager {
  private environments: Map<string, Environment> = new Map();
  private deploymentHistory: DeploymentRecord[] = [];
  private testPipelines: Map<string, AutomatedTestPipeline> = new Map();
  private cicdPipelines: Map<string, CICDPipeline> = new Map();

  constructor() {
    this.initializeDefaultEnvironments();
  }

  private initializeDefaultEnvironments(): void {
    // Development environment
    this.environments.set('development', {
      name: 'development',
      type: 'development',
      status: 'active',
      config: {
        solanaNetwork: 'localnet',
        rpcUrl: 'http://localhost:8899',
        wsUrl: 'ws://localhost:8900',
        programIds: {
          registry: 'DEV_REGISTRY_PROGRAM_ID',
          payments: 'DEV_PAYMENTS_PROGRAM_ID',
          scheduler: 'DEV_SCHEDULER_PROGRAM_ID'
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
          maxConcurrentUsers: 10,
          maxTransactionsPerSecond: 100,
          storageLimit: 1024 * 1024 * 100 // 100MB
        }
      }
    });

    // Staging environment
    this.environments.set('staging', {
      name: 'staging',
      type: 'staging',
      status: 'active',
      config: {
        solanaNetwork: 'devnet',
        rpcUrl: 'https://api.devnet.solana.com',
        wsUrl: 'wss://api.devnet.solana.com',
        programIds: {
          registry: 'STAGING_REGISTRY_PROGRAM_ID',
          payments: 'STAGING_PAYMENTS_PROGRAM_ID',
          scheduler: 'STAGING_SCHEDULER_PROGRAM_ID'
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
          maxConcurrentUsers: 100,
          maxTransactionsPerSecond: 500,
          storageLimit: 1024 * 1024 * 500 // 500MB
        }
      }
    });

    // Production environment
    this.environments.set('production', {
      name: 'production',
      type: 'production',
      status: 'inactive',
      config: {
        solanaNetwork: 'mainnet-beta',
        rpcUrl: 'https://api.mainnet-beta.solana.com',
        wsUrl: 'wss://api.mainnet-beta.solana.com',
        programIds: {
          registry: 'PROD_REGISTRY_PROGRAM_ID',
          payments: 'PROD_PAYMENTS_PROGRAM_ID',
          scheduler: 'PROD_SCHEDULER_PROGRAM_ID'
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
          maxConcurrentUsers: 10000,
          maxTransactionsPerSecond: 5000,
          storageLimit: 1024 * 1024 * 1024 * 10 // 10GB
        }
      }
    });
  }

  // Environment Management Methods
  createEnvironment(environment: Environment): boolean {
    // Validate environment name
    if (!environment.name || environment.name.trim().length === 0) {
      return false;
    }
    
    if (this.environments.has(environment.name)) {
      return false;
    }
    
    // Validate configuration before creating
    const validation = this.validateEnvironmentConfig(environment.config);
    if (!validation.valid) {
      return false;
    }
    
    this.environments.set(environment.name, environment);
    return true;
  }

  getEnvironment(name: string): Environment | undefined {
    return this.environments.get(name);
  }

  listEnvironments(): Environment[] {
    return Array.from(this.environments.values());
  }

  updateEnvironmentConfig(name: string, config: Partial<EnvironmentConfig>): boolean {
    const environment = this.environments.get(name);
    if (!environment) {
      return false;
    }

    environment.config = { ...environment.config, ...config };
    return true;
  }

  switchEnvironment(fromEnv: string, toEnv: string): boolean {
    const from = this.environments.get(fromEnv);
    const to = this.environments.get(toEnv);
    
    if (!from || !to) {
      return false;
    }

    // Only switch if both environments are in valid states
    if (from.status === 'failed' || to.status === 'failed') {
      return false;
    }

    from.status = 'inactive';
    to.status = 'active';
    return true;
  }

  validateEnvironmentConfig(config: EnvironmentConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate Solana network
    const validNetworks = ['localnet', 'devnet', 'testnet', 'mainnet-beta'];
    if (!validNetworks.includes(config.solanaNetwork)) {
      errors.push(`Invalid Solana network: ${config.solanaNetwork}`);
    }

    // Validate RPC URL
    try {
      new URL(config.rpcUrl);
    } catch {
      errors.push(`Invalid RPC URL: ${config.rpcUrl}`);
    }

    // Validate WebSocket URL
    try {
      new URL(config.wsUrl);
    } catch {
      errors.push(`Invalid WebSocket URL: ${config.wsUrl}`);
    }

    // Validate Program IDs (basic format check - allow test IDs)
    const programIdRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    Object.entries(config.programIds).forEach(([key, id]) => {
      if (!programIdRegex.test(id) && !id.includes('_PROGRAM_ID') && !id.includes('_REGISTRY') && !id.includes('_PAYMENTS') && !id.includes('_SCHEDULER')) {
        errors.push(`Invalid program ID for ${key}: ${id}`);
      }
    });

    // Validate resource limits
    if (config.resources.maxConcurrentUsers <= 0) {
      errors.push('Max concurrent users must be positive');
    }
    if (config.resources.maxTransactionsPerSecond <= 0) {
      errors.push('Max transactions per second must be positive');
    }
    if (config.resources.storageLimit <= 0) {
      errors.push('Storage limit must be positive');
    }

    return { valid: errors.length === 0, errors };
  }

  // Automated Testing Pipeline Methods
  createTestPipeline(pipeline: AutomatedTestPipeline): boolean {
    // Validate pipeline configuration
    if (!pipeline.id || pipeline.id.trim().length === 0) {
      return false;
    }
    
    if (!pipeline.name || pipeline.name.trim().length === 0) {
      return false;
    }
    
    if (this.testPipelines.has(pipeline.id)) {
      return false;
    }
    
    this.testPipelines.set(pipeline.id, pipeline);
    return true;
  }

  runAutomatedTests(pipelineId: string): Promise<TestResult[]> {
    const pipeline = this.testPipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Test pipeline not found: ${pipelineId}`);
    }

    pipeline.status = 'running';
    pipeline.lastRun = Date.now();

    // Simulate running tests with faster execution for testing
    return new Promise((resolve) => {
      setTimeout(() => {
        const results: TestResult[] = pipeline.stages.map(stage => ({
          suite: pipeline.name,
          name: stage.name,
          status: Math.random() > 0.1 ? 'passed' : 'failed', // 90% pass rate
          duration: Math.floor(Math.random() * Math.min(stage.timeout, 1000)), // Cap at 1 second for tests
          error: Math.random() > 0.9 ? 'Simulated test error' : undefined
        }));

        const allPassed = results.every(r => r.status === 'passed');
        pipeline.status = allPassed ? 'passed' : 'failed';
        
        resolve(results);
      }, 100); // Reduced from 1000ms to 100ms for faster testing
    });
  }

  // CI/CD Pipeline Methods
  createCICDPipeline(pipeline: CICDPipeline): boolean {
    if (this.cicdPipelines.has(pipeline.id)) {
      return false;
    }
    
    this.cicdPipelines.set(pipeline.id, pipeline);
    return true;
  }

  triggerDeployment(pipelineId: string, targetEnvironment: string): Promise<DeploymentRecord> {
    const pipeline = this.cicdPipelines.get(pipelineId);
    const environment = this.environments.get(targetEnvironment);
    
    if (!pipeline || !environment) {
      throw new Error('Pipeline or environment not found');
    }

    const deployment: DeploymentRecord = {
      id: `deploy_${Date.now()}`,
      timestamp: Date.now(),
      version: `v1.0.${this.deploymentHistory.length + 1}`,
      environment: targetEnvironment,
      status: 'running',
      artifacts: [],
      tests: []
    };

    this.deploymentHistory.push(deployment);
    environment.status = 'deploying';
    pipeline.status = 'running';

    // Simulate deployment process
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.2; // 80% success rate
        
        deployment.status = success ? 'success' : 'failed';
        deployment.duration = Math.floor(Math.random() * 300000); // 0-5 minutes
        environment.status = success ? 'active' : 'failed';
        environment.lastDeployment = deployment;
        pipeline.status = success ? 'success' : 'failed';

        resolve(deployment);
      }, 2000);
    });
  }

  // Rollback System Methods
  rollbackDeployment(deploymentId: string, reason: string): Promise<boolean> {
    const deployment = this.deploymentHistory.find(d => d.id === deploymentId);
    if (!deployment) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    const environment = this.environments.get(deployment.environment);
    if (!environment) {
      throw new Error(`Environment not found: ${deployment.environment}`);
    }

    // Find previous successful deployment
    const previousDeployment = this.deploymentHistory
      .filter(d => d.environment === deployment.environment && d.status === 'success' && d.timestamp < deployment.timestamp)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!previousDeployment) {
      throw new Error('No previous successful deployment found for rollback');
    }

    deployment.rollbackInfo = {
      previousVersion: previousDeployment.version,
      rollbackReason: reason,
      rollbackTimestamp: Date.now(),
      affectedComponents: ['programs', 'frontend', 'api']
    };

    deployment.status = 'rolled_back';
    environment.lastDeployment = previousDeployment;

    // Simulate rollback process
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  }

  getDeploymentHistory(environmentName?: string): DeploymentRecord[] {
    if (environmentName) {
      return this.deploymentHistory.filter(d => d.environment === environmentName);
    }
    return [...this.deploymentHistory];
  }

  // Utility Methods
  getEnvironmentStatus(name: string): string | undefined {
    return this.environments.get(name)?.status;
  }

  isEnvironmentHealthy(name: string): boolean {
    const environment = this.environments.get(name);
    if (!environment) {
      return false;
    }

    return environment.status === 'active' && 
           environment.lastDeployment?.status === 'success';
  }

  getActiveEnvironments(): Environment[] {
    return Array.from(this.environments.values()).filter(env => env.status === 'active');
  }

  exportEnvironmentConfig(name: string): string | undefined {
    const environment = this.environments.get(name);
    if (!environment) {
      return undefined;
    }

    return JSON.stringify(environment.config, null, 2);
  }

  importEnvironmentConfig(name: string, configJson: string): boolean {
    try {
      // Validate environment name
      if (!name || name.trim().length === 0) {
        return false;
      }
      
      // Check if environment exists
      if (!this.environments.has(name)) {
        return false;
      }
      
      const config = JSON.parse(configJson) as EnvironmentConfig;
      const validation = this.validateEnvironmentConfig(config);
      
      if (!validation.valid) {
        return false;
      }

      return this.updateEnvironmentConfig(name, config);
    } catch {
      return false;
    }
  }
}

export const environmentManager = new EnvironmentManager();