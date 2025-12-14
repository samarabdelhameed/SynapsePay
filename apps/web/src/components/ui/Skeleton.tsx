import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
    variant?: 'rectangular' | 'circular' | 'text';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton Loading Component
 * Beautiful loading placeholders with smooth animations
 */
export function Skeleton({
    className = '',
    variant = 'rectangular',
    width,
    height,
    animation = 'pulse'
}: SkeletonProps) {
    const baseClasses = 'bg-dark-border/50 rounded-lg overflow-hidden';

    const variantClasses = {
        rectangular: 'rounded-xl',
        circular: 'rounded-full',
        text: 'rounded-md h-4'
    };

    const style = {
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : '100%')
    };

    if (animation === 'wave') {
        return (
            <div className={`${baseClasses} ${variantClasses[variant]} ${className} relative`} style={style}>
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
            </div>
        );
    }

    if (animation === 'pulse') {
        return (
            <motion.div
                className={`${baseClasses} ${variantClasses[variant]} ${className}`}
                style={style}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
        );
    }

    return (
        <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} style={style} />
    );
}

/**
 * Agent Card Skeleton
 * Loading state for agent cards in marketplace
 */
export function AgentCardSkeleton() {
    return (
        <div className="glass-card overflow-hidden">
            {/* Image Skeleton */}
            <Skeleton height={128} className="rounded-t-2xl rounded-b-none" animation="wave" />

            {/* Content */}
            <div className="p-6 space-y-4">
                {/* Category and Rating */}
                <div className="flex justify-between items-center">
                    <Skeleton width={60} height={24} variant="rectangular" />
                    <Skeleton width={50} height={20} variant="rectangular" />
                </div>

                {/* Title */}
                <Skeleton width="70%" height={24} variant="text" />

                {/* Description */}
                <div className="space-y-2">
                    <Skeleton width="100%" height={16} variant="text" />
                    <Skeleton width="80%" height={16} variant="text" />
                </div>

                {/* Price and Runs */}
                <div className="flex justify-between items-center pt-2">
                    <Skeleton width={80} height={32} />
                    <Skeleton width={60} height={16} variant="text" />
                </div>
            </div>
        </div>
    );
}

/**
 * Device Card Skeleton
 * Loading state for IoT device cards
 */
export function DeviceCardSkeleton() {
    return (
        <div className="glass-card p-6">
            <div className="flex items-start gap-4">
                {/* Icon */}
                <Skeleton width={64} height={64} variant="circular" />

                {/* Content */}
                <div className="flex-1 space-y-3">
                    <Skeleton width="60%" height={24} variant="text" />
                    <Skeleton width="100%" height={16} variant="text" />
                    <Skeleton width="40%" height={16} variant="text" />

                    {/* Status and Price */}
                    <div className="flex justify-between items-center pt-2">
                        <Skeleton width={80} height={28} />
                        <Skeleton width={100} height={36} />
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Dashboard Stats Skeleton
 * Loading state for dashboard statistics
 */
export function DashboardStatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-card p-6">
                    <div className="flex items-center gap-4">
                        <Skeleton width={48} height={48} variant="circular" />
                        <div className="flex-1 space-y-2">
                            <Skeleton width="50%" height={16} variant="text" />
                            <Skeleton width="70%" height={28} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Transaction List Skeleton
 * Loading state for transaction history
 */
export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="glass-card p-4 flex items-center gap-4">
                    <Skeleton width={40} height={40} variant="circular" />
                    <div className="flex-1 space-y-2">
                        <Skeleton width="30%" height={16} variant="text" />
                        <Skeleton width="50%" height={14} variant="text" />
                    </div>
                    <div className="text-right space-y-2">
                        <Skeleton width={60} height={20} />
                        <Skeleton width={40} height={14} variant="text" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Page Loading Skeleton
 * Full page loading state
 */
export function PageLoadingSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
        >
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton width={200} height={32} />
                    <Skeleton width={300} height={20} variant="text" />
                </div>
                <Skeleton width={140} height={44} />
            </div>

            {/* Grid of cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <AgentCardSkeleton key={i} />
                ))}
            </div>
        </motion.div>
    );
}

export default Skeleton;
