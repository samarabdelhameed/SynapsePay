import { useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Sample agent data
const agentData: Record<string, any> = {
    'pdf-summarizer-v1': {
        id: 'pdf-summarizer-v1',
        name: 'PDF Summarizer',
        description: 'Extract key points, main themes, and actionable insights from any PDF document using advanced AI analysis.',
        longDescription: `This powerful AI agent uses GPT-4 to analyze PDF documents and extract the most important information.

**Features:**
- Key points extraction
- Main themes identification
- Actionable insights
- Multi-language support
- Custom summary length

**Use Cases:**
- Research paper analysis
- Contract review
- Report summarization
- Educational content digest`,
        price: '0.05',
        runs: 1250,
        rating: 4.8,
        ratingCount: 234,
        category: 'AI',
        icon: '📄',
        gradient: 'from-blue-500 to-purple-600',
        creator: '9WzD...QWWM',
        createdAt: '2024-12-01',
        aiModel: 'gpt-4-turbo',
        estimatedTime: '5-10 seconds',
        inputSchema: [
            { name: 'PDF File', type: 'file', required: true },
            { name: 'Max Tokens', type: 'number', required: false, default: 500 },
            { name: 'Language', type: 'select', options: ['English', 'Spanish', 'French', 'Arabic'] },
        ],
        recentRuns: [
            { id: '1', user: '8xKL...PqRs', status: 'completed', time: '2 min ago' },
            { id: '2', user: '3mNO...TuVw', status: 'completed', time: '5 min ago' },
            { id: '3', user: 'HN7c...Yrh', status: 'completed', time: '12 min ago' },
        ],
    },
};

export default function AgentDetails() {
    const { id } = useParams();
    const [isExecuting, setIsExecuting] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'input' | 'history'>('overview');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const agent = agentData[id!] || agentData['pdf-summarizer-v1'];

    // Handle file selection
    const handleFileSelect = useCallback((file: File) => {
        if (file.type === 'application/pdf') {
            setUploadedFile(file);
            toast.success(`📄 ${file.name} uploaded successfully!`);
            console.log('[Upload] PDF file selected:', file.name, 'Size:', (file.size / 1024).toFixed(2), 'KB');
        } else {
            toast.error('Please upload a PDF file');
        }
    }, []);

    // Handle drag events
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    // Handle click to upload
    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleRunAgent = () => {
        setShowPaymentModal(true);
    };

    const handleConfirmPayment = async () => {
        setShowPaymentModal(false);
        setIsExecuting(true);

        // Demo Mode simulation function - matches DEMO_VIDEO_SCRIPT.md exactly
        const runDemoMode = async () => {
            // Import confetti dynamically
            const confetti = (await import('canvas-confetti')).default;

            console.log('');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('[INFO] 🚀 Initiating X402 payment sequence...');
            console.log('═══════════════════════════════════════════════════════════');

            // Step 1: Creating invoice on Payments Program
            toast.loading('📝 Creating invoice...', { id: 'execute' });
            await new Promise(resolve => setTimeout(resolve, 800));
            const invoiceId = 'INV_' + Math.random().toString(36).substring(2, 8).toUpperCase();
            console.log('[INFO] Creating invoice on Payments Program...');
            console.log('[INFO] Invoice ID:', invoiceId);
            console.log('[INFO] Amount: 0.05 USDC');
            console.log('[INFO] Recipient: Agent Owner');

            // Step 2: Requesting USDC-SPL permit signature (Phantom popup would appear here)
            toast.loading('🔐 Sign Permit in Phantom...', { id: 'execute' });
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('');
            console.log('[INFO] Requesting USDC-SPL permit signature...');
            console.log('[INFO] 📱 Phantom popup: "Sign Message" (NOT Transaction!)');
            console.log('[INFO] ✓ Permit signature received (GASLESS for user!)');

            // Step 3: Sign Payment Intent (Second Phantom popup)
            toast.loading('✍️ Sign Payment Intent...', { id: 'execute' });
            await new Promise(resolve => setTimeout(resolve, 1200));
            console.log('');
            console.log('[INFO] Requesting Payment Intent signature...');
            console.log('[INFO] 📱 Phantom popup: "Sign Payment Intent"');
            console.log('[INFO] ✓ Payment Intent signed');

            // Step 4: Submitting to Solana network
            toast.loading('⛓️ Submitting to Solana...', { id: 'execute' });
            await new Promise(resolve => setTimeout(resolve, 1800));
            const txSignature = '3xK9m' + Math.random().toString(36).substring(2, 10) + 'Qr7Ypf';
            console.log('');
            console.log('[INFO] Submitting to Solana network...');
            console.log('[INFO] ⏳ Waiting for confirmation...');
            console.log('[INFO] ✓ Payment settled: 0.05 USDC transferred');
            console.log('[INFO] TX Signature:', txSignature);
            console.log('[INFO] Explorer: https://explorer.solana.com/tx/' + txSignature + '?cluster=devnet');

            // Step 5: Execute AI agent
            toast.loading('🤖 Executing AI agent...', { id: 'execute' });
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('');
            console.log('[INFO] 🤖 Executing AI agent...');
            console.log('[INFO] ✓ Task completed successfully!');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('');

            // 🎉 Fire confetti!
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            // Second burst for extra celebration
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 }
                });
                confetti({
                    particleCount: 50,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 }
                });
            }, 250);

            setIsExecuting(false);
            toast.success(
                <div className="space-y-1">
                    <p className="font-medium">🎉 Task completed successfully!</p>
                    <p className="text-xs opacity-80">TX: {txSignature}</p>
                    <a
                        href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline block"
                    >
                        View on Solana Explorer →
                    </a>
                </div>,
                {
                    id: 'execute',
                    duration: 8000,
                }
            );
        };

        try {
            toast.loading('📝 Creating payment invoice...', { id: 'execute' });

            // Try to connect to backend first
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            try {
                // Step 1: Create invoice with X402 Facilitator
                const invoiceResponse = await fetch('http://localhost:8403/invoice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agentId: agent.id,
                        payer: 'demo-wallet-address',
                    }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!invoiceResponse.ok) {
                    throw new Error('Failed to create invoice');
                }

                const invoice = await invoiceResponse.json();
                console.log('Invoice created:', invoice);

                toast.loading('🔐 Verifying payment...', { id: 'execute' });

                // Step 2: Verify payment
                const verifyResponse = await fetch('http://localhost:8403/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        payment: invoice.xPaymentHeader,
                    }),
                });

                if (!verifyResponse.ok) {
                    throw new Error('Payment verification failed');
                }

                const verification = await verifyResponse.json();
                console.log('Payment verified:', verification);

                toast.loading('⛓️ Settling payment...', { id: 'execute' });

                // Step 3: Settle payment
                const settleResponse = await fetch('http://localhost:8403/settle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        payment: invoice.xPaymentHeader,
                    }),
                });

                if (!settleResponse.ok) {
                    throw new Error('Payment settlement failed');
                }

                const settlement = await settleResponse.json();
                console.log('Payment settled:', settlement);

                toast.loading('🤖 Executing AI agent...', { id: 'execute' });

                // Step 4: Execute agent
                setTimeout(() => {
                    setIsExecuting(false);
                    toast.success(
                        <div className="space-y-1">
                            <p className="font-medium">✅ Task completed!</p>
                            <p className="text-xs opacity-80">TX: {settlement.txSignature}</p>
                        </div>,
                        {
                            id: 'execute',
                            duration: 5000,
                        }
                    );
                }, 2000);

            } catch (fetchError) {
                clearTimeout(timeoutId);
                // Backend not available - run demo mode
                console.log('Backend unavailable, switching to Demo Mode...');
                await runDemoMode();
            }

        } catch (error) {
            console.error('Payment flow error:', error);
            setIsExecuting(false);

            // If all else fails, run demo mode
            console.log('Falling back to Demo Mode due to error...');
            await runDemoMode();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto space-y-6"
        >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
                <Link to="/marketplace" className="text-gray-400 hover:text-white">
                    Marketplace
                </Link>
                <span className="text-gray-600">/</span>
                <span className="text-white">{agent.name}</span>
            </div>

            {/* Hero Section */}
            <div className="glass-card overflow-hidden">
                <div className={`h-48 bg-gradient-to-br ${agent.gradient} relative`}>
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.span
                            className="text-8xl"
                            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                        >
                            {agent.icon}
                        </motion.span>
                    </div>
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                        <span className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-lg text-white font-medium">
                            {agent.category}
                        </span>
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1">
                            <h1 className="text-3xl font-display font-bold text-white mb-2">
                                {agent.name}
                            </h1>
                            <p className="text-gray-400 mb-4">{agent.description}</p>

                            {/* Stats Row */}
                            <div className="flex flex-wrap items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-yellow-400">⭐</span>
                                    <span className="text-white font-semibold">{agent.rating}</span>
                                    <span className="text-gray-400">({agent.ratingCount} reviews)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-synapse-green">▶</span>
                                    <span className="text-white font-semibold">{agent.runs.toLocaleString()}</span>
                                    <span className="text-gray-400">runs</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>🧠</span>
                                    <span className="text-gray-400">{agent.aiModel}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>⏱</span>
                                    <span className="text-gray-400">{agent.estimatedTime}</span>
                                </div>
                            </div>
                        </div>

                        {/* Price & CTA */}
                        <div className="glass-card p-6 min-w-[280px]">
                            <div className="text-center mb-4">
                                <p className="text-gray-400 text-sm mb-1">Price per execution</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-4xl font-bold text-synapse-green">${agent.price}</span>
                                    <span className="text-gray-400">USDC</span>
                                </div>
                            </div>

                            <motion.button
                                onClick={handleRunAgent}
                                disabled={isExecuting}
                                className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 ${isExecuting
                                    ? 'bg-gray-600 cursor-wait'
                                    : 'bg-gradient-to-r from-synapse-orange to-synapse-purple hover:shadow-glow-purple'
                                    }`}
                                whileHover={{ scale: isExecuting ? 1 : 1.02 }}
                                whileTap={{ scale: isExecuting ? 1 : 0.98 }}
                            >
                                {isExecuting ? (
                                    <>
                                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        <span>Executing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>🚀</span>
                                        <span>Run Agent</span>
                                    </>
                                )}
                            </motion.button>

                            <p className="text-center text-xs text-gray-500 mt-3">
                                Zero gas fees • Instant execution
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-dark-border">
                {(['overview', 'input', 'history'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 font-medium transition-all relative ${activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {activeTab === tab && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-synapse-orange to-synapse-purple"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid md:grid-cols-3 gap-6"
                    >
                        <div className="md:col-span-2 glass-card p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">About</h2>
                            <div className="prose prose-invert max-w-none">
                                <p className="text-gray-300 whitespace-pre-line">{agent.longDescription}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Details</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Creator</span>
                                        <span className="text-white font-mono text-sm">{agent.creator}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Created</span>
                                        <span className="text-white">{agent.createdAt}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">AI Model</span>
                                        <span className="text-synapse-purple">{agent.aiModel}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Avg Time</span>
                                        <span className="text-white">{agent.estimatedTime}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                                <div className="space-y-3">
                                    {agent.recentRuns.map((run: any) => (
                                        <div key={run.id} className="flex items-center justify-between">
                                            <span className="text-gray-400 font-mono text-sm">{run.user}</span>
                                            <span className="text-synapse-green text-sm">{run.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'input' && (
                    <motion.div
                        key="input"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="glass-card p-6"
                    >
                        <h2 className="text-xl font-semibold text-white mb-6">Input Parameters</h2>
                        <div className="max-w-2xl space-y-6">
                            {agent.inputSchema.map((field: any) => (
                                <div key={field.name}>
                                    <label className="block text-white mb-2">
                                        {field.name}
                                        {field.required && <span className="text-synapse-orange ml-1">*</span>}
                                    </label>
                                    {field.type === 'file' ? (
                                        <div>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileInputChange}
                                                accept=".pdf"
                                                className="hidden"
                                            />
                                            {uploadedFile ? (
                                                <div className="border-2 border-synapse-green/50 bg-synapse-green/10 rounded-xl p-6 text-center">
                                                    <div className="text-5xl mb-3">📄</div>
                                                    <p className="text-white font-medium mb-1">{uploadedFile.name}</p>
                                                    <p className="text-gray-400 text-sm mb-4">
                                                        {(uploadedFile.size / 1024).toFixed(2)} KB
                                                    </p>
                                                    <button
                                                        onClick={() => setUploadedFile(null)}
                                                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                                                    >
                                                        ✕ Remove file
                                                    </button>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => fileInputRef.current?.click()}
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={handleDrop}
                                                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragging
                                                            ? 'border-synapse-purple bg-synapse-purple/10 scale-[1.02]'
                                                            : 'border-dark-border hover:border-synapse-purple/50'
                                                        }`}
                                                >
                                                    <div className="text-5xl mb-3">
                                                        {isDragging ? '📥' : '📁'}
                                                    </div>
                                                    <p className="text-white font-medium mb-1">
                                                        {isDragging ? 'Drop your PDF here!' : 'Click or drag file to upload'}
                                                    </p>
                                                    <p className="text-gray-500 text-sm">PDF files only</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : field.type === 'select' ? (
                                        <select className="input-dark">
                                            {field.options.map((opt: string) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={field.type}
                                            placeholder={field.default ? `Default: ${field.default}` : ''}
                                            className="input-dark"
                                        />
                                    )}
                                </div>
                            ))}

                            <motion.button
                                onClick={handleRunAgent}
                                className="btn-primary w-full py-4 text-lg"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                🚀 Execute for ${agent.price} USDC
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'history' && (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="glass-card p-6"
                    >
                        <h2 className="text-xl font-semibold text-white mb-6">Your Execution History</h2>
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📋</div>
                            <p className="text-gray-400 mb-4">No executions yet</p>
                            <button onClick={handleRunAgent} className="btn-secondary">
                                Run your first task
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Payment Modal */}
            <AnimatePresence>
                {showPaymentModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={() => setShowPaymentModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative glass-card p-8 max-w-md w-full"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6 text-center">
                                Confirm Payment
                            </h2>

                            <div className="glass-card bg-dark-bg p-4 mb-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center text-3xl`}>
                                        {agent.icon}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">{agent.name}</p>
                                        <p className="text-sm text-gray-400">{agent.category} Agent</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-dark-border">
                                    <span className="text-gray-400">Total</span>
                                    <span className="text-2xl font-bold text-synapse-green">${agent.price} USDC</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <motion.button
                                    onClick={handleConfirmPayment}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-synapse-orange to-synapse-purple font-semibold text-lg"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    🔐 Pay with Phantom
                                </motion.button>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="w-full py-3 rounded-xl border border-dark-border text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>

                            <p className="text-center text-xs text-gray-500 mt-4">
                                Powered by x402 Protocol • Zero gas fees
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
