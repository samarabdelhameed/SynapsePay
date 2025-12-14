import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { config } from '../config';

export default function TransactionSuccess() {
    const [searchParams] = useSearchParams();
    const txSignature = searchParams.get('tx');
    const amount = searchParams.get('amount');
    const agent = searchParams.get('agent');

    const getSolanaExplorerUrl = (signature: string) => {
        const cluster = config.solana.network === 'mainnet-beta' ? '' : '?cluster=devnet';
        return `https://explorer.solana.com/tx/${signature}${cluster}`;
    };

    const getSolscanUrl = (signature: string) => {
        const cluster = config.solana.network === 'mainnet-beta' ? '' : '?cluster=devnet';
        return `https://solscan.io/tx/${signature}${cluster}`;
    };

    // Confetti effect
    useEffect(() => {
        const duration = 3000;
        const colors = ['#14F195', '#9945FF', '#F97316', '#3B82F6', '#EC4899'];

        const createConfetti = () => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = '50%';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-10px';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '9999';
            document.body.appendChild(confetti);

            const animation = confetti.animate([
                { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                { transform: `translateY(100vh) rotate(${Math.random() * 720}deg)`, opacity: 0 }
            ], {
                duration: duration + Math.random() * 1000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });

            animation.onfinish = () => confetti.remove();
        };

        // Create confetti particles
        for (let i = 0; i < 50; i++) {
            setTimeout(createConfetti, Math.random() * 500);
        }
    }, []);

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-lg w-full text-center"
            >
                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-synapse-green to-emerald-400 flex items-center justify-center shadow-2xl shadow-synapse-green/30"
                >
                    <motion.svg
                        className="w-12 h-12 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                    >
                        <motion.path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                        />
                    </motion.svg>
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold text-white mb-2"
                >
                    Payment Successful! 🎉
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-400 mb-8"
                >
                    Your transaction has been confirmed on Solana
                </motion.p>

                {/* Transaction Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card p-6 mb-6 text-left"
                >
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                        Transaction Details
                    </h3>

                    <div className="space-y-4">
                        {agent && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Agent</span>
                                <span className="text-white font-medium">{decodeURIComponent(agent)}</span>
                            </div>
                        )}

                        {amount && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Amount</span>
                                <span className="text-synapse-green font-mono font-bold">{amount} USDC</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Network</span>
                            <span className="text-synapse-purple font-mono">Solana {config.solana.network}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Status</span>
                            <span className="flex items-center gap-2 text-synapse-green">
                                <div className="w-2 h-2 rounded-full bg-synapse-green animate-pulse" />
                                Confirmed
                            </span>
                        </div>

                        {txSignature && (
                            <div className="pt-4 border-t border-dark-border">
                                <span className="text-gray-400 block mb-2">Transaction Signature</span>
                                <code className="text-synapse-purple font-mono text-sm break-all bg-dark-bg/50 p-3 rounded-lg block">
                                    {txSignature}
                                </code>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Explorer Links */}
                {txSignature && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex gap-3 mb-6"
                    >
                        <a
                            href={getSolanaExplorerUrl(txSignature)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-[#9945FF] to-[#14F195] rounded-xl font-semibold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                            </svg>
                            View on Solana Explorer
                        </a>
                        <a
                            href={getSolscanUrl(txSignature)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-3 px-4 bg-dark-card border border-dark-border rounded-xl font-semibold text-white hover:border-synapse-purple/50 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                            </svg>
                            View on Solscan
                        </a>
                    </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex gap-3"
                >
                    <Link
                        to="/marketplace"
                        className="flex-1 py-3 px-4 bg-dark-card border border-dark-border rounded-xl font-semibold text-white hover:border-synapse-purple/50 transition-colors"
                    >
                        Browse More Agents
                    </Link>
                    <Link
                        to="/dashboard"
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-synapse-purple to-synapse-orange rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
                    >
                        View Dashboard
                    </Link>
                </motion.div>

                {/* Powered by */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-gray-500 text-sm mt-8 flex items-center justify-center gap-2"
                >
                    Powered by
                    <span className="text-synapse-purple font-semibold">X402 Protocol</span>
                    on
                    <span className="bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent font-semibold">Solana</span>
                </motion.p>
            </motion.div>
        </div>
    );
}
