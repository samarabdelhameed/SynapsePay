import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePayment } from '../../hooks/usePayment';
import { config } from '../../config';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    agentId: string;
    agentName?: string;
    amountUsdc: number;
    durationSeconds?: number;
    taskParams?: Record<string, unknown>;
    onSuccess: (result: unknown) => void;
}

// Confetti particle component
const ConfettiParticle = ({ delay, color }: { delay: number; color: string }) => (
    <motion.div
        className="absolute w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
        initial={{
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1
        }}
        animate={{
            opacity: 0,
            y: [0, -100, 200],
            x: [0, Math.random() * 200 - 100],
            scale: [1, 1.2, 0.5],
            rotate: [0, 360, 720]
        }}
        transition={{
            duration: 2,
            delay,
            ease: "easeOut"
        }}
    />
);

// Success checkmark animation
const SuccessCheckmark = () => (
    <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
        className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-synapse-green to-emerald-400 flex items-center justify-center"
    >
        <motion.svg
            className="w-10 h-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
            />
        </motion.svg>
    </motion.div>
);

export default function PaymentModal({
    isOpen,
    onClose,
    agentId,
    agentName,
    amountUsdc,
    durationSeconds = 300,
    taskParams,
    onSuccess
}: PaymentModalProps) {
    const [txSignature, setTxSignature] = useState<string | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);

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
        demoMode: config.features.demoMode,
    });

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            reset();
            setTxSignature(null);
            setShowConfetti(false);
        }
    }, [isOpen, reset]);

    // Trigger confetti on success
    useEffect(() => {
        if (paymentState === 'completed') {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
        }
    }, [paymentState]);

    const handlePayment = async () => {
        const result = await executePayment(agentId, amountUsdc, durationSeconds, taskParams);
        if (result.success && result.txSignature) {
            setTxSignature(result.txSignature);
            // Don't auto-close, let user manually close after seeing success
            // User can click "Close" button or Explorer links
        }
    };

    const getSolanaExplorerUrl = (signature: string) => {
        const cluster = config.solana.network === 'mainnet-beta' ? '' : '?cluster=devnet';
        return `https://explorer.solana.com/tx/${signature}${cluster}`;
    };

    const getSolscanUrl = (signature: string) => {
        const cluster = config.solana.network === 'mainnet-beta' ? '' : '?cluster=devnet';
        return `https://solscan.io/tx/${signature}${cluster}`;
    };

    if (!isOpen) return null;

    const steps = [
        { id: 'creating_invoice', label: 'Create Invoice', description: 'Generating payment request', icon: '📝' },
        { id: 'awaiting_signature', label: 'Sign Intent', description: 'Authorize payment (Gasless)', icon: '✍️' },
        { id: 'settling', label: 'Settlement', description: 'X402 Facilitator processing', icon: '⚡' },
        { id: 'executing', label: 'Execute Task', description: 'AI Agent performing task', icon: '🤖' },
    ];

    const getStepStatus = (stepId: string) => {
        const stepOrder = ['idle', 'creating_invoice', 'awaiting_signature', 'settling', 'executing', 'completed'];
        const currentIndex = stepOrder.indexOf(paymentState === 'failed' ? 'idle' : paymentState);
        const stepIndex = stepOrder.indexOf(stepId);

        if (stepIndex < currentIndex) return 'complete';
        if (stepIndex === currentIndex) return 'active';
        return 'pending';
    };

    const confettiColors = ['#14F195', '#9945FF', '#F97316', '#3B82F6', '#EC4899'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            {/* Confetti */}
            <AnimatePresence>
                {showConfetti && (
                    <div className="fixed inset-0 pointer-events-none overflow-hidden">
                        {Array.from({ length: 50 }).map((_, i) => (
                            <div
                                key={i}
                                className="absolute"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: '50%'
                                }}
                            >
                                <ConfettiParticle
                                    delay={Math.random() * 0.5}
                                    color={confettiColors[i % confettiColors.length]}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-lg glass-card p-6 relative overflow-hidden"
            >
                {/* Gradient border animation */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-synapse-purple via-synapse-orange to-synapse-green opacity-20 blur-xl" />

                {/* Close Button */}
                {!isProcessing && paymentState !== 'completed' && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                <div className="relative z-10">
                    {/* Success State */}
                    {paymentState === 'completed' ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-4"
                        >
                            <SuccessCheckmark />
                            <h3 className="text-2xl font-bold text-white mb-2">Payment Successful! 🎉</h3>
                            <p className="text-gray-400 mb-6">
                                {agentName || agentId} executed successfully
                            </p>

                            {/* Transaction Details */}
                            <div className="bg-dark-bg/50 rounded-xl p-4 mb-6 border border-synapse-green/30">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-gray-400 text-sm">Amount Paid</span>
                                    <span className="text-synapse-green font-mono font-bold">{(amountUsdc * 0.02).toFixed(4)} SOL</span>
                                </div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-gray-400 text-sm">Network</span>
                                    <span className="text-white font-mono text-sm">Solana {config.solana.network}</span>
                                </div>
                                {txSignature && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm">Transaction</span>
                                        <span className="text-synapse-purple font-mono text-sm">
                                            {txSignature.slice(0, 8)}...{txSignature.slice(-8)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Demo Mode Warning - only shown when explicitly in demo mode */}
                            {config.features.demoMode && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4">
                                    <p className="text-yellow-500 text-sm flex items-center gap-2">
                                        <span>⚠️</span>
                                        <span><strong>Demo Mode:</strong> Simulated transaction. Start backend for real payments.</span>
                                    </p>
                                </div>
                            )}

                            {/* Explorer Links - Always shown when we have a real signature */}
                            {txSignature && (
                                <div className="flex gap-3 mb-6">
                                    <a
                                        href={getSolanaExplorerUrl(txSignature)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-3 px-4 bg-gradient-to-r from-[#9945FF] to-[#14F195] rounded-lg font-semibold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                        </svg>
                                        Solana Explorer
                                    </a>
                                    <a
                                        href={getSolscanUrl(txSignature)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-3 px-4 bg-dark-card border border-dark-border rounded-lg font-semibold text-white hover:border-synapse-purple/50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                                        </svg>
                                        Solscan
                                    </a>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    onSuccess({ txSignature, amountUsdc });
                                    onClose();
                                }}
                                className="w-full py-3 bg-gradient-to-r from-synapse-green to-emerald-500 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
                            >
                                ✅ Continue to Device Control
                            </button>
                        </motion.div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-synapse-purple to-synapse-orange flex items-center justify-center text-2xl">
                                    💳
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Secure Payment</h3>
                                    <p className="text-gray-400 text-sm">
                                        Pay <span className="text-synapse-green font-mono font-bold">{amountUsdc} USDC</span> via X402 Protocol
                                    </p>
                                </div>
                            </div>

                            {/* Agent Info */}
                            <div className="bg-dark-bg/50 rounded-xl p-4 mb-6 border border-dark-border">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase tracking-wider">Agent</p>
                                        <p className="text-white font-semibold">{agentName || agentId}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-400 text-xs uppercase tracking-wider">Network</p>
                                        <p className="text-synapse-purple font-mono text-sm">Solana {config.solana.network}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Steps */}
                            <div className="space-y-2 mb-6">
                                {steps.map((step, index) => (
                                    <motion.div
                                        key={step.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`flex items-center p-3 rounded-xl border transition-all duration-300 ${getStepStatus(step.id) === 'complete'
                                            ? 'border-synapse-green/30 bg-synapse-green/5'
                                            : getStepStatus(step.id) === 'active'
                                                ? 'border-synapse-purple/50 bg-synapse-purple/10 shadow-lg shadow-synapse-purple/20'
                                                : 'border-dark-border bg-dark-bg/30'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mr-3 transition-all ${getStepStatus(step.id) === 'complete'
                                            ? 'bg-synapse-green text-dark-bg'
                                            : getStepStatus(step.id) === 'active'
                                                ? 'bg-synapse-purple text-white animate-pulse'
                                                : 'bg-dark-border text-gray-500'
                                            }`}>
                                            {getStepStatus(step.id) === 'complete' ? '✓' : step.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`text-sm font-medium ${getStepStatus(step.id) === 'pending' ? 'text-gray-500' : 'text-white'
                                                }`}>
                                                {step.label}
                                            </h4>
                                            <p className="text-xs text-gray-500">{step.description}</p>
                                        </div>
                                        {getStepStatus(step.id) === 'active' && (
                                            <div className="w-5 h-5 border-2 border-synapse-purple border-t-transparent rounded-full animate-spin" />
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            {/* Logs Terminal */}
                            <div className="bg-black/70 rounded-xl p-4 mb-6 h-28 overflow-y-auto font-mono text-xs border border-dark-border">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-dark-border">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                    <span className="text-gray-500 ml-2">X402 Payment Terminal</span>
                                </div>
                                {logs.length === 0 ? (
                                    <p className="text-gray-600">$ Waiting to start...</p>
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
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start gap-3"
                                >
                                    <span className="text-2xl">⚠️</span>
                                    <div>
                                        <p className="text-red-400 font-medium">Payment Failed</p>
                                        <p className="text-red-400/70 text-sm">{error}</p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                {paymentState === 'idle' || paymentState === 'failed' ? (
                                    <>
                                        <button
                                            onClick={onClose}
                                            className="flex-1 py-3 bg-dark-card border border-dark-border rounded-xl font-semibold text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handlePayment}
                                            className="flex-1 py-3 bg-gradient-to-r from-synapse-purple to-synapse-orange rounded-xl font-semibold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                        >
                                            {paymentState === 'failed' ? (
                                                <>🔄 Retry</>
                                            ) : (
                                                <>✨ Confirm & Pay</>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full py-3 bg-dark-border rounded-xl font-semibold text-gray-400 cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                        Processing...
                                    </button>
                                )}
                            </div>

                            {/* Security Note */}
                            <p className="text-center text-gray-500 text-xs mt-4">
                                🔒 Secured by X402 Protocol on Solana
                            </p>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
