import { useState, useEffect, useCallback } from 'react';

interface CountdownTimerProps {
    /** End time as Unix timestamp in seconds */
    endTime: number;
    /** Show progress bar */
    showProgressBar?: boolean;
    /** Total duration in seconds (for progress calculation) */
    totalDuration?: number;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Warning threshold in seconds (default 30) */
    warningThreshold?: number;
    /** Callback when timer completes */
    onComplete?: () => void;
    /** Callback when entering warning zone */
    onWarning?: (remaining: number) => void;
    /** Callback on each tick */
    onTick?: (remaining: number) => void;
    /** Display format */
    format?: 'MM:SS' | 'HH:MM:SS' | 'text';
}

export default function CountdownTimer({
    endTime,
    showProgressBar = true,
    totalDuration,
    size = 'md',
    warningThreshold = 30,
    onComplete,
    onWarning,
    onTick,
    format = 'MM:SS',
}: CountdownTimerProps) {
    const [remaining, setRemaining] = useState<number>(0);
    const [hasWarned, setHasWarned] = useState(false);

    const calculateRemaining = useCallback(() => {
        const now = Math.floor(Date.now() / 1000);
        return Math.max(0, endTime - now);
    }, [endTime]);

    useEffect(() => {
        setRemaining(calculateRemaining());
        setHasWarned(false);

        const interval = setInterval(() => {
            const newRemaining = calculateRemaining();
            setRemaining(newRemaining);

            if (onTick) {
                onTick(newRemaining);
            }

            // Warning callback
            if (newRemaining <= warningThreshold && newRemaining > 0 && !hasWarned) {
                setHasWarned(true);
                if (onWarning) {
                    onWarning(newRemaining);
                }
            }

            // Complete callback
            if (newRemaining === 0) {
                clearInterval(interval);
                if (onComplete) {
                    onComplete();
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [endTime, calculateRemaining, warningThreshold, hasWarned, onComplete, onWarning, onTick]);

    const formatTime = (seconds: number): string => {
        if (format === 'text') {
            if (seconds >= 3600) {
                const hours = Math.floor(seconds / 3600);
                const mins = Math.floor((seconds % 3600) / 60);
                return `${hours}h ${mins}m remaining`;
            } else if (seconds >= 60) {
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${mins}m ${secs}s remaining`;
            } else {
                return `${seconds}s remaining`;
            }
        }

        if (format === 'HH:MM:SS') {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        // MM:SS
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getColor = (): string => {
        if (remaining === 0) return 'text-gray-500';
        if (remaining <= warningThreshold) return 'text-red-400';
        if (remaining <= 60) return 'text-yellow-400';
        return 'text-synapse-green';
    };

    const getProgressColor = (): string => {
        if (remaining === 0) return 'bg-gray-500';
        if (remaining <= warningThreshold) return 'bg-red-500';
        if (remaining <= 60) return 'bg-yellow-500';
        return 'bg-synapse-green';
    };

    const getProgressPercentage = (): number => {
        if (!totalDuration || totalDuration === 0) return 100;
        return Math.min(100, (remaining / totalDuration) * 100);
    };

    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-lg',
        lg: 'text-2xl font-bold',
    };

    return (
        <div className="flex flex-col gap-2">
            <div className={`font-mono ${sizeClasses[size]} ${getColor()} ${remaining <= warningThreshold && remaining > 0 ? 'animate-pulse' : ''}`}>
                {remaining === 0 ? (
                    <span className="text-gray-500">Expired</span>
                ) : (
                    formatTime(remaining)
                )}
            </div>

            {showProgressBar && totalDuration && (
                <div className="w-full h-2 bg-dark-border rounded-full overflow-hidden">
                    <div
                        className={`h-full ${getProgressColor()} transition-all duration-1000 ease-linear`}
                        style={{ width: `${getProgressPercentage()}%` }}
                    />
                </div>
            )}
        </div>
    );
}
