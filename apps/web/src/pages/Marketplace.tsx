import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AgentCardSkeleton } from '../components/ui/Skeleton';

// Sample agents data
const agents = [
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
        isNew: false,
        isTrending: true,
    },
    {
        id: 'image-editor-v1',
        name: 'Image Editor',
        description: 'Remove background, resize, and apply AI filters',
        price: '0.10',
        runs: 980,
        rating: 4.7,
        category: 'AI',
        icon: '🎨',
        gradient: 'from-pink-500 to-rose-600',
        isNew: false,
        isTrending: true,
    },
    {
        id: 'code-debugger-v1',
        name: 'Code Debugger',
        description: 'AI-powered code analysis and bug fixing',
        price: '0.08',
        runs: 720,
        rating: 4.6,
        category: 'AI',
        icon: '🐛',
        gradient: 'from-amber-500 to-orange-600',
        isNew: true,
        isTrending: false,
    },
    {
        id: 'nft-minter-v1',
        name: 'NFT Minter',
        description: 'Transform images into NFTs on Solana',
        price: '0.25',
        runs: 850,
        rating: 4.9,
        category: 'NFT',
        icon: '🖼️',
        gradient: 'from-purple-500 to-pink-600',
        isNew: false,
        isTrending: true,
    },
    {
        id: 'trading-signal-v1',
        name: 'Trading Signals',
        description: 'AI-powered market analysis and signals',
        price: '0.20',
        runs: 620,
        rating: 4.7,
        category: 'Trading',
        icon: '📈',
        gradient: 'from-green-500 to-teal-600',
        isNew: false,
        isTrending: false,
    },
    {
        id: 'wallet-analyzer-v1',
        name: 'Wallet Analyzer',
        description: 'Deep analysis of wallet activity and holdings',
        price: '0.05',
        runs: 450,
        rating: 4.5,
        category: 'Utility',
        icon: '💼',
        gradient: 'from-cyan-500 to-blue-600',
        isNew: true,
        isTrending: false,
    },
    {
        id: 'video-summarizer-v1',
        name: 'Video Summarizer',
        description: 'Summarize YouTube videos with AI',
        price: '0.15',
        runs: 380,
        rating: 4.4,
        category: 'AI',
        icon: '🎬',
        gradient: 'from-red-500 to-pink-600',
        isNew: true,
        isTrending: false,
    },
    {
        id: 'smart-light-v1',
        name: 'Smart Light Control',
        description: 'IoT smart light automation',
        price: '0.02',
        runs: 290,
        rating: 4.3,
        category: 'IoT',
        icon: '💡',
        gradient: 'from-yellow-500 to-amber-600',
        isNew: false,
        isTrending: false,
    },
    {
        id: 'daily-report-v1',
        name: 'Daily Report',
        description: 'Auto-generate daily portfolio reports',
        price: '0.10',
        runs: 520,
        rating: 4.6,
        category: 'Automation',
        icon: '📊',
        gradient: 'from-indigo-500 to-violet-600',
        isNew: false,
        isTrending: true,
    },
];

const categories = [
    { id: 'all', label: 'All Agents', icon: '🏪' },
    { id: 'AI', label: 'AI', icon: '🤖' },
    { id: 'NFT', label: 'NFT', icon: '🖼️' },
    { id: 'Trading', label: 'Trading', icon: '📈' },
    { id: 'IoT', label: 'IoT', icon: '🌐' },
    { id: 'Automation', label: 'Automation', icon: '⚡' },
    { id: 'Utility', label: 'Utility', icon: '🔧' },
];

const sortOptions = [
    { id: 'popular', label: 'Most Popular' },
    { id: 'newest', label: 'Newest' },
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
    { id: 'rating', label: 'Highest Rated' },
];

export default function Marketplace() {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('popular');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isLoading, setIsLoading] = useState(true);

    // Simulate initial loading for better perceived performance
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800); // Brief loading state for smooth transition
        return () => clearTimeout(timer);
    }, []);

    // Filter agents
    const filteredAgents = agents.filter((agent) => {
        const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory;
        const matchesSearch =
            agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            agent.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Sort agents
    const sortedAgents = [...filteredAgents].sort((a, b) => {
        switch (sortBy) {
            case 'popular':
                return b.runs - a.runs;
            case 'newest':
                return a.isNew ? -1 : 1;
            case 'price-low':
                return parseFloat(a.price) - parseFloat(b.price);
            case 'price-high':
                return parseFloat(b.price) - parseFloat(a.price);
            case 'rating':
                return b.rating - a.rating;
            default:
                return 0;
        }
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 sm:space-y-6 px-1 sm:px-0"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
                        Agent Marketplace
                    </h1>
                    <p className="text-sm sm:text-base text-gray-400 mt-1">
                        Discover and run AI agents with micropayments
                    </p>
                </div>
                <Link to="/create-agent">
                    <motion.button
                        className="btn-primary flex items-center gap-2 whitespace-nowrap"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span>➕</span>
                        <span>Create Agent</span>
                    </motion.button>
                </Link>
            </div>

            {/* Search and Filters */}
            <div className="glass-card p-3 sm:p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <svg
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search agents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-synapse-purple"
                        />
                    </div>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white focus:outline-none focus:border-synapse-purple cursor-pointer"
                    >
                        {sortOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    {/* View Mode */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-3 rounded-xl border transition-all ${viewMode === 'grid'
                                ? 'bg-synapse-purple/20 border-synapse-purple text-synapse-purple'
                                : 'bg-dark-bg border-dark-border text-gray-400 hover:text-white'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-3 rounded-xl border transition-all ${viewMode === 'list'
                                ? 'bg-synapse-purple/20 border-synapse-purple text-synapse-purple'
                                : 'bg-dark-bg border-dark-border text-gray-400 hover:text-white'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 hide-scrollbar">
                    {categories.map((cat) => (
                        <motion.button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${selectedCategory === cat.id
                                ? 'bg-gradient-to-r from-synapse-orange to-synapse-purple text-white'
                                : 'bg-dark-bg border border-dark-border text-gray-400 hover:text-white hover:border-synapse-purple/50'
                                }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <p className="text-gray-400">
                    Showing <span className="text-white font-medium">{sortedAgents.length}</span> agents
                </p>
            </div>

            {/* Agent Grid / List */}
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <AgentCardSkeleton key={i} />
                        ))}
                    </motion.div>
                ) : viewMode === 'grid' ? (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                    >
                        {sortedAgents.map((agent, index) => (
                            <motion.div
                                key={agent.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link to={`/agent/${agent.id}`}>
                                    <motion.div
                                        className="glass-card-hover group h-full"
                                        whileHover={{ y: -8 }}
                                    >
                                        {/* Card Header with Gradient */}
                                        <div
                                            className={`h-32 rounded-t-2xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center text-5xl relative overflow-hidden`}
                                        >
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                                            {/* Badges */}
                                            <div className="absolute top-3 left-3 flex gap-2">
                                                {agent.isNew && (
                                                    <span className="px-2 py-1 rounded-lg bg-synapse-green/90 text-xs font-bold text-dark-bg">
                                                        NEW
                                                    </span>
                                                )}
                                                {agent.isTrending && (
                                                    <span className="px-2 py-1 rounded-lg bg-synapse-orange/90 text-xs font-bold text-white">
                                                        🔥 HOT
                                                    </span>
                                                )}
                                            </div>

                                            <motion.span
                                                className="relative z-10"
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                {agent.icon}
                                            </motion.span>
                                        </div>

                                        {/* Card Content */}
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="badge-info">{agent.category}</span>
                                                <span className="flex items-center gap-1 text-yellow-400 text-sm">
                                                    ⭐ {agent.rating}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-synapse-purple transition-colors">
                                                {agent.name}
                                            </h3>
                                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                                {agent.description}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-2xl font-bold text-synapse-green">
                                                        ${agent.price}
                                                    </span>
                                                    <span className="text-gray-400 text-sm ml-1">USDC</span>
                                                </div>
                                                <span className="text-gray-500 text-sm">
                                                    {agent.runs.toLocaleString()} runs
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {sortedAgents.map((agent, index) => (
                            <motion.div
                                key={agent.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link to={`/agent/${agent.id}`}>
                                    <motion.div
                                        className="glass-card-hover p-4 flex items-center gap-6"
                                        whileHover={{ x: 8 }}
                                    >
                                        {/* Icon */}
                                        <div
                                            className={`w-20 h-20 rounded-xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center text-4xl shrink-0`}
                                        >
                                            {agent.icon}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-semibold text-white">
                                                    {agent.name}
                                                </h3>
                                                <span className="badge-info text-xs">{agent.category}</span>
                                                {agent.isNew && (
                                                    <span className="px-2 py-0.5 rounded bg-synapse-green/20 text-synapse-green text-xs font-medium">
                                                        NEW
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-400 text-sm">{agent.description}</p>
                                        </div>

                                        {/* Stats */}
                                        <div className="hidden md:flex items-center gap-6 text-center">
                                            <div>
                                                <p className="text-lg font-bold text-white">{agent.runs.toLocaleString()}</p>
                                                <p className="text-xs text-gray-400">Runs</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-yellow-400">⭐ {agent.rating}</p>
                                                <p className="text-xs text-gray-400">Rating</p>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-synapse-green">${agent.price}</p>
                                            <p className="text-xs text-gray-400">USDC</p>
                                        </div>
                                    </motion.div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty State */}
            {sortedAgents.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card p-12 text-center"
                >
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No agents found</h3>
                    <p className="text-gray-400 mb-6">
                        Try adjusting your search or filter criteria
                    </p>
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('all');
                        }}
                        className="btn-secondary"
                    >
                        Clear Filters
                    </button>
                </motion.div>
            )}
        </motion.div>
    );
}
