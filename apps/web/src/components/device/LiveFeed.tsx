import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LiveFeedProps {
    isConnected: boolean;
    deviceName: string;
    streamUrl?: string;
    location?: {
        lat: number;
        lon: number;
    };
}

export default function LiveFeed({
    isConnected,
    deviceName,
    streamUrl,
    location,
}: LiveFeedProps) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isConnected) {
            const timer = setTimeout(() => setIsLoading(false), 2000);
            return () => clearTimeout(timer);
        } else {
            setIsLoading(true);
        }
    }, [isConnected]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full aspect-video rounded-2xl overflow-hidden bg-dark-bg border border-dark-border"
        >
            {/* Status Badge */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isConnected
                        ? 'bg-synapse-green/20 border border-synapse-green/50'
                        : 'bg-red-500/20 border border-red-500/50'
                    }`}>
                    <span className={`relative flex h-2 w-2`}>
                        {isConnected && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-synapse-green opacity-75" />
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-synapse-green' : 'bg-red-400'
                            }`} />
                    </span>
                    <span className={`text-xs font-medium ${isConnected ? 'text-synapse-green' : 'text-red-400'
                        }`}>
                        {isConnected ? 'LIVE FEED' : 'OFFLINE'}
                    </span>
                </div>
            </div>

            {/* Location Display */}
            {location && (
                <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-lg bg-dark-bg/80 backdrop-blur-sm border border-dark-border">
                    <div className="font-mono text-xs text-gray-400 space-y-0.5">
                        <p>LAT: <span className="text-white">{location.lat.toFixed(4)} N</span></p>
                        <p>LON: <span className="text-white">{location.lon.toFixed(4)} W</span></p>
                    </div>
                </div>
            )}

            {/* Feed Content */}
            {isConnected ? (
                <>
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                    className="w-16 h-16 mx-auto mb-4"
                                >
                                    <svg viewBox="0 0 24 24" className="w-full h-full text-synapse-purple/50">
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            fill="none"
                                            strokeDasharray="40 60"
                                        />
                                    </svg>
                                </motion.div>
                                <p className="text-gray-400 font-mono text-sm">
                                    ESTABLISHING SECURE FEED // {deviceName}
                                </p>
                            </div>
                        </div>
                    ) : streamUrl ? (
                        <iframe
                            src={streamUrl}
                            className="w-full h-full border-0"
                            title={`${deviceName} Live Feed`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                        />
                    ) : (
                        // Demo grid pattern when no actual stream
                        <div className="absolute inset-0">
                            {/* Scan lines effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-synapse-green/5 to-transparent animate-pulse" />

                            {/* Grid overlay */}
                            <div
                                className="absolute inset-0 opacity-20"
                                style={{
                                    backgroundImage: `
                                        linear-gradient(rgba(20, 241, 149, 0.3) 1px, transparent 1px),
                                        linear-gradient(90deg, rgba(20, 241, 149, 0.3) 1px, transparent 1px)
                                    `,
                                    backgroundSize: '30px 30px',
                                }}
                            />

                            {/* Crosshair */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">
                                    <div className="w-24 h-0.5 bg-synapse-green/30 absolute top-1/2 left-1/2 -translate-x-1/2" />
                                    <div className="h-24 w-0.5 bg-synapse-green/30 absolute top-1/2 left-1/2 -translate-y-1/2" />
                                    <div className="w-12 h-12 border border-synapse-green/50 rounded-full" />
                                </div>
                            </div>

                            {/* Demo text */}
                            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                <p className="font-mono text-xs text-synapse-green/50">
                                    FEED://ACTIVE
                                </p>
                                <p className="font-mono text-xs text-synapse-green/50">
                                    {new Date().toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-dark-bg">
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-dark-card/50 flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 font-medium mb-2">No Feed Available</p>
                        <p className="text-gray-600 text-sm">Complete payment to access live feed</p>
                    </div>
                </div>
            )}

            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-synapse-green/30" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-synapse-green/30" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-synapse-green/30" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-synapse-green/30" />
        </motion.div>
    );
}
