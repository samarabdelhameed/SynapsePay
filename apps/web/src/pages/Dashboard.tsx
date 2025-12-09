import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

// Sample data for charts
const spendingData = [
    { name: 'Jan', spent: 2.4, tasks: 12 },
    { name: 'Feb', spent: 1.8, tasks: 8 },
    { name: 'Mar', spent: 3.2, tasks: 18 },
    { name: 'Apr', spent: 2.8, tasks: 14 },
    { name: 'May', spent: 4.5, tasks: 22 },
    { name: 'Jun', spent: 3.9, tasks: 19 },
    { name: 'Jul', spent: 5.2, tasks: 28 },
    { name: 'Aug', spent: 4.8, tasks: 25 },
    { name: 'Sep', spent: 6.1, tasks: 32 },
    { name: 'Oct', spent: 5.5, tasks: 29 },
    { name: 'Nov', spent: 7.2, tasks: 38 },
    { name: 'Dec', spent: 8.4, tasks: 45 },
];

const categoryData = [
    { name: 'AI', value: 45, color: '#9945FF' },
    { name: 'NFT', value: 20, color: '#FF6B35' },
    { name: 'Trading', value: 15, color: '#14F195' },
    { name: 'IoT', value: 10, color: '#00D4FF' },
    { name: 'Other', value: 10, color: '#FF0080' },
];

const weeklyData = [
    { day: 'Mon', tasks: 8, cost: 1.2 },
    { day: 'Tue', tasks: 12, cost: 1.8 },
    { day: 'Wed', tasks: 6, cost: 0.9 },
    { day: 'Thu', tasks: 15, cost: 2.1 },
    { day: 'Fri', tasks: 10, cost: 1.5 },
    { day: 'Sat', tasks: 4, cost: 0.6 },
    { day: 'Sun', tasks: 3, cost: 0.4 },
];

// Stats data
const stats = [
    { label: 'Total Spent', value: '$12.45', change: '+$2.30', up: true, icon: '💸', color: 'from-synapse-orange to-red-500' },
    { label: 'Tasks Run', value: '48', change: '+12', up: true, icon: '🚀', color: 'from-synapse-purple to-pink-500' },
    { label: 'Agents Used', value: '8', change: '+3', up: true, icon: '🤖', color: 'from-synapse-green to-teal-500' },
    { label: 'Subscriptions', value: '3', change: '0', up: false, icon: '🔄', color: 'from-synapse-cyan to-blue-500' },
];

const recentTasks = [
    { id: '1', agent: 'PDF Summarizer', status: 'completed', cost: '0.05', time: '2 min ago', icon: '📄' },
    { id: '2', agent: 'Image Editor', status: 'completed', cost: '0.10', time: '15 min ago', icon: '🎨' },
    { id: '3', agent: 'Code Debugger', status: 'completed', cost: '0.08', time: '1 hour ago', icon: '🐛' },
    { id: '4', agent: 'NFT Minter', status: 'failed', cost: '0.00', time: '2 hours ago', icon: '🖼️' },
    { id: '5', agent: 'Trading Signals', status: 'completed', cost: '0.20', time: '3 hours ago', icon: '📈' },
];

const subscriptions = [
    { id: '1', agent: 'Daily Report', cadence: 'Daily', nextRun: 'Tomorrow 9:00 AM', cost: '0.10', active: true },
    { id: '2', agent: 'Wallet Monitor', cadence: 'Hourly', nextRun: 'In 45 mins', cost: '0.02', active: true },
    { id: '3', agent: 'Price Alerts', cadence: 'Every 6h', nextRun: 'In 2 hours', cost: '0.05', active: false },
];

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-card p-3 border border-dark-border">
                <p className="text-white font-medium">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ color: entry.color }} className="text-sm">
                        {entry.name}: {entry.name === 'spent' || entry.name === 'cost' ? '$' : ''}{entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'subscriptions' | 'analytics'>('overview');
    const [chartPeriod, setChartPeriod] = useState('30D');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white">Dashboard</h1>
                    <p className="text-gray-400 mt-1">Monitor your AI agent activity</p>
                </div>
                <div className="flex gap-3">
                    <motion.button
                        className="btn-secondary flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                    >
                        <span>📊</span>
                        <span>Export Report</span>
                    </motion.button>
                    <Link to="/marketplace">
                        <motion.button
                            className="btn-primary flex items-center gap-2"
                            whileHover={{ scale: 1.02 }}
                        >
                            <span>🔍</span>
                            <span>Browse Agents</span>
                        </motion.button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -4 }}
                        className="glass-card p-6"
                    >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl mb-4`}>
                            {stat.icon}
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="text-sm text-gray-400">{stat.label}</p>
                            </div>
                            <span className={`text-sm font-medium ${stat.up ? 'text-synapse-green' : 'text-gray-400'}`}>
                                {stat.change}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Spending Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 glass-card p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-white">Spending Overview</h2>
                        <div className="flex gap-2">
                            {['7D', '30D', '90D', '1Y'].map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setChartPeriod(period)}
                                    className={`px-3 py-1 rounded-lg text-sm transition-all ${chartPeriod === period
                                            ? 'bg-synapse-purple text-white'
                                            : 'text-gray-400 hover:text-white hover:bg-dark-card'
                                        }`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={spendingData}>
                            <defs>
                                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#9945FF" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#9945FF" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#14F195" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#14F195" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" />
                            <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                            <YAxis stroke="#6B7280" fontSize={12} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="spent"
                                stroke="#9945FF"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorSpent)"
                                name="Spent (USDC)"
                            />
                            <Area
                                type="monotone"
                                dataKey="tasks"
                                stroke="#14F195"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorTasks)"
                                name="Tasks"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Category Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-6"
                >
                    <h2 className="text-xl font-semibold text-white mb-6">By Category</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {categoryData.map((cat) => (
                            <div key={cat.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                <span className="text-sm text-gray-400">{cat.name}</span>
                                <span className="text-sm text-white ml-auto">{cat.value}%</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Weekly Activity Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card p-6"
            >
                <h2 className="text-xl font-semibold text-white mb-6">This Week's Activity</h2>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" />
                        <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
                        <YAxis stroke="#6B7280" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="tasks" fill="#FF6B35" radius={[4, 4, 0, 0]} name="Tasks" />
                        <Bar dataKey="cost" fill="#9945FF" radius={[4, 4, 0, 0]} name="Cost (USDC)" />
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-dark-border">
                {(['overview', 'tasks', 'subscriptions', 'analytics'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 font-medium transition-all relative ${activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {activeTab === tab && (
                            <motion.div
                                layoutId="dashboardTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-synapse-orange to-synapse-purple"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Recent Tasks */}
            {(activeTab === 'tasks' || activeTab === 'overview') && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card overflow-hidden"
                >
                    <div className="p-4 border-b border-dark-border flex items-center justify-between">
                        <h3 className="font-semibold text-white">Recent Tasks</h3>
                        <button className="text-sm text-synapse-purple hover:text-synapse-purple-light">
                            View All →
                        </button>
                    </div>
                    <div className="divide-y divide-dark-border">
                        {recentTasks.map((task, index) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-4 flex items-center justify-between hover:bg-dark-card/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-dark-card flex items-center justify-center text-xl">
                                        {task.icon}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{task.agent}</p>
                                        <p className="text-sm text-gray-400">{task.time}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${task.status === 'completed'
                                            ? 'bg-synapse-green/20 text-synapse-green'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {task.status}
                                    </span>
                                    <span className="text-white font-medium">${task.cost}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Subscriptions */}
            {(activeTab === 'subscriptions' || activeTab === 'overview') && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card overflow-hidden"
                >
                    <div className="p-4 border-b border-dark-border flex items-center justify-between">
                        <h3 className="font-semibold text-white">Active Subscriptions</h3>
                        <button className="text-sm text-synapse-purple hover:text-synapse-purple-light">
                            Manage →
                        </button>
                    </div>
                    <div className="divide-y divide-dark-border">
                        {subscriptions.map((sub, index) => (
                            <motion.div
                                key={sub.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-4 flex items-center justify-between hover:bg-dark-card/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full ${sub.active ? 'bg-synapse-green animate-pulse' : 'bg-gray-500'}`} />
                                    <div>
                                        <p className="font-medium text-white">{sub.agent}</p>
                                        <p className="text-sm text-gray-400">{sub.cadence} • Next: {sub.nextRun}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-white font-medium">${sub.cost}/run</span>
                                    <button className={`relative w-12 h-6 rounded-full transition-colors ${sub.active ? 'bg-synapse-green' : 'bg-dark-border'}`}>
                                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${sub.active ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Analytics Tab Content */}
            {activeTab === 'analytics' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid md:grid-cols-2 gap-6"
                >
                    {/* Performance Line Chart */}
                    <div className="glass-card p-6">
                        <h3 className="font-semibold text-white mb-4">Task Success Rate</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={[
                                { name: 'W1', success: 95, failed: 5 },
                                { name: 'W2', success: 92, failed: 8 },
                                { name: 'W3', success: 98, failed: 2 },
                                { name: 'W4', success: 96, failed: 4 },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" />
                                <XAxis dataKey="name" stroke="#6B7280" />
                                <YAxis stroke="#6B7280" />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="success" stroke="#14F195" strokeWidth={2} dot={{ fill: '#14F195' }} name="Success %" />
                                <Line type="monotone" dataKey="failed" stroke="#FF6B35" strokeWidth={2} dot={{ fill: '#FF6B35' }} name="Failed %" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Top Agents */}
                    <div className="glass-card p-6">
                        <h3 className="font-semibold text-white mb-4">Top Agents Used</h3>
                        <div className="space-y-4">
                            {[
                                { name: 'PDF Summarizer', runs: 18, percentage: 80 },
                                { name: 'Image Editor', runs: 12, percentage: 60 },
                                { name: 'Code Debugger', runs: 8, percentage: 40 },
                                { name: 'NFT Minter', runs: 5, percentage: 25 },
                            ].map((agent, i) => (
                                <div key={agent.name}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-white">{agent.name}</span>
                                        <span className="text-gray-400">{agent.runs} runs</span>
                                    </div>
                                    <div className="h-2 bg-dark-border rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${agent.percentage}%` }}
                                            transition={{ delay: i * 0.1, duration: 0.5 }}
                                            className="h-full bg-gradient-to-r from-synapse-purple to-synapse-orange rounded-full"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
                {[
                    { icon: '🤖', title: 'Run New Agent', desc: 'Execute an AI task', link: '/marketplace', color: 'from-synapse-purple to-pink-500' },
                    { icon: '➕', title: 'Create Agent', desc: 'Build your own agent', link: '/create-agent', color: 'from-synapse-orange to-red-500' },
                    { icon: '⚡', title: 'Quick Blink', desc: 'Generate action link', link: '/marketplace', color: 'from-synapse-green to-teal-500' },
                ].map((action, index) => (
                    <Link key={action.title} to={action.link}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            whileHover={{ y: -4, scale: 1.02 }}
                            className="glass-card-hover p-6 flex items-center gap-4 cursor-pointer"
                        >
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-2xl`}>
                                {action.icon}
                            </div>
                            <div>
                                <p className="font-semibold text-white">{action.title}</p>
                                <p className="text-sm text-gray-400">{action.desc}</p>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </motion.div>
    );
}
