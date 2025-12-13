import { useState } from 'react';
import { motion } from 'framer-motion';
import PaymentModal from '../payment/PaymentModal';

interface DeviceAccessGateProps {
    deviceName: string;
    priceUsdc: number;
    durationMinutes: number;
    onInitiatePayment: () => void;
    onAccessGranted: () => void;
    isProcessing?: boolean;
    connected?: boolean;
}

export default function DeviceAccessGate({
    deviceName: _deviceName,
    priceUsdc,
    durationMinutes,
    onInitiatePayment,
    onAccessGranted,
    isProcessing = false,
    connected = false,
}: DeviceAccessGateProps) {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const handlePaymentSuccess = () => {
        setIsPaymentModalOpen(false);
        onAccessGranted();
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

                {/* Features List */}
                <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-gray-300">
                        <svg className="w-5 h-5 text-synapse-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Real-time low latency control</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                        <svg className="w-5 h-5 text-synapse-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>HD Camera feed access</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                        <svg className="w-5 h-5 text-synapse-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Gasless transaction via X402</span>
                    </div>
                </div>

                {/* Action Button */}
                <motion.button
                    onClick={() => {
                        onInitiatePayment();
                        setIsPaymentModalOpen(true);
                    }}
                    disabled={!connected || isProcessing}
                    className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-3 transition-all ${connected
                        ? 'bg-gradient-to-r from-synapse-purple to-synapse-orange hover:shadow-glow-purple cursor-pointer'
                        : 'bg-dark-border cursor-not-allowed opacity-50'
                        }`}
                    whileHover={connected ? { scale: 1.02 } : {}}
                    whileTap={connected ? { scale: 0.98 } : {}}
                >
                    {!connected ? (
                        'Connect Wallet to Unlock'
                    ) : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                <path strokeLinecap="round" strokeWidth="2" d="M12 8v8M8 12h8" />
                            </svg>
                            Unlock Device Access
                        </>
                    )}
                </motion.button>

                {!connected && (
                    <p className="text-center text-gray-400 text-sm mt-4">
                        Please connect your Phantom wallet to proceed
                    </p>
                )}
            </motion.div>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                agentId="ugv-rover-01" // This matches the ID in resource server
                amountUsdc={priceUsdc}
                durationSeconds={durationMinutes * 60}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
}
