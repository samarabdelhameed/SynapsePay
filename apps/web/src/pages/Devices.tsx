import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Demo devices for the marketplace
const devices = [
    {
        id: 'ugv-rover-01',
        name: 'UGV Rover 01',
        type: 'robot',
        description: 'Unmanned Ground Vehicle for exploration and monitoring. Full directional control with live camera feed.',
        priceUsdc: 0.10,
        durationMinutes: 10,
        status: 'available',
        icon: '🤖',
        gradient: 'from-synapse-purple to-synapse-cyan',
        specs: { battery: '87%', signal: '97%', location: 'Los Angeles, CA' },
    },
    {
        id: 'smart-led-array',
        name: 'Smart LED Array',
        type: 'led',
        description: 'RGB LED matrix for light shows, signaling, and ambient control. Perfect for events.',
        priceUsdc: 0.05,
        durationMinutes: 5,
        status: 'available',
        icon: '💡',
        gradient: 'from-synapse-orange to-yellow-500',
        specs: { modes: '12', brightness: '100%' },
    },
    {
        id: 'drone-cam-01',
        name: 'Drone Camera 01',
        type: 'drone',
        description: 'Aerial drone with 4K camera for photography and surveillance. GPS stabilized.',
        priceUsdc: 0.25,
        durationMinutes: 15,
        status: 'busy',
        icon: '🚁',
        gradient: 'from-synapse-green to-synapse-cyan',
        specs: { altitude: '120m', camera: '4K', location: 'New York, NY' },
    },
    {
        id: '3d-printer-01',
        name: '3D Printer MK3',
        type: 'printer',
        description: 'Industrial 3D printer for rapid prototyping. PLA/ABS compatible.',
        priceUsdc: 0.50,
        durationMinutes: 30,
        status: 'maintenance',
        icon: '🖨️',
        gradient: 'from-pink-500 to-synapse-purple',
        specs: { volume: '250x210x200mm', materials: 'PLA/ABS' },
    },
    {
        id: 'security-cam-hub',
        name: 'Security Camera Hub',
        type: 'camera',
        description: 'Multi-camera security system with motion detection and recording.',
        priceUsdc: 0.15,
        durationMinutes: 20,
        status: 'available',
        icon: '📷',
        gradient: 'from-red-500 to-synapse-orange',
        specs: { cameras: '4', resolution: '1080p' },
    },
    {
        id: 'telescope-remote',
        name: 'Remote Telescope',
        type: 'telescope',
        description: 'Professional telescope with remote control for astronomical observations.',
        priceUsdc: 0.30,
        durationMinutes: 15,
        status: 'available',
        icon: '🔭',
        gradient: 'from-indigo-500 to-purple-600',
        specs: { aperture: '200mm', location: 'Arizona Desert' },
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function Devices() {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'available':
                return <span className="badge-success">Available</span>;
            case 'busy':
                return <span className="badge-warning">In Use</span>;
            case 'maintenance':
                return <span className="badge-error">Maintenance</span>;
            default:
                return <span className="badge-info">{status}</span>;
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">
                        🌐 IoT Device Hub
                    </h1>
                    <p className="text-gray-400">
                        Rent and control physical devices with USDC micropayments
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-synapse-green/10 border border-synapse-green/30">
                        <div className="w-2 h-2 rounded-full bg-synapse-green animate-pulse" />
                        <span className="text-sm text-synapse-green font-medium">X402 Protocol Active</span>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Devices', value: devices.length, icon: '🔌' },
                    { label: 'Available', value: devices.filter(d => d.status === 'available').length, icon: '✅' },
                    { label: 'In Use', value: devices.filter(d => d.status === 'busy').length, icon: '🔄' },
                    { label: 'Total Rentals', value: '847', icon: '📊' },
                ].map((stat) => (
                    <div key={stat.label} className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{stat.icon}</span>
                            <div>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="text-xs text-gray-400">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Info Banner */}
            <motion.div variants={itemVariants} className="glass-card p-6 border-l-4 border-synapse-purple">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-synapse-purple/20 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-synapse-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold mb-1">How IoT Rentals Work</h3>
                        <p className="text-gray-400 text-sm">
                            Select a device, pay with USDC (gasless via X402), and get instant access to control the device
                            for the rental duration. No gas fees required - the facilitator handles transaction costs.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Device Grid */}
            <motion.div variants={itemVariants} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map((device, index) => (
                    <motion.div
                        key={device.id}
                        variants={itemVariants}
                        whileHover={{ y: -8 }}
                        className={`glass-card-hover group ${device.status !== 'available' ? 'opacity-75' : ''}`}
                    >
                        {/* Device Header */}
                        <div className={`h-32 rounded-t-2xl bg-gradient-to-br ${device.gradient} flex items-center justify-center relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                            <motion.span
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                                className="text-5xl relative z-10"
                            >
                                {device.icon}
                            </motion.span>

                            {/* Status Badge */}
                            <div className="absolute top-4 right-4">
                                {getStatusBadge(device.status)}
                            </div>
                        </div>

                        {/* Device Info */}
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="badge-info capitalize">{device.type}</span>
                                <span className="text-xs text-gray-500">
                                    {device.durationMinutes} min
                                </span>
                            </div>

                            <h3 className="text-xl font-semibold text-white mb-2">{device.name}</h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{device.description}</p>

                            {/* Specs */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {Object.entries(device.specs).slice(0, 2).map(([key, value]) => (
                                    <span key={key} className="text-xs text-gray-500 bg-dark-bg/50 px-2 py-1 rounded">
                                        {key}: <span className="text-gray-300">{value}</span>
                                    </span>
                                ))}
                            </div>

                            {/* Price & Action */}
                            <div className="flex items-center justify-between pt-4 border-t border-dark-border">
                                <div>
                                    <span className="text-2xl font-bold text-synapse-green">
                                        ${device.priceUsdc.toFixed(2)}
                                    </span>
                                    <span className="text-gray-400 text-sm ml-1">USDC</span>
                                </div>

                                {device.status === 'available' ? (
                                    <Link to={`/devices/${device.id}`}>
                                        <motion.button
                                            className="px-4 py-2 rounded-xl bg-synapse-purple hover:bg-synapse-purple-light text-white text-sm font-medium transition-colors flex items-center gap-2"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <span>Rent Now</span>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </motion.button>
                                    </Link>
                                ) : (
                                    <button
                                        disabled
                                        className="px-4 py-2 rounded-xl bg-dark-border text-gray-500 text-sm font-medium cursor-not-allowed"
                                    >
                                        Unavailable
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* CTA */}
            <motion.div
                variants={itemVariants}
                className="glass-card p-8 text-center bg-gradient-to-r from-synapse-purple/10 to-synapse-green/10"
            >
                <h2 className="text-2xl font-bold text-white mb-3">
                    Have a Device to Share?
                </h2>
                <p className="text-gray-400 mb-6 max-w-xl mx-auto">
                    Connect your IoT devices to SynapsePay and earn USDC from every rental.
                    Our X402 protocol makes it easy to monetize any connected device.
                </p>
                <Link to="/create-agent">
                    <motion.button
                        className="btn-primary"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        🔌 Register Your Device
                    </motion.button>
                </Link>
            </motion.div>
        </motion.div>
    );
}
