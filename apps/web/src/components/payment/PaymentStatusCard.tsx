import { motion } from 'framer-motion';
import CountdownTimer from '../ui/CountdownTimer';

type PaymentStatus =
    | 'pending'
    | 'locked'
    | 'executing'
    | 'completed'
    | 'released'
    | 'refunded'
    | 'expired'
    | 'failed';

interface PaymentStatusCardProps {
    /** Current payment status */
    status: PaymentStatus;
    /** Recipient address */
    recipient: string;
    /** Amount in display format (e.g., "0.10 USDC") */
    amount: string;
    /** Service type or agent name */
    serviceType?: string;
    /** Transaction hash */
    txHash?: string;
    /** Timeout timestamp (Unix seconds) */
    timeoutTimestamp?: number;
    /** Total duration in seconds */
    totalDuration?: number;
    /** Payment/Request ID */
    requestId?: string;
    /** Error message if failed */
    error?: string;
    /** Show countdown timer */
    showTimer?: boolean;
    /** Card variant */
    variant?: 'compact' | 'detailed';
    /** Layout variant */
    layoutVariant?: 'v1' | 'v2' | 'v3';
    /** Callback when timer expires */
    onTimeout?: () => void;
}

const statusConfig: Record<PaymentStatus, { color: string; bgColor: string; icon: string; label: string }> = {
    pending: { color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', icon: '⏳', label: 'Pending' },
    locked: { color: 'text-synapse-purple', bgColor: 'bg-synapse-purple/10', icon: '🔒', label: 'Locked' },
    executing: { color: 'text-blue-400', bgColor: 'bg-blue-400/10', icon: '⚡', label: 'Executing' },
    completed: { color: 'text-synapse-green', bgColor: 'bg-synapse-green/10', icon: '✓', label: 'Completed' },
    released: { color: 'text-synapse-green', bgColor: 'bg-synapse-green/10', icon: '💸', label: 'Released' },
    refunded: { color: 'text-orange-400', bgColor: 'bg-orange-400/10', icon: '↩️', label: 'Refunded' },
    expired: { color: 'text-gray-400', bgColor: 'bg-gray-400/10', icon: '⏰', label: 'Expired' },
    failed: { color: 'text-red-400', bgColor: 'bg-red-400/10', icon: '✗', label: 'Failed' },
};

export default function PaymentStatusCard({
    status,
    recipient,
    amount,
    serviceType,
    txHash,
    timeoutTimestamp,
    totalDuration,
    requestId,
    error,
    showTimer = true,
    variant = 'detailed',
    layoutVariant = 'v1',
    onTimeout,
}: PaymentStatusCardProps) {
    const config = statusConfig[status];

    const shortenAddress = (addr: string) => {
        if (addr.length <= 12) return addr;
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const shortenTxHash = (hash: string) => {
        return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
    };

    // V1: Compact Terminal Style
    if (layoutVariant === 'v1') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${config.bgColor} border border-dark-border rounded-lg p-4 font-mono text-sm`}
            >
                <div className="flex items-center justify-between mb-2">
                    <div className={`flex items-center gap-2 ${config.color}`}>
                        <span>{config.icon}</span>
                        <span className="font-semibold">{config.label}</span>
                    </div>
                    <span className="text-synapse-green font-bold">{amount}</span>
                </div>

                {variant === 'detailed' && (
                    <div className="space-y-1 text-gray-400 text-xs">
                        <div className="flex justify-between">
                            <span>To:</span>
                            <span className="text-gray-300">{shortenAddress(recipient)}</span>
                        </div>
                        {serviceType && (
                            <div className="flex justify-between">
                                <span>Service:</span>
                                <span className="text-gray-300">{serviceType}</span>
                            </div>
                        )}
                        {requestId && (
                            <div className="flex justify-between">
                                <span>ID:</span>
                                <span className="text-gray-300">{requestId.slice(0, 12)}...</span>
                            </div>
                        )}
                    </div>
                )}

                {showTimer && timeoutTimestamp && status !== 'completed' && status !== 'failed' && (
                    <div className="mt-3 pt-3 border-t border-dark-border">
                        <CountdownTimer
                            endTime={timeoutTimestamp}
                            totalDuration={totalDuration}
                            size="sm"
                            showProgressBar={true}
                            onComplete={onTimeout}
                        />
                    </div>
                )}

                {txHash && (
                    <div className="mt-2 pt-2 border-t border-dark-border">
                        <a
                            href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-synapse-purple hover:underline text-xs"
                        >
                            View TX: {shortenTxHash(txHash)} →
                        </a>
                    </div>
                )}

                {error && (
                    <div className="mt-2 pt-2 border-t border-red-500/30 text-red-400 text-xs">
                        Error: {error}
                    </div>
                )}
            </motion.div>
        );
    }

    // V2: Grid Layout
    if (layoutVariant === 'v2') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6"
            >
                <div className="grid grid-cols-2 gap-4">
                    {/* Status Badge */}
                    <div className="col-span-2 flex items-center justify-between">
                        <div className={`px-3 py-1 rounded-full ${config.bgColor} ${config.color} text-sm font-medium`}>
                            {config.icon} {config.label}
                        </div>
                        <span className="text-2xl font-bold text-synapse-green">{amount}</span>
                    </div>

                    {/* Details Grid */}
                    <div className="space-y-2">
                        <div>
                            <p className="text-gray-500 text-xs">Recipient</p>
                            <p className="text-white text-sm font-mono">{shortenAddress(recipient)}</p>
                        </div>
                        {serviceType && (
                            <div>
                                <p className="text-gray-500 text-xs">Service</p>
                                <p className="text-white text-sm">{serviceType}</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        {requestId && (
                            <div>
                                <p className="text-gray-500 text-xs">Request ID</p>
                                <p className="text-white text-sm font-mono">{requestId.slice(0, 16)}...</p>
                            </div>
                        )}
                        {showTimer && timeoutTimestamp && (
                            <div>
                                <p className="text-gray-500 text-xs">Time Remaining</p>
                                <CountdownTimer
                                    endTime={timeoutTimestamp}
                                    totalDuration={totalDuration}
                                    size="sm"
                                    format="text"
                                    onComplete={onTimeout}
                                />
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {showTimer && timeoutTimestamp && totalDuration && (
                        <div className="col-span-2">
                            <CountdownTimer
                                endTime={timeoutTimestamp}
                                totalDuration={totalDuration}
                                size="sm"
                                showProgressBar={true}
                                format="MM:SS"
                            />
                        </div>
                    )}

                    {/* TX Link */}
                    {txHash && (
                        <div className="col-span-2 pt-2 border-t border-dark-border">
                            <a
                                href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-synapse-purple hover:text-synapse-orange transition-colors text-sm flex items-center gap-1"
                            >
                                <span>View on Explorer</span>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}
            </motion.div>
        );
    }

    // V3: Horizontal Bar
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`${config.bgColor} border-l-4 ${config.color.replace('text-', 'border-')} rounded-r-lg p-4`}
        >
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className={`text-2xl`}>{config.icon}</div>
                    <div>
                        <p className={`font-semibold ${config.color}`}>{config.label}</p>
                        <p className="text-gray-400 text-sm">{serviceType || 'Payment'}</p>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-synapse-green font-bold text-xl">{amount}</p>
                    <p className="text-gray-500 text-xs">{shortenAddress(recipient)}</p>
                </div>

                {showTimer && timeoutTimestamp && status !== 'completed' && (
                    <div className="w-full sm:w-auto">
                        <CountdownTimer
                            endTime={timeoutTimestamp}
                            totalDuration={totalDuration}
                            size="md"
                            showProgressBar={true}
                            onComplete={onTimeout}
                        />
                    </div>
                )}
            </div>

            {txHash && (
                <div className="mt-3 pt-3 border-t border-dark-border/50">
                    <a
                        href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-synapse-purple hover:underline text-sm"
                    >
                        TX: {shortenTxHash(txHash)} →
                    </a>
                </div>
            )}
        </motion.div>
    );
}
