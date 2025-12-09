import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogEntry {
    id: string;
    timestamp: Date;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'command';
}

interface SystemLogsProps {
    logs: LogEntry[];
    txActive?: boolean;
    maxHeight?: string;
}

export default function SystemLogs({
    logs,
    txActive = false,
    maxHeight = '200px',
}: SystemLogsProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const formatTimestamp = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 1,
        });
    };

    const getTypeStyles = (type: LogEntry['type']) => {
        switch (type) {
            case 'success':
                return 'text-synapse-green';
            case 'warning':
                return 'text-synapse-orange';
            case 'error':
                return 'text-red-400';
            case 'command':
                return 'text-synapse-cyan';
            default:
                return 'text-gray-400';
        }
    };

    const getTypePrefix = (type: LogEntry['type']) => {
        switch (type) {
            case 'success':
                return '[OK]';
            case 'warning':
                return '[WARN]';
            case 'error':
                return '[ERR]';
            case 'command':
                return '[CMD]';
            default:
                return '[INFO]';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-synapse-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-white">SYSTEM LOGS</span>
                </div>
                <div className="flex items-center gap-2">
                    {txActive && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2 px-2 py-1 rounded bg-synapse-green/20"
                        >
                            <div className="w-2 h-2 rounded-full bg-synapse-green animate-pulse" />
                            <span className="text-xs text-synapse-green font-medium">TX: ACTIVE</span>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Logs Container */}
            <div
                ref={scrollRef}
                className="font-mono text-xs overflow-y-auto bg-dark-bg/50 p-4"
                style={{ maxHeight }}
            >
                {logs.length === 0 ? (
                    <div className="text-gray-500 italic">
                        Waiting for system events...
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {logs.map((log) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className={`flex gap-2 mb-1 ${getTypeStyles(log.type)}`}
                            >
                                <span className="text-gray-600 shrink-0">
                                    [{formatTimestamp(log.timestamp)}]
                                </span>
                                <span className={`shrink-0 ${getTypeStyles(log.type)}`}>
                                    {getTypePrefix(log.type)}
                                </span>
                                <span className="break-all">
                                    {log.message}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {/* Blinking cursor */}
                <div className="flex items-center gap-1 text-gray-500 mt-2">
                    <span>{'>'}</span>
                    <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="w-2 h-4 bg-synapse-green"
                    />
                </div>
            </div>
        </motion.div>
    );
}

// Helper to generate a log entry
export const createLogEntry = (
    message: string,
    type: LogEntry['type'] = 'info'
): LogEntry => ({
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    message,
    type,
});
