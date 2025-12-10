import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePayment } from '../../hooks/usePayment';
import { config } from '../../config';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    agentId: string;
    amountUsdc: number;
    durationSeconds?: number;
    taskParams?: Record<string, unknown>;
    onSuccess: (result: unknown) => void;
}

export default function PaymentModal({
    isOpen,
    onClose,
    agentId,
    amountUsdc,
    durationSeconds = 300,
    taskParams,
    onSuccess
}: PaymentModalProps) {
    const {
        executePayment,
        state: paymentState,
        error,
        logs,
        reset,
        isProcessing
    } = usePayment({
        facilitatorUrl: config.facilitatorUrl,
        resourceServerUrl: config.resourceServerUrl,
        network: config.solana.network,
    });

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            reset();
        }
    }, [isOpen, reset]);

    const handlePayment = async () => {
        const result = await executePayment(agentId, amountUsdc, durationSeconds, taskParams);
        if (result.success) {
            // Wait a moment for user to see success state
            setTimeout(() => {
                onSuccess(result.result);
                // Don't close immediately, let parent handle it or close manually
            }, 1000);
        }
    };

    if (!isOpen) return null;

    const steps = [
        { id: 'creating_invoice', label: 'Create Invoice', description: 'Generating payment request' },
        { id: 'awaiting_signature', label: 'Sign Intent', description: 'Authorize payment (Gasless)' },
        { id: 'settling', label: 'Settlement', description: 'Facilitator executing tx' },
        { id: 'executing', label: 'Execute Task', description: 'Agent performing task' },
    ];

    const getStepStatus = (stepId: string) => {
        const stepOrder = ['idle', 'creating_invoice', 'awaiting_signature', 'settling', 'executing', 'completed'];
        const currentIndex = stepOrder.indexOf(paymentState === 'failed' ? 'idle' : paymentState);
        const stepIndex = stepOrder.indexOf(stepId);

        if (stepIndex < currentIndex) return 'complete';
        if (stepIndex === currentIndex) return 'active';
        return 'pending';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg glass-card p-6 relative"
            >
                {/* Close Button */}
                {!isProcessing && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                <h3 className="text-2xl font-bold text-white mb-2">Secure Payment</h3>
                <p className="text-gray-400 mb-6">
                    Pay <span className="text-synapse-green font-mono">{amountUsdc} USDC</span> via X402 Protocol
                </p>

                {/* Steps */}
                <div className="space-y-3 mb-6">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className={`flex items-center p-3 rounded-lg border transition-colors ${getStepStatus(step.id) === 'complete'
                                ? 'border-synapse-green/30 bg-synapse-green/5'
                                : getStepStatus(step.id) === 'active'
                                    ? 'border-synapse-purple/50 bg-synapse-purple/10'
                                    : 'border-dark-border bg-dark-bg/30'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs mr-3 ${getStepStatus(step.id) === 'complete'
                                ? 'bg-synapse-green text-dark-bg'
                                : getStepStatus(step.id) === 'active'
                                    ? 'bg-synapse-purple text-white animate-pulse'
                                    : 'bg-dark-border text-gray-500'
                                }`}>
                                {getStepStatus(step.id) === 'complete' ? '✓' : index + 1}
                            </div>
                            <div>
                                <h4 className={`text-sm font-medium ${getStepStatus(step.id) === 'pending' ? 'text-gray-500' : 'text-white'
                                    }`}>
                                    {step.label}
                                </h4>
                                <p className="text-xs text-gray-500">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Logs Terminal */}
                <div className="bg-black/50 rounded-lg p-3 mb-6 h-32 overflow-y-auto font-mono text-xs border border-dark-border">
                    {logs.length === 0 ? (
                        <p className="text-gray-600">Waiting to start...</p>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className={`mb-1 ${log.type === 'error' ? 'text-red-400' :
                                log.type === 'success' ? 'text-synapse-green' : 'text-gray-400'
                                }`}>
                                <span className="text-gray-600">[{log.timestamp}]</span> {log.message}
                            </div>
                        ))
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-6 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    {paymentState === 'idle' || paymentState === 'failed' ? (
                        <button
                            onClick={handlePayment}
                            className="w-full py-3 bg-gradient-to-r from-synapse-purple to-synapse-orange rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
                        >
                            {paymentState === 'failed' ? 'Retry Payment' : 'Confirm & Pay'}
                        </button>
                    ) : (
                        <button disabled className="w-full py-3 bg-dark-border rounded-lg font-semibold text-gray-400 cursor-not-allowed">
                            {paymentState === 'completed' ? 'Payment Successful' : 'Processing...'}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
