import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Settings() {
    const [activeSection, setActiveSection] = useState('profile');
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        taskComplete: true,
        marketing: false,
    });

    const sections = [
        { id: 'profile', label: 'Profile', icon: '👤' },
        { id: 'wallet', label: 'Wallet', icon: '💳' },
        { id: 'notifications', label: 'Notifications', icon: '🔔' },
        { id: 'api', label: 'API Keys', icon: '🔑' },
        { id: 'security', label: 'Security', icon: '🔒' },
    ];

    const handleSave = () => {
        toast.success('Settings saved successfully!');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto"
        >
            <h1 className="text-3xl font-display font-bold text-white mb-8">Settings</h1>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <div className="lg:w-64 shrink-0">
                    <div className="glass-card p-4 space-y-1">
                        {sections.map((section) => (
                            <motion.button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeSection === section.id
                                        ? 'bg-gradient-to-r from-synapse-orange/20 to-synapse-purple/20 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-dark-card'
                                    }`}
                                whileHover={{ x: 4 }}
                            >
                                <span className="text-xl">{section.icon}</span>
                                <span>{section.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-6"
                    >
                        {/* Profile Section */}
                        {activeSection === 'profile' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-white">Profile Settings</h2>

                                {/* Avatar */}
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-synapse-purple to-synapse-orange flex items-center justify-center text-3xl">
                                        👤
                                    </div>
                                    <div>
                                        <button className="btn-secondary text-sm">Change Avatar</button>
                                        <p className="text-xs text-gray-400 mt-2">JPG, PNG or GIF. Max 2MB.</p>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-white mb-2">Display Name</label>
                                        <input type="text" placeholder="Your name" className="input-dark" />
                                    </div>
                                    <div>
                                        <label className="block text-white mb-2">Username</label>
                                        <input type="text" placeholder="@username" className="input-dark" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-white mb-2">Bio</label>
                                    <textarea
                                        placeholder="Tell us about yourself..."
                                        rows={3}
                                        className="input-dark resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-white mb-2">Email</label>
                                    <input type="email" placeholder="your@email.com" className="input-dark" />
                                </div>
                            </div>
                        )}

                        {/* Wallet Section */}
                        {activeSection === 'wallet' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-white">Wallet Settings</h2>

                                <div className="glass-card bg-dark-bg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-synapse-purple to-synapse-green flex items-center justify-center">
                                                👻
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">Phantom Wallet</p>
                                                <p className="text-sm text-gray-400 font-mono">9WzD...QWWM</p>
                                            </div>
                                        </div>
                                        <span className="badge-success">Connected</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="btn-secondary text-sm flex-1">Copy Address</button>
                                        <button className="text-red-400 hover:text-red-300 text-sm px-4">Disconnect</button>
                                    </div>
                                </div>

                                <div className="glass-card bg-dark-bg p-6">
                                    <h3 className="font-medium text-white mb-4">Balance</h3>
                                    <div className="flex items-center gap-4">
                                        <span className="text-4xl font-bold text-synapse-green">24.50</span>
                                        <span className="text-xl text-gray-400">USDC</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-medium text-white mb-4">Network</h3>
                                    <div className="flex gap-3">
                                        {['Mainnet', 'Devnet'].map((network) => (
                                            <button
                                                key={network}
                                                className={`px-6 py-3 rounded-xl border transition-all ${network === 'Devnet'
                                                        ? 'border-synapse-purple bg-synapse-purple/20 text-white'
                                                        : 'border-dark-border text-gray-400 hover:text-white'
                                                    }`}
                                            >
                                                {network}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Section */}
                        {activeSection === 'notifications' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-white">Notification Preferences</h2>

                                {[
                                    { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                                    { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications' },
                                    { key: 'taskComplete', label: 'Task Completion', desc: 'Notify when tasks complete' },
                                    { key: 'marketing', label: 'Marketing', desc: 'Product updates and news' },
                                ].map((item) => (
                                    <div key={item.key} className="flex items-center justify-between p-4 bg-dark-bg rounded-xl">
                                        <div>
                                            <p className="text-white font-medium">{item.label}</p>
                                            <p className="text-sm text-gray-400">{item.desc}</p>
                                        </div>
                                        <button
                                            onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${notifications[item.key as keyof typeof notifications] ? 'bg-synapse-green' : 'bg-dark-border'
                                                }`}
                                        >
                                            <motion.span
                                                className="absolute top-1 w-4 h-4 rounded-full bg-white"
                                                animate={{
                                                    left: notifications[item.key as keyof typeof notifications] ? 28 : 4,
                                                }}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* API Keys Section */}
                        {activeSection === 'api' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-white">API Keys</h2>

                                <div className="p-4 bg-synapse-orange/10 border border-synapse-orange/30 rounded-xl">
                                    <p className="text-synapse-orange text-sm">
                                        ⚠️ Keep your API keys secure. Never share them publicly.
                                    </p>
                                </div>

                                {[
                                    { name: 'OpenAI API Key', masked: 'sk-...xxxx', service: 'OpenAI' },
                                    { name: 'Anthropic API Key', masked: 'sk-ant-...xxxx', service: 'Anthropic' },
                                ].map((key) => (
                                    <div key={key.name} className="p-4 bg-dark-bg rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">{key.name}</p>
                                                <p className="text-sm text-gray-400 font-mono">{key.masked}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="btn-secondary text-sm">Edit</button>
                                                <button className="text-red-400 hover:text-red-300 text-sm px-3">Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button className="btn-secondary w-full">+ Add API Key</button>
                            </div>
                        )}

                        {/* Security Section */}
                        {activeSection === 'security' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-white">Security Settings</h2>

                                <div className="p-4 bg-dark-bg rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">Two-Factor Authentication</p>
                                            <p className="text-sm text-gray-400">Add an extra layer of security</p>
                                        </div>
                                        <button className="btn-secondary text-sm">Enable</button>
                                    </div>
                                </div>

                                <div className="p-4 bg-dark-bg rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">Transaction Signing</p>
                                            <p className="text-sm text-gray-400">Require signature for all payments</p>
                                        </div>
                                        <span className="badge-success">Enabled</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-dark-bg rounded-xl">
                                    <h3 className="text-white font-medium mb-4">Active Sessions</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span>💻</span>
                                                <div>
                                                    <p className="text-sm text-white">MacBook Pro</p>
                                                    <p className="text-xs text-gray-400">Current session</p>
                                                </div>
                                            </div>
                                            <span className="text-synapse-green text-sm">Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <motion.button
                            onClick={handleSave}
                            className="btn-primary mt-8"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Save Changes
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
