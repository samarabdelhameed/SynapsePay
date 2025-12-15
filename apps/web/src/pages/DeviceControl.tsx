import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import DeviceAccessGate from '../components/device/DeviceAccessGate';
import DeviceStatusPanel from '../components/device/DeviceStatusPanel';
import DirectionalControls from '../components/device/DirectionalControls';
import LiveFeed from '../components/device/LiveFeed';
import SystemLogs, { createLogEntry } from '../components/device/SystemLogs';

// Demo device data
const DEMO_DEVICES: Record<string, {
    id: string;
    name: string;
    type: 'robot' | 'drone' | 'printer' | 'led';
    description: string;
    priceUsdc: number;
    durationMinutes: number;
    location?: { lat: number; lon: number };
    streamUrl?: string; // 👈 URL for iframe video stream from robot/camera
    icon: string;
}> = {
    'ugv-rover-01': {
        id: 'ugv-rover-01',
        name: 'UGV Rover 01',
        type: 'robot',
        description: 'Unmanned Ground Vehicle for exploration and monitoring',
        priceUsdc: 0.10,
        durationMinutes: 10,
        location: { lat: 34.0522, lon: 118.2437 },
        streamUrl: 'http://192.168.0.221:5000', // 👈 Robot camera stream URL
        icon: '🤖',
    },
    'smart-led-array': {
        id: 'smart-led-array',
        name: 'Smart LED Array',
        type: 'led',
        description: 'RGB LED matrix for light shows and signaling',
        priceUsdc: 0.05,
        durationMinutes: 5,
        icon: '💡',
    },
    'drone-cam-01': {
        id: 'drone-cam-01',
        name: 'Drone Camera 01',
        type: 'drone',
        description: 'Aerial drone with 4K camera for photography',
        priceUsdc: 0.25,
        durationMinutes: 15,
        location: { lat: 40.7128, lon: 74.0060 },
        icon: '🚁',
    },
};

type LogEntry = {
    id: string;
    timestamp: Date;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'command';
};

export default function DeviceControl() {
    const { deviceId } = useParams<{ deviceId: string }>();
    const device = DEMO_DEVICES[deviceId || 'ugv-rover-01'] || DEMO_DEVICES['ugv-rover-01'];

    // Use real wallet adapter with full functionality
    const { connected, publicKey } = useWallet();
    const { setVisible } = useWalletModal();

    // State
    const [accessGranted, setAccessGranted] = useState(false);
    const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [txActive, setTxActive] = useState(false);

    // Device metrics (simulated)
    const [deviceMetrics, setDeviceMetrics] = useState({
        battery: 87,
        signal: 97,
        temperature: 40.4,
        status: 'idle' as 'online' | 'offline' | 'busy' | 'idle',
    });

    // Add log helper
    const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
        setLogs(prev => [...prev, createLogEntry(message, type)]);
    }, []);

    // Open wallet modal for connection
    const handleConnectWallet = () => {
        setVisible(true);
    };

    // Handle payment initiation - just show the modal
    const handleInitiatePayment = () => {
        if (!connected) {
            addLog('ERROR: Wallet not connected', 'error');
            return;
        }

        addLog('Opening payment interface...', 'info');
        // The modal will handle the actual payment flow
    };



    // Handle access granted after successful payment
    const handleAccessGranted = (paymentResult?: any) => {
        setAccessGranted(true);
        setSessionTimeRemaining(device.durationMinutes * 60);
        setDeviceMetrics(prev => ({ ...prev, status: 'online' }));
        setTxActive(false);

        if (paymentResult?.txSignature) {
            addLog(`✅ Payment successful! TX: ${paymentResult.txSignature}`, 'success');
        }
        addLog(`🔓 Device access granted for ${device.durationMinutes} minutes`, 'success');
        addLog('🔗 Establishing secure connection to device...', 'info');
        setTimeout(() => {
            addLog('✨ Device control interface active', 'success');
        }, 1500);
    };

    // Handle device commands
    const handleCommand = (direction: 'up' | 'down' | 'left' | 'right' | 'stop') => {
        if (!accessGranted) return;

        const commandMap = {
            up: 'MOVE_FORWARD',
            down: 'MOVE_BACKWARD',
            left: 'TURN_LEFT',
            right: 'TURN_RIGHT',
            stop: 'STOP',
        };

        const command = commandMap[direction];
        addLog(`TX: ${command}`, 'command');

        // Simulate device response
        if (direction !== 'stop') {
            setTimeout(() => {
                addLog(`ACK: ${command} executing`, 'success');
            }, 100);
        }
    };

    // Session countdown timer
    useEffect(() => {
        if (!accessGranted || sessionTimeRemaining <= 0) return;

        const interval = setInterval(() => {
            setSessionTimeRemaining(prev => {
                if (prev <= 1) {
                    setAccessGranted(false);
                    setDeviceMetrics(m => ({ ...m, status: 'idle' }));
                    addLog('Session expired. Device access revoked.', 'warning');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [accessGranted, sessionTimeRemaining, addLog]);

    // Simulate device metric updates
    useEffect(() => {
        if (!accessGranted) return;

        const interval = setInterval(() => {
            setDeviceMetrics(prev => ({
                ...prev,
                temperature: prev.temperature + (Math.random() - 0.5) * 0.5,
                signal: Math.min(100, Math.max(80, prev.signal + (Math.random() - 0.5) * 2)),
            }));
        }, 3000);

        return () => clearInterval(interval);
    }, [accessGranted]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen"
        >
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link to="/devices" className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                            <span>{device.icon}</span>
                            <span>{device.name}</span>
                        </h1>
                        <p className="text-sm text-gray-400">{device.description}</p>
                    </div>
                </div>

                {/* Status Indicators */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">X402</span>
                        <span className="text-synapse-green">ONLINE</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">NET</span>
                        <span className={connected ? 'text-synapse-green' : 'text-gray-400'}>
                            {connected ? 'OK' : '--'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">SYS</span>
                        <span className="text-synapse-cyan">PWR</span>
                    </div>

                    {/* Wallet Button */}
                    {!connected ? (
                        <motion.button
                            onClick={handleConnectWallet}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-synapse-purple hover:bg-synapse-purple-light transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            <span className="text-sm font-medium">Connect Wallet</span>
                        </motion.button>
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-synapse-green/20 border border-synapse-green/30">
                            <div className="w-2 h-2 rounded-full bg-synapse-green animate-pulse" />
                            <span className="text-sm font-mono text-synapse-green">
                                {publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : 'Connected'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!connected ? (
                    /* Connect Wallet Screen */
                    <motion.div
                        key="connect"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-center justify-center min-h-[60vh]"
                    >
                        <div className="text-center max-w-md">
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-synapse-purple/30 to-synapse-cyan/30 border border-synapse-purple/30 flex items-center justify-center text-5xl"
                            >
                                {device.icon}
                            </motion.div>
                            <h2 className="text-2xl font-bold text-white mb-3">
                                Connect to SynapsePay
                            </h2>
                            <p className="text-gray-400 mb-6">
                                Access the {device.name} controls by connecting your wallet.
                                This application uses the X402 protocol for secure, gasless micropayments.
                            </p>
                            <motion.button
                                onClick={handleConnectWallet}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-synapse-purple hover:bg-synapse-purple-light transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                <span className="font-medium">Connect Wallet</span>
                            </motion.button>
                        </div>
                    </motion.div>
                ) : !accessGranted ? (
                    /* Payment Gate Screen */
                    <motion.div
                        key="gate"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="py-8"
                    >
                        <DeviceAccessGate
                            deviceName={device.name}
                            priceUsdc={device.priceUsdc}
                            durationMinutes={device.durationMinutes}
                            onInitiatePayment={handleInitiatePayment}
                            onAccessGranted={handleAccessGranted}
                            connected={connected}
                        />
                    </motion.div>
                ) : (
                    /* Device Control Interface */
                    <motion.div
                        key="control"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid lg:grid-cols-3 gap-6"
                    >
                        {/* Left Column - Live Feed */}
                        <div className="lg:col-span-2 space-y-6">
                            <LiveFeed
                                isConnected={accessGranted}
                                deviceName={device.name}
                                streamUrl={device.streamUrl}
                                location={device.location}
                            />

                            <SystemLogs
                                logs={logs}
                                txActive={txActive}
                                maxHeight="180px"
                            />
                        </div>

                        {/* Right Column - Status & Controls */}
                        <div className="space-y-6">
                            <DeviceStatusPanel
                                deviceName={device.name}
                                deviceId={device.id.toUpperCase()}
                                status={deviceMetrics.status}
                                battery={deviceMetrics.battery}
                                signal={deviceMetrics.signal}
                                temperature={deviceMetrics.temperature}
                                sessionTimeRemaining={sessionTimeRemaining}
                                location={device.location}
                            />

                            {device.type === 'robot' || device.type === 'drone' ? (
                                <DirectionalControls
                                    onCommand={handleCommand}
                                    disabled={!accessGranted}
                                    enableKeyboard={true}
                                />
                            ) : (
                                /* Alternative controls for non-vehicle devices */
                                <div className="glass-card p-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">Device Controls</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <motion.button
                                            onClick={() => addLog('Power ON signal sent', 'command')}
                                            className="py-3 rounded-xl bg-synapse-green/20 text-synapse-green border border-synapse-green/30 hover:bg-synapse-green/30 transition-colors"
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Power ON
                                        </motion.button>
                                        <motion.button
                                            onClick={() => addLog('Power OFF signal sent', 'command')}
                                            className="py-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Power OFF
                                        </motion.button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
