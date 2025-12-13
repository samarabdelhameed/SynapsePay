import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

// Icons
const SearchIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const BellIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

const WalletIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);

export default function Navbar() {
    // Use real wallet adapter
    const { connected, publicKey, disconnect, wallet } = useWallet();
    const { setVisible } = useWalletModal();

    const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const connectWallet = () => {
        setVisible(true);
    };

    const disconnectWallet = () => {
        disconnect();
        setWalletDropdownOpen(false);
    };

    // Format wallet address for display
    const formatAddress = (address: string) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-dark-bg/80 backdrop-blur-xl border-b border-dark-border">
            <div className="h-full px-6 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 group">
                    <motion.div
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-synapse-orange to-synapse-purple flex items-center justify-center"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                    >
                        <span className="text-xl font-bold text-white">S</span>
                    </motion.div>
                    <span className="text-xl font-display font-bold hidden sm:block">
                        <span className="text-white">Synapse</span>
                        <span className="gradient-text">Pay</span>
                    </span>
                </Link>

                {/* Search Bar */}
                <div className="hidden md:flex flex-1 max-w-xl mx-8">
                    <div className="relative w-full">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            placeholder="Search agents, tasks, or addresses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 bg-dark-card border border-dark-border rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-synapse-purple/50 focus:ring-2 focus:ring-synapse-purple/20 transition-all"
                        />
                        {searchQuery && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                onClick={() => setSearchQuery('')}
                            >
                                ✕
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                    {/* Theme Toggle */}
                    <motion.button
                        className="p-2.5 rounded-xl bg-dark-card border border-dark-border text-gray-400 hover:text-white hover:border-synapse-purple/50 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
                        </svg>
                    </motion.button>

                    {/* Notifications */}
                    <motion.button
                        className="relative p-2.5 rounded-xl bg-dark-card border border-dark-border text-gray-400 hover:text-white hover:border-synapse-purple/50 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <BellIcon />
                        {/* Notification badge */}
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-synapse-orange rounded-full text-[10px] font-bold flex items-center justify-center">
                            3
                        </span>
                    </motion.button>

                    {/* Wallet Button */}
                    <div className="relative">
                        {connected && publicKey ? (
                            <>
                                <motion.button
                                    onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-synapse-purple/20 to-synapse-green/20 border border-synapse-purple/30 hover:border-synapse-purple/50 transition-all"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-synapse-purple to-synapse-green flex items-center justify-center">
                                        <span className="text-sm font-bold">👛</span>
                                    </div>
                                    <div className="text-left hidden sm:block">
                                        <p className="text-xs text-gray-400">{wallet?.adapter.name || 'Wallet'}</p>
                                        <p className="text-sm font-semibold text-white font-mono">{formatAddress(publicKey.toBase58())}</p>
                                    </div>
                                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${walletDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </motion.button>

                                {/* Dropdown */}
                                <AnimatePresence>
                                    {walletDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full right-0 mt-2 w-64 glass-card p-4 space-y-3"
                                        >
                                            <div className="flex items-center gap-3 pb-3 border-b border-dark-border">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-synapse-purple to-synapse-green flex items-center justify-center">
                                                    {wallet?.adapter.icon ? <img src={wallet.adapter.icon} alt="wallet" className="w-6 h-6" /> : '👛'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white font-mono">{formatAddress(publicKey.toBase58())}</p>
                                                    <p className="text-xs text-gray-400">{wallet?.adapter.name || 'Connected'}</p>
                                                </div>
                                            </div>
                                            <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-card-hover transition-colors">
                                                <span>📊</span>
                                                <span className="text-sm">Dashboard</span>
                                            </Link>
                                            <Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-card-hover transition-colors">
                                                <span>⚙️</span>
                                                <span className="text-sm">Settings</span>
                                            </Link>
                                            <button
                                                onClick={disconnectWallet}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                                            >
                                                <span>🔌</span>
                                                <span className="text-sm">Disconnect</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        ) : (
                            <motion.button
                                onClick={connectWallet}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-synapse-orange to-synapse-purple font-semibold text-white shadow-glow-purple"
                                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(153, 69, 255, 0.5)' }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <WalletIcon />
                                <span className="hidden sm:inline">Connect Wallet</span>
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
