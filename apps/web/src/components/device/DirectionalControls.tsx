import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface DirectionalControlsProps {
    onCommand: (direction: 'up' | 'down' | 'left' | 'right' | 'stop') => void;
    disabled?: boolean;
    enableKeyboard?: boolean;
}

export default function DirectionalControls({
    onCommand,
    disabled = false,
    enableKeyboard = true,
}: DirectionalControlsProps) {
    const [activeDirection, setActiveDirection] = useState<string | null>(null);

    const handlePress = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
        if (disabled) return;
        setActiveDirection(direction);
        onCommand(direction);
    }, [disabled, onCommand]);

    const handleRelease = useCallback(() => {
        setActiveDirection(null);
        onCommand('stop');
    }, [onCommand]);

    // Keyboard controls (WASD)
    useEffect(() => {
        if (!enableKeyboard || disabled) return;

        const keyMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
            'w': 'up', 'W': 'up', 'ArrowUp': 'up',
            's': 'down', 'S': 'down', 'ArrowDown': 'down',
            'a': 'left', 'A': 'left', 'ArrowLeft': 'left',
            'd': 'right', 'D': 'right', 'ArrowRight': 'right',
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const direction = keyMap[e.key];
            if (direction && !activeDirection) {
                e.preventDefault();
                handlePress(direction);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const direction = keyMap[e.key];
            if (direction) {
                e.preventDefault();
                handleRelease();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [enableKeyboard, disabled, activeDirection, handlePress, handleRelease]);

    const DirectionButton = ({
        direction,
        icon,
        className,
    }: {
        direction: 'up' | 'down' | 'left' | 'right';
        icon: React.ReactNode;
        className?: string;
    }) => (
        <motion.button
            onMouseDown={() => handlePress(direction)}
            onMouseUp={handleRelease}
            onMouseLeave={() => activeDirection === direction && handleRelease()}
            onTouchStart={() => handlePress(direction)}
            onTouchEnd={handleRelease}
            disabled={disabled}
            className={`
                w-16 h-16 rounded-xl flex items-center justify-center
                transition-all duration-150
                ${disabled
                    ? 'bg-dark-border/50 text-gray-600 cursor-not-allowed'
                    : activeDirection === direction
                        ? 'bg-synapse-purple text-white shadow-glow-purple scale-95'
                        : 'bg-dark-card border border-dark-border text-gray-400 hover:text-white hover:border-synapse-purple/50'
                }
                ${className || ''}
            `}
            whileHover={!disabled ? { scale: 1.05 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
        >
            {icon}
        </motion.button>
    );

    const ArrowIcon = ({ direction }: { direction: 'up' | 'down' | 'left' | 'right' }) => {
        const rotations = { up: 0, right: 90, down: 180, left: 270 };
        return (
            <svg
                className="w-6 h-6"
                style={{ transform: `rotate(${rotations[direction]}deg)` }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
        >
            {/* Control Grid */}
            <div className="flex flex-col items-center gap-3 mb-6">
                {/* Up */}
                <DirectionButton direction="up" icon={<ArrowIcon direction="up" />} />

                {/* Left, Stop, Right */}
                <div className="flex items-center gap-3">
                    <DirectionButton direction="left" icon={<ArrowIcon direction="left" />} />

                    {/* Stop Button (Center) */}
                    <motion.button
                        onClick={() => onCommand('stop')}
                        disabled={disabled}
                        className={`
                            w-16 h-16 rounded-full flex items-center justify-center
                            ${disabled
                                ? 'bg-dark-border/50 cursor-not-allowed'
                                : 'bg-gradient-to-br from-synapse-orange/20 to-synapse-purple/20 border-2 border-synapse-purple/50 hover:border-synapse-purple'
                            }
                            transition-all duration-150
                        `}
                        whileHover={!disabled ? { scale: 1.05 } : {}}
                        whileTap={!disabled ? { scale: 0.95 } : {}}
                    >
                        <div className={`w-4 h-4 rounded-sm ${disabled ? 'bg-gray-600' : 'bg-synapse-purple'}`} />
                    </motion.button>

                    <DirectionButton direction="right" icon={<ArrowIcon direction="right" />} />
                </div>

                {/* Down */}
                <DirectionButton direction="down" icon={<ArrowIcon direction="down" />} />
            </div>

            {/* Professional Status Display */}
            <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${disabled ? 'bg-red-500' : 'bg-synapse-green animate-pulse'}`} />
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-mono">
                        {disabled ? 'SYSTEM LOCKED' : 'REMOTE CONTROL ACTIVE'}
                    </p>
                </div>
                
                {!disabled && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-dark-border/30 rounded px-2 py-1">
                            <span className="text-gray-500">MODE:</span>
                            <span className="text-synapse-green ml-1 font-mono">MANUAL</span>
                        </div>
                        <div className="bg-dark-border/30 rounded px-2 py-1">
                            <span className="text-gray-500">FUNC:</span>
                            <span className="text-synapse-cyan ml-1 font-mono">DRIVE</span>
                        </div>
                    </div>
                )}
                
                {!disabled && enableKeyboard && (
                    <p className="text-xs text-gray-500 font-mono">
                        WASD / ARROWS ENABLED
                    </p>
                )}
            </div>
        </motion.div>
    );
}
