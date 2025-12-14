import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

const steps = [
    {
        id: 1,
        title: 'Connect Your Wallet',
        description: 'Click "Connect Wallet" and choose Phantom or Solflare. Make sure you\'re on Solana Devnet.',
        icon: '👛',
        color: 'from-purple-500 to-violet-600',
        tip: 'Need Devnet SOL? Get free SOL from the Solana Faucet!'
    },
    {
        id: 2,
        title: 'Get Test USDC',
        description: 'For devnet, get free test USDC from the devnet faucet or use the "Airdrop" feature.',
        icon: '💰',
        color: 'from-green-500 to-emerald-600',
        tip: 'You only need 0.05 USDC to run your first agent!'
    },
    {
        id: 3,
        title: 'Choose an Agent',
        description: 'Browse the Marketplace and find an AI agent or IoT device. Each shows the exact price.',
        icon: '🤖',
        color: 'from-blue-500 to-cyan-600',
        tip: 'Try the PDF Summarizer - it\'s our most popular agent!'
    },
    {
        id: 4,
        title: 'Pay & Run',
        description: 'Click "Pay & Run", sign the payment intent (gasless!), and watch the magic happen.',
        icon: '⚡',
        color: 'from-orange-500 to-amber-600',
        tip: 'You only pay for the task - no gas fees needed!'
    },
    {
        id: 5,
        title: 'Get Results',
        description: 'Receive your results instantly with a verifiable transaction receipt on Solana Explorer.',
        icon: '✅',
        color: 'from-synapse-green to-emerald-500',
        tip: 'Every payment is verifiable on-chain!'
    }
];

export default function OnboardingGuide({ isOpen, onClose }: OnboardingGuideProps) {
    const [currentStep, setCurrentStep] = useState(0);

    if (!isOpen) return null;

    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;
    const isFirstStep = currentStep === 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-xl glass-card p-0 overflow-hidden"
            >
                {/* Header with gradient */}
                <div className={`h-48 bg-gradient-to-br ${step.color} flex items-center justify-center relative overflow-hidden`}>
                    {/* Animated background */}
                    <motion.div
                        className="absolute inset-0"
                        style={{
                            background: 'radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%)'
                        }}
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                    />

                    {/* Icon */}
                    <motion.div
                        key={step.id}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="text-8xl relative z-10"
                    >
                        {step.icon}
                    </motion.div>

                    {/* Step indicator */}
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm font-medium">
                        {currentStep + 1} / {steps.length}
                    </div>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 text-white/70 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <h3 className="text-2xl font-bold text-white mb-3">
                                {step.title}
                            </h3>
                            <p className="text-gray-400 text-lg mb-4">
                                {step.description}
                            </p>

                            {/* Tip */}
                            <div className="bg-synapse-purple/10 border border-synapse-purple/30 rounded-xl p-4 flex items-start gap-3">
                                <span className="text-xl">💡</span>
                                <p className="text-synapse-purple text-sm">
                                    <span className="font-semibold">Pro tip:</span> {step.tip}
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Progress dots */}
                    <div className="flex justify-center gap-2 my-6">
                        {steps.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentStep(index)}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === currentStep
                                        ? 'bg-synapse-purple w-8'
                                        : index < currentStep
                                            ? 'bg-synapse-green'
                                            : 'bg-dark-border hover:bg-gray-600'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-3">
                        {!isFirstStep && (
                            <button
                                onClick={() => setCurrentStep(prev => prev - 1)}
                                className="flex-1 py-3 bg-dark-card border border-dark-border rounded-xl font-semibold text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                            >
                                ← Back
                            </button>
                        )}

                        {isLastStep ? (
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 bg-gradient-to-r from-synapse-purple to-synapse-green rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
                            >
                                🚀 Start Exploring
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentStep(prev => prev + 1)}
                                className="flex-1 py-3 bg-gradient-to-r from-synapse-purple to-synapse-orange rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
                            >
                                Next →
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

/**
 * Floating Help Button
 * Can be used to trigger the onboarding guide from anywhere
 */
export function HelpButton({ onClick }: { onClick: () => void }) {
    return (
        <motion.button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-synapse-purple to-synapse-orange shadow-lg shadow-synapse-purple/30 flex items-center justify-center text-white text-xl hover:scale-110 transition-transform"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 1 }}
        >
            ❓
        </motion.button>
    );
}

/**
 * Quick Start Banner
 * Display on home page for first-time users
 */
export function QuickStartBanner({ onStartGuide }: { onStartGuide: () => void }) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-synapse-purple/20 via-synapse-orange/20 to-synapse-green/20 border border-synapse-purple/30 rounded-2xl p-6 mb-8"
        >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="text-4xl">👋</div>
                    <div>
                        <h3 className="text-xl font-bold text-white">
                            New to SynapsePay?
                        </h3>
                        <p className="text-gray-400">
                            Learn how to pay for AI agents in just 5 simple steps
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onStartGuide}
                        className="px-6 py-3 bg-gradient-to-r from-synapse-purple to-synapse-orange rounded-xl font-semibold text-white hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                        <span>📚</span>
                        Quick Start Guide
                    </button>
                    <button
                        onClick={() => setDismissed(true)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
