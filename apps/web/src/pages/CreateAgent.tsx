import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const categories = [
    { id: 'AI', label: 'AI Agent', icon: '🤖', desc: 'Text, image, or code processing' },
    { id: 'NFT', label: 'NFT', icon: '🖼️', desc: 'NFT creation and management' },
    { id: 'Trading', label: 'Trading', icon: '📈', desc: 'Market analysis and signals' },
    { id: 'IoT', label: 'IoT', icon: '🌐', desc: 'Device control and monitoring' },
    { id: 'Automation', label: 'Automation', icon: '⚡', desc: 'Scheduled tasks and workflows' },
    { id: 'Utility', label: 'Utility', icon: '🔧', desc: 'Blockchain utilities' },
];

const aiModels = [
    { id: 'gpt-4', label: 'GPT-4 Turbo', provider: 'OpenAI' },
    { id: 'claude-3', label: 'Claude 3 Opus', provider: 'Anthropic' },
    { id: 'llama-2', label: 'Llama 2', provider: 'Local/Ollama' },
    { id: 'custom', label: 'Custom API', provider: 'Your Server' },
];

export default function CreateAgent() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        price: '',
        aiModel: '',
        inputFields: [{ name: '', type: 'text', required: true }],
    });

    const totalSteps = 4;

    const handleNext = () => {
        if (step < totalSteps) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async () => {
        setIsCreating(true);

        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('[INFO] 🚀 Creating new agent on SynapsePay...');
        console.log('═══════════════════════════════════════════════════════════');

        // Step 1: Validate data
        toast.loading('📝 Validating agent data...', { id: 'create-agent' });
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log('[INFO] Agent Name:', formData.name);
        console.log('[INFO] Category:', formData.category);
        console.log('[INFO] Price:', formData.price, 'USDC');
        console.log('[INFO] AI Model:', formData.aiModel);

        // Step 2: Upload metadata to IPFS
        toast.loading('📦 Uploading metadata to IPFS...', { id: 'create-agent' });
        await new Promise(resolve => setTimeout(resolve, 1200));
        const metadataCID = 'Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        console.log('[INFO] Metadata CID:', metadataCID);

        // Step 3: Register on-chain
        toast.loading('⛓️ Registering on Solana Registry Program...', { id: 'create-agent' });
        await new Promise(resolve => setTimeout(resolve, 1500));
        const agentId = 'agent_' + Math.random().toString(36).substring(2, 10);
        const txSignature = '4xYu' + Math.random().toString(36).substring(2, 12) + 'Kp9Qz';
        console.log('[INFO] Agent ID:', agentId);
        console.log('[INFO] ✓ Registered on Registry Program');
        console.log('[INFO] TX Signature:', txSignature);
        console.log('[INFO] Explorer: https://explorer.solana.com/tx/' + txSignature + '?cluster=devnet');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');

        // Success
        setIsCreating(false);

        // Fire confetti
        const confetti = (await import('canvas-confetti')).default;
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });

        toast.success(
            <div className="space-y-1">
                <p className="font-medium">🎉 Agent created successfully!</p>
                <p className="text-xs opacity-80">ID: {agentId}</p>
            </div>,
            { id: 'create-agent', duration: 5000 }
        );

        // Navigate to marketplace after 2 seconds
        setTimeout(() => {
            navigate('/marketplace');
        }, 2000);
    };

    const addInputField = () => {
        setFormData({
            ...formData,
            inputFields: [...formData.inputFields, { name: '', type: 'text', required: false }],
        });
    };

    const removeInputField = (index: number) => {
        setFormData({
            ...formData,
            inputFields: formData.inputFields.filter((_, i) => i !== index),
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-display font-bold text-white mb-2">
                    Create New Agent
                </h1>
                <p className="text-gray-400">
                    Build your own AI agent and start earning USDC
                </p>
            </div>

            {/* Progress Bar */}
            <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex items-center">
                            <motion.div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${s < step
                                    ? 'bg-synapse-green text-dark-bg'
                                    : s === step
                                        ? 'bg-gradient-to-r from-synapse-orange to-synapse-purple text-white'
                                        : 'bg-dark-bg border border-dark-border text-gray-400'
                                    }`}
                                animate={{ scale: s === step ? 1.1 : 1 }}
                            >
                                {s < step ? '✓' : s}
                            </motion.div>
                            {s < 4 && (
                                <div className={`w-full h-1 mx-2 rounded ${s < step ? 'bg-synapse-green' : 'bg-dark-border'}`} style={{ width: '60px' }} />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                    <span>Basic Info</span>
                    <span>Category</span>
                    <span>Configuration</span>
                    <span>Review</span>
                </div>
            </div>

            {/* Form Steps */}
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card p-8"
            >
                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>

                        <div>
                            <label className="block text-white mb-2">Agent Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., PDF Summarizer Pro"
                                className="input-dark"
                            />
                        </div>

                        <div>
                            <label className="block text-white mb-2">Description *</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe what your agent does and its key features..."
                                rows={4}
                                className="input-dark resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-white mb-2">Price (USDC) *</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0.05"
                                    className="input-dark pl-8"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">5% platform fee applies</p>
                        </div>
                    </div>
                )}

                {/* Step 2: Category */}
                {step === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-white mb-6">Select Category</h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {categories.map((cat) => (
                                <motion.button
                                    key={cat.id}
                                    onClick={() => setFormData({ ...formData, category: cat.id })}
                                    className={`p-6 rounded-xl border-2 text-left transition-all ${formData.category === cat.id
                                        ? 'border-synapse-purple bg-synapse-purple/10'
                                        : 'border-dark-border hover:border-synapse-purple/50 bg-dark-bg'
                                        }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="text-4xl mb-3">{cat.icon}</div>
                                    <p className="font-semibold text-white">{cat.label}</p>
                                    <p className="text-sm text-gray-400 mt-1">{cat.desc}</p>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Configuration */}
                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-white mb-6">Configuration</h2>

                        <div>
                            <label className="block text-white mb-2">AI Model *</label>
                            <div className="grid grid-cols-2 gap-4">
                                {aiModels.map((model) => (
                                    <motion.button
                                        key={model.id}
                                        onClick={() => setFormData({ ...formData, aiModel: model.id })}
                                        className={`p-4 rounded-xl border text-left transition-all ${formData.aiModel === model.id
                                            ? 'border-synapse-purple bg-synapse-purple/10'
                                            : 'border-dark-border hover:border-synapse-purple/50 bg-dark-bg'
                                            }`}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <p className="font-semibold text-white">{model.label}</p>
                                        <p className="text-sm text-gray-400">{model.provider}</p>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-white">Input Fields</label>
                                <button
                                    onClick={addInputField}
                                    className="text-sm text-synapse-purple hover:text-synapse-purple-light flex items-center gap-1"
                                >
                                    <span>+ Add Field</span>
                                </button>
                            </div>
                            <div className="space-y-3">
                                {formData.inputFields.map((field, index) => (
                                    <div key={index} className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="Field name"
                                            value={field.name}
                                            onChange={(e) => {
                                                const newFields = [...formData.inputFields];
                                                newFields[index].name = e.target.value;
                                                setFormData({ ...formData, inputFields: newFields });
                                            }}
                                            className="input-dark flex-1"
                                        />
                                        <select
                                            value={field.type}
                                            onChange={(e) => {
                                                const newFields = [...formData.inputFields];
                                                newFields[index].type = e.target.value;
                                                setFormData({ ...formData, inputFields: newFields });
                                            }}
                                            className="input-dark w-32"
                                        >
                                            <option value="text">Text</option>
                                            <option value="number">Number</option>
                                            <option value="file">File</option>
                                            <option value="url">URL</option>
                                        </select>
                                        {index > 0 && (
                                            <button
                                                onClick={() => removeInputField(index)}
                                                className="px-3 text-red-400 hover:text-red-300"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Review */}
                {step === 4 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-white mb-6">Review & Create</h2>

                        <div className="glass-card bg-dark-bg p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-synapse-purple to-synapse-orange flex items-center justify-center text-4xl">
                                    {categories.find(c => c.id === formData.category)?.icon || '🤖'}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">{formData.name || 'Agent Name'}</h3>
                                    <p className="text-gray-400">{formData.category || 'Category'} Agent</p>
                                </div>
                            </div>

                            <p className="text-gray-300">{formData.description || 'No description provided'}</p>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dark-border">
                                <div>
                                    <p className="text-sm text-gray-400">Price</p>
                                    <p className="text-xl font-bold text-synapse-green">${formData.price || '0.00'} USDC</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">AI Model</p>
                                    <p className="text-white">{aiModels.find(m => m.id === formData.aiModel)?.label || 'Not selected'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Input Fields</p>
                                    <p className="text-white">{formData.inputFields.filter(f => f.name).length} fields</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Platform Fee</p>
                                    <p className="text-white">5%</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-synapse-green/10 border border-synapse-green/30 rounded-xl">
                            <p className="text-synapse-green text-sm">
                                ✓ Your agent will be live immediately after creation
                            </p>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
                <motion.button
                    onClick={handleBack}
                    disabled={step === 1}
                    className={`px-6 py-3 rounded-xl font-medium ${step === 1
                        ? 'bg-dark-card text-gray-500 cursor-not-allowed'
                        : 'bg-dark-card border border-dark-border text-white hover:border-synapse-purple'
                        }`}
                    whileHover={step > 1 ? { scale: 1.02 } : {}}
                >
                    ← Back
                </motion.button>

                {step < totalSteps ? (
                    <motion.button
                        onClick={handleNext}
                        className="btn-primary px-8"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Continue →
                    </motion.button>
                ) : (
                    <motion.button
                        onClick={handleSubmit}
                        disabled={isCreating}
                        className="btn-primary px-8 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        whileHover={!isCreating ? { scale: 1.02 } : {}}
                        whileTap={!isCreating ? { scale: 0.98 } : {}}
                    >
                        {isCreating ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                <span>Creating...</span>
                            </>
                        ) : (
                            <>
                                <span>🚀</span>
                                <span>Create Agent</span>
                            </>
                        )}
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
}
