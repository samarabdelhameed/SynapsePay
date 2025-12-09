import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
    { path: '/', label: 'Home', icon: '🏠', emoji: true },
    { path: '/marketplace', label: 'Marketplace', icon: '🏪', emoji: true },
    { path: '/devices', label: 'IoT Devices', icon: '🌐', emoji: true },
    { path: '/dashboard', label: 'Dashboard', icon: '📊', emoji: true },
    { path: '/create-agent', label: 'Create Agent', icon: '➕', emoji: true },
    { path: '/settings', label: 'Settings', icon: '⚙️', emoji: true },
];

const categories = [
    { label: 'AI Agents', icon: '🤖', count: 15, color: 'text-synapse-purple' },
    { label: 'IoT Devices', icon: '🌐', count: 8, color: 'text-synapse-green' },
    { label: 'Automation', icon: '⚡', count: 12, color: 'text-synapse-orange' },
    { label: 'Trading', icon: '📈', count: 6, color: 'text-synapse-cyan' },
];

export default function Sidebar() {
    const location = useLocation();
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isExpanded ? 256 : 80 }}
                className="fixed left-0 top-16 bottom-0 z-40 hidden lg:flex flex-col bg-dark-bg/80 backdrop-blur-xl border-r border-dark-border"
            >
                {/* Toggle Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-dark-card border border-dark-border flex items-center justify-center text-gray-400 hover:text-white hover:border-synapse-purple/50 transition-all z-50"
                >
                    <motion.svg
                        animate={{ rotate: isExpanded ? 0 : 180 }}
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </motion.svg>
                </button>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link key={item.path} to={item.path}>
                                <motion.div
                                    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-gradient-to-r from-synapse-orange/20 to-synapse-purple/20 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-dark-card'
                                        }`}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-synapse-orange to-synapse-purple rounded-r-full"
                                        />
                                    )}
                                    <span className="text-xl">{item.icon}</span>
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.span
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: 'auto' }}
                                                exit={{ opacity: 0, width: 0 }}
                                                className="font-medium whitespace-nowrap overflow-hidden"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </Link>
                        );
                    })}

                    {/* Divider */}
                    <div className="my-4 border-t border-dark-border" />

                    {/* Categories */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-2"
                            >
                                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Categories
                                </p>
                                {categories.map((cat) => (
                                    <motion.button
                                        key={cat.label}
                                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-dark-card transition-all"
                                        whileHover={{ x: 4 }}
                                    >
                                        <span className="flex items-center gap-3">
                                            <span>{cat.icon}</span>
                                            <span className="text-sm">{cat.label}</span>
                                        </span>
                                        <span className={`text-xs font-medium ${cat.color}`}>{cat.count}</span>
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </nav>

                {/* Footer */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-4 border-t border-dark-border"
                        >
                            <div className="glass-card p-4 bg-gradient-to-br from-synapse-purple/10 to-synapse-orange/10">
                                <p className="text-sm font-medium text-white mb-1">🚀 Pro Tip</p>
                                <p className="text-xs text-gray-400 mb-3">
                                    Create your own AI agent and earn USDC!
                                </p>
                                <Link
                                    to="/create-agent"
                                    className="block w-full py-2 text-center text-sm font-medium rounded-lg bg-gradient-to-r from-synapse-orange to-synapse-purple text-white hover:opacity-90 transition-opacity"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.aside>

            {/* Mobile Sidebar */}
            <div className="lg:hidden">
                {/* Mobile Toggle */}
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="fixed left-4 top-20 z-40 p-2 rounded-xl bg-dark-card border border-dark-border text-gray-400"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Mobile Overlay */}
                <AnimatePresence>
                    {isMobileOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                                onClick={() => setIsMobileOpen(false)}
                            />
                            <motion.aside
                                initial={{ x: -280 }}
                                animate={{ x: 0 }}
                                exit={{ x: -280 }}
                                className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-dark-bg border-r border-dark-border p-4"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-xl font-display font-bold gradient-text">SynapsePay</span>
                                    <button
                                        onClick={() => setIsMobileOpen(false)}
                                        className="p-2 rounded-lg hover:bg-dark-card"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <nav className="space-y-2">
                                    {menuItems.map((item) => (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsMobileOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl ${location.pathname === item.path
                                                ? 'bg-gradient-to-r from-synapse-orange/20 to-synapse-purple/20 text-white'
                                                : 'text-gray-400 hover:text-white hover:bg-dark-card'
                                                }`}
                                        >
                                            <span className="text-xl">{item.icon}</span>
                                            <span>{item.label}</span>
                                        </Link>
                                    ))}
                                </nav>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
