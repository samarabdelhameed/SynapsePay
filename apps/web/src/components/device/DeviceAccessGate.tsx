import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeviceAccessGateProps {
    deviceName: string;
    priceUsdc: number;
    durationMinutes: number;
    onInitiatePayment: () => void;
    onAccessGranted: () => void;
    isProcessing?: boolean;
    walletConnected?: boolean;
}

type PaymentStep = 'idle' | 'signing_permit' | 'signing_intent' | 'settlement' | 'complete' | 'error';

interface LogEntry {
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
}

export default function DeviceAccessGate({
    deviceName: _deviceName,
    priceUsdc,
    durationMinutes,
    onInitiatePayment,
    onAccessGranted,
    isProcessing = false,
    walletConnected = false,
}: DeviceAccessGateProps) {
    const [currentStep, setCurrentStep] = useState<PaymentStep>('idle');
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = (message: string, type: LogEntry['type'] = 'info') => {
        const timestamp = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        setLogs(prev => [...prev, { timestamp, message, type }]);
    };

    // Simulate payment flow for demo
    const handleInitiatePayment = async () => {
        if (!walletConnected) return;

        onInitiatePayment();
        setLogs([]);

        // Step 1: Sign Permit
        setCurrentStep('signing_permit');
        addLog('Initiating X402 payment sequence...', 'info');
        addLog('Requesting USDC-SPL token approval signature...', 'info');
        await new Promise(r => setTimeout(r, 1500));
        addLog('✓ Permit signature received', 'success');

        // Step 2: Sign Intent
        setCurrentStep('signing_intent');
        addLog('Requesting payment intent signature...', 'info');
        await new Promise(r => setTimeout(r, 1500));
        addLog('✓ Payment intent signed', 'success');

        // Step 3: Settlement
        setCurrentStep('settlement');
        addLog('Submitting to Solana network...', 'info');
        addLog('Facilitator executing gasless transaction...', 'info');
        await new Promise(r => setTimeout(r, 2000));
        addLog(`✓ Payment settled: ${priceUsdc} USDC transferred`, 'success');
        addLog('✓ Access token issued', 'success');

        // Complete
        setCurrentStep('complete');
        addLog(`Device access granted for ${durationMinutes} minutes`, 'success');
        await new Promise(r => setTimeout(r, 500));
        onAccessGranted();
    };

    const steps = [
        { id: 'signing_permit', label: 'Sign Permit', description: 'Allow USDC transfer (Gasless)' },
        { id: 'signing_intent', label: 'Sign Intent', description: 'Authorize payment terms' },
        { id: 'settlement', label: 'Settlement', description: 'Facilitator executing tx' },
    ];

    const getStepStatus = (stepId: string) => {
        const stepOrder = ['idle', 'signing_permit', 'signing_intent', 'settlement', 'complete'];
        const currentIndex = stepOrder.indexOf(currentStep);
        const stepIndex = stepOrder.indexOf(stepId);

        if (stepIndex < currentIndex) return 'complete';
        if (stepIndex === currentIndex) return 'active';
        return 'pending';
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-synapse-purple/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-synapse-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Secure Access Gate</h2>
                            <p className="text-sm text-gray-400">X402 Micropayment Required</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-mono font-bold text-synapse-green">{priceUsdc.toFixed(2)} USDC</p>
                        <p className="text-sm text-synapse-green/70">For {durationMinutes} minutes control</p>
                    </div>
                </div>

                {/* Payment Steps */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className={`relative p-4 rounded-xl border transition-all duration-300 ${getStepStatus(step.id) === 'complete'
                                ? 'border-synapse-green/50 bg-synapse-green/10'
                                : getStepStatus(step.id) === 'active'
                                    ? 'border-synapse-purple/50 bg-synapse-purple/10'
                                    : 'border-dark-border bg-dark-bg/50'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${getStepStatus(step.id) === 'complete'
                                    ? 'bg-synapse-green text-dark-bg'
                                    : getStepStatus(step.id) === 'active'
                                        ? 'bg-synapse-purple text-white animate-pulse'
                                        : 'bg-dark-border text-gray-500'
                                    }`}>
                                    {getStepStatus(step.id) === 'complete' ? '✓' : index + 1}
                                </div>
                                <span className={`text-sm font-medium ${getStepStatus(step.id) === 'pending' ? 'text-gray-500' : 'text-white'
                                    }`}>
                                    {step.label}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400">{step.description}</p>
                        </div>
                    ))}
                </div>

                {/* Terminal/Logs */}
                <div className="bg-dark-bg rounded-xl border border-dark-border p-4 mb-6 h-40 overflow-y-auto font-mono text-sm">
                    {logs.length === 0 ? (
                        <p className="text-gray-500">Waiting for payment initiation...</p>
                    ) : (
                        <AnimatePresence>
                            {logs.map((log, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex gap-3 mb-1 ${log.type === 'success' ? 'text-synapse-green' :
                                        log.type === 'error' ? 'text-red-400' :
                                            log.type === 'warning' ? 'text-synapse-orange' :
                                                'text-gray-400'
                                        }`}
                                >
                                    <span className="text-gray-600">[{log.timestamp}]</span>
                                    <span>{log.message}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Action Button */}
                <motion.button
                    onClick={handleInitiatePayment}
                    disabled={!walletConnected || isProcessing || currentStep !== 'idle'}
                    className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-3 transition-all ${walletConnected && currentStep === 'idle'
                        ? 'bg-gradient-to-r from-synapse-purple to-synapse-orange hover:shadow-glow-purple cursor-pointer'
                        : 'bg-dark-border cursor-not-allowed opacity-50'
                        }`}
                    whileHover={walletConnected && currentStep === 'idle' ? { scale: 1.02 } : {}}
                    whileTap={walletConnected && currentStep === 'idle' ? { scale: 0.98 } : {}}
                >
                    {currentStep === 'idle' ? (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                <path strokeLinecap="round" strokeWidth="2" d="M12 8v8M8 12h8" />
                            </svg>
                            Initialize Payment Sequence
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </>
                    ) : currentStep === 'complete' ? (
                        <>
                            <svg className="w-5 h-5 text-synapse-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Access Granted
                        </>
                    ) : (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                        </>
                    )}
                </motion.button>

                {!walletConnected && (
                    <p className="text-center text-gray-400 text-sm mt-4">
                        Connect your wallet to initialize payment
                    </p>
                )}
            </motion.div>
        </div>
    );
}
