import { motion } from 'framer-motion';

interface DeviceStatusPanelProps {
    deviceName: string;
    deviceId: string;
    status: 'online' | 'offline' | 'busy' | 'idle';
    battery: number;
    signal: number;
    temperature: number;
    sessionTimeRemaining: number; // in seconds
    location?: {
        lat: number;
        lon: number;
    };
}

export default function DeviceStatusPanel({
    deviceName,
    deviceId,
    status,
    battery,
    signal,
    temperature,
    sessionTimeRemaining,
    location,
}: DeviceStatusPanelProps) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'text-synapse-green bg-synapse-green/20';
            case 'idle': return 'text-synapse-cyan bg-synapse-cyan/20';
            case 'busy': return 'text-synapse-orange bg-synapse-orange/20';
            case 'offline': return 'text-gray-400 bg-gray-400/20';
            default: return 'text-gray-400 bg-gray-400/20';
        }
    };

    const getBatteryColor = (level: number) => {
        if (level > 60) return 'bg-synapse-green';
        if (level > 30) return 'bg-synapse-orange';
        return 'bg-red-500';
    };

    const stats = [
        {
            icon: '⚡',
            label: 'BATTERY',
            value: `${battery}%`,
            progress: battery,
            color: getBatteryColor(battery),
        },
        {
            icon: '📶',
            label: 'SIGNAL',
            value: `${signal}%`,
            progress: signal,
            color: 'bg-synapse-cyan',
        },
        {
            icon: '🌡️',
            label: 'TEMP',
            value: `${temperature.toFixed(1)}°C`,
            progress: Math.min((temperature / 80) * 100, 100),
            color: temperature > 60 ? 'bg-red-500' : 'bg-synapse-purple',
        },
        {
            icon: '⏱️',
            label: 'SESSION',
            value: formatTime(sessionTimeRemaining),
            isTimer: true,
            color: 'bg-synapse-green',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6"
        >
            {/* Device Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-synapse-purple/30 to-synapse-cyan/30 flex items-center justify-center text-xl">
                        🤖
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">{deviceName}</h3>
                        <p className="text-xs text-gray-500 font-mono">{deviceId}</p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(status)}`}>
                    {status}
                </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-dark-bg/50 rounded-xl p-4 border border-dark-border"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">{stat.icon}</span>
                            <span className="text-xs text-gray-400 font-medium">{stat.label}</span>
                        </div>
                        <p className={`text-2xl font-mono font-bold ${stat.isTimer ? 'text-synapse-green' : 'text-white'
                            }`}>
                            {stat.value}
                        </p>
                        {stat.progress !== undefined && !stat.isTimer && (
                            <div className="mt-2 h-1.5 bg-dark-border rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stat.progress}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className={`h-full ${stat.color} rounded-full`}
                                />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Location (if available) */}
            {location && (
                <div className="bg-dark-bg/50 rounded-xl p-4 border border-dark-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">📍</span>
                            <span className="text-xs text-gray-400 font-medium">LOCATION</span>
                        </div>
                        <div className="text-right font-mono text-sm">
                            <p className="text-gray-400">
                                LAT: <span className="text-white">{location.lat.toFixed(4)} N</span>
                            </p>
                            <p className="text-gray-400">
                                LON: <span className="text-white">{location.lon.toFixed(4)} W</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
