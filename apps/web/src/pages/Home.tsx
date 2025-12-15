import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import OnboardingGuide, { QuickStartBanner, HelpButton } from '../components/common/OnboardingGuide';

// Stats data
const stats = [
    { label: 'Total Agents', value: '42', icon: '🤖', color: 'from-synapse-purple to-synapse-pink' },
    { label: 'Transactions', value: '12.4K', icon: '💳', color: 'from-synapse-orange to-synapse-purple' },
    { label: 'Total Volume', value: '$48.2K', icon: '💰', color: 'from-synapse-green to-synapse-cyan' },
    { label: 'Active Users', value: '2.1K', icon: '👥', color: 'from-synapse-cyan to-synapse-purple' },
];

// Featured agents
const featuredAgents = [
    {
        id: 'pdf-summarizer-v1',
        name: 'PDF Summarizer',
        description: 'Extract key points from any PDF document using AI',
        price: '0.05',
        runs: 1250,
        rating: 4.8,
        category: 'AI',
        icon: '📄',
        gradient: 'from-blue-500 to-purple-600',
    },
    {
        id: 'nft-minter-v1',
        name: 'NFT Minter',
        description: 'Transform images into NFTs on Solana instantly',
        price: '0.25',
        runs: 850,
        rating: 4.9,
        category: 'NFT',
        icon: '🖼️',
        gradient: 'from-purple-500 to-pink-600',
    },
    {
        id: 'trading-signal-v1',
        name: 'Trading Signals',
        description: 'AI-powered market analysis and trading signals',
        price: '0.20',
        runs: 620,
        rating: 4.7,
        category: 'Trading',
        icon: '📈',
        gradient: 'from-green-500 to-teal-600',
    },
];

// Animation variants
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

export default function Home() {
    const [showGuide, setShowGuide] = useState(false);

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6 sm:space-y-8 px-1 sm:px-0"
        >
            {/* Onboarding Guide Modal */}
            <OnboardingGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

            {/* Help Button (floating) */}
            <HelpButton onClick={() => setShowGuide(true)} />

            {/* Quick Start Banner for new users */}
            <QuickStartBanner onStartGuide={() => setShowGuide(true)} />
            {/* Hero Section */}
            <motion.section variants={itemVariants} className="relative overflow-hidden rounded-2xl sm:rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-synapse-purple/30 via-transparent to-synapse-orange/30" />
                <div className="relative glass-card p-4 sm:p-8 md:p-12">
                    <div className="max-w-3xl">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-synapse-purple/20 border border-synapse-purple/30 text-synapse-purple mb-6"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-synapse-purple opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-synapse-purple" />
                            </span>
                            <span className="text-sm font-medium">Solana Winter Buildathon 2025</span>
                        </motion.div>

                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold mb-4 sm:mb-6">
                            <span className="text-white">AI-Powered</span>
                            <br />
                            <span className="gradient-text">AutoPay Agents</span>
                        </h1>

                        <p className="text-sm sm:text-lg text-gray-400 mb-6 sm:mb-8 max-w-2xl">
                            Execute AI tasks, automate workflows, and control devices — all with{' '}
                            <span className="text-synapse-green font-semibold">gasless micropayments</span> on Solana.
                            Pay only for what you use.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Link to="/marketplace">
                                <motion.button
                                    className="btn-primary flex items-center gap-2"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span>🚀</span>
                                    <span>Explore Marketplace</span>
                                </motion.button>
                            </Link>
                            <Link to="/create-agent">
                                <motion.button
                                    className="btn-secondary flex items-center gap-2"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span>➕</span>
                                    <span>Create Agent</span>
                                </motion.button>
                            </Link>
                        </div>
                    </div>

                    {/* Floating Elements */}
                    <div className="absolute right-8 top-8 hidden lg:block">
                        <motion.div
                            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="w-32 h-32 rounded-2xl bg-gradient-to-br from-synapse-orange/50 to-synapse-purple/50 backdrop-blur-xl border border-white/10 flex items-center justify-center text-5xl"
                        >
                            🤖
                        </motion.div>
                    </div>
                    <div className="absolute right-48 bottom-12 hidden lg:block">
                        <motion.div
                            animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
                            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                            className="w-24 h-24 rounded-xl bg-gradient-to-br from-synapse-green/50 to-synapse-cyan/50 backdrop-blur-xl border border-white/10 flex items-center justify-center text-4xl"
                        >
                            ⚡
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Stats Grid */}
            <motion.section variants={itemVariants}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {stats.map((stat, _index) => (
                        <motion.div
                            key={stat.label}
                            variants={itemVariants}
                            whileHover={{ scale: 1.02, y: -4 }}
                            className="glass-card p-4 sm:p-6 group cursor-pointer"
                        >
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                                {stat.icon}
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</p>
                            <p className="text-xs sm:text-sm text-gray-400">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            {/* Featured Agents */}
            <motion.section variants={itemVariants}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-display font-bold text-white">Featured Agents</h2>
                        <p className="text-sm sm:text-base text-gray-400">Top performing AI agents this week</p>
                    </div>
                    <Link to="/marketplace">
                        <motion.button
                            className="text-synapse-purple hover:text-synapse-purple-light flex items-center gap-2"
                            whileHover={{ x: 4 }}
                        >
                            View All
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </motion.button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {featuredAgents.map((agent, _index) => (
                        <Link key={agent.id} to={`/agent/${agent.id}`}>
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ y: -8 }}
                                className="glass-card-hover group h-full"
                            >
                                <div className={`h-32 rounded-t-2xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center text-5xl relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                    <motion.span
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        {agent.icon}
                                    </motion.span>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="badge-info">{agent.category}</span>
                                        <span className="flex items-center gap-1 text-yellow-400 text-sm">
                                            ⭐ {agent.rating}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">{agent.name}</h3>
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{agent.description}</p>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-2xl font-bold text-synapse-green">${agent.price}</span>
                                            <span className="text-gray-400 text-sm ml-1">USDC</span>
                                        </div>
                                        <span className="text-gray-500 text-sm">{agent.runs.toLocaleString()} runs</span>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </motion.section>

            {/* How It Works */}
            <motion.section variants={itemVariants} className="glass-card p-4 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-display font-bold text-white mb-6 sm:mb-8 text-center">
                    How It Works
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                    {[
                        { step: '01', icon: '🔍', title: 'Discover', desc: 'Browse AI agents in the marketplace' },
                        { step: '02', icon: '💳', title: 'Pay', desc: 'Pay with USDC - zero gas fees' },
                        { step: '03', icon: '✨', title: 'Execute', desc: 'Get instant results on-chain' },
                    ].map((item, index) => (
                        <motion.div
                            key={item.step}
                            className="text-center"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.2 }}
                        >
                            <div className="relative inline-block mb-4">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-synapse-purple/20 to-synapse-orange/20 flex items-center justify-center text-4xl">
                                    {item.icon}
                                </div>
                                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-synapse-orange text-white text-sm font-bold flex items-center justify-center">
                                    {item.step}
                                </span>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                            <p className="text-gray-400">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            {/* IoT Devices Section */}
            <motion.section variants={itemVariants}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-display font-bold text-white">🌐 IoT Device Hub</h2>
                        <p className="text-sm sm:text-base text-gray-400">Control real-world devices with micropayments</p>
                    </div>
                    <Link to="/devices">
                        <motion.button
                            className="text-synapse-cyan hover:text-synapse-cyan-light flex items-center gap-2"
                            whileHover={{ x: 4 }}
                        >
                            View All Devices
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </motion.button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[
                        { id: 'ugv-rover-01', name: 'UGV Rover 01', price: '0.10', type: 'Robot', icon: '🤖', gradient: 'from-synapse-purple to-synapse-cyan', status: 'available' },
                        { id: 'smart-led-array', name: 'Smart LED Array', price: '0.05', type: 'LED', icon: '💡', gradient: 'from-synapse-orange to-yellow-500', status: 'available' },
                        { id: 'drone-cam-01', name: 'Drone Camera 01', price: '0.25', type: 'Drone', icon: '🚁', gradient: 'from-synapse-green to-synapse-cyan', status: 'busy' },
                    ].map((device, index) => (
                        <Link key={device.id} to={device.status === 'available' ? `/devices/${device.id}` : '/devices'}>
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ y: -8 }}
                                className={`glass-card-hover group h-full ${device.status !== 'available' ? 'opacity-70' : ''}`}
                            >
                                <div className={`h-24 rounded-t-2xl bg-gradient-to-br ${device.gradient} flex items-center justify-center relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                    <motion.span
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                                        className="text-4xl relative z-10"
                                    >
                                        {device.icon}
                                    </motion.span>
                                    {device.status !== 'available' && (
                                        <span className="absolute top-2 right-2 badge-warning">In Use</span>
                                    )}
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="badge-info">{device.type}</span>
                                        <span className="flex items-center gap-1 text-synapse-green text-sm">
                                            <span className="w-2 h-2 rounded-full bg-synapse-green animate-pulse" />
                                            X402
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-3">{device.name}</h3>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-xl font-bold text-synapse-green">${device.price}</span>
                                            <span className="text-gray-400 text-sm ml-1">USDC</span>
                                        </div>
                                        {device.status === 'available' && (
                                            <span className="text-synapse-purple text-sm font-medium group-hover:underline">
                                                Rent Now →
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </motion.section>

            {/* CTA Section */}
            <motion.section
                variants={itemVariants}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-synapse-purple/30 to-synapse-orange/30 p-8 md:p-12 text-center"
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-synapse-purple/20 blur-3xl"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-synapse-orange/20 blur-3xl"
                />

                <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                        Ready to Build the Future?
                    </h2>
                    <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                        Create your own AI agent and start earning USDC from every execution.
                    </p>
                    <Link to="/create-agent">
                        <motion.button
                            className="btn-primary text-lg px-8 py-4"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            🚀 Start Building
                        </motion.button>
                    </Link>
                </div>
            </motion.section>
        </motion.div>
    );
}
