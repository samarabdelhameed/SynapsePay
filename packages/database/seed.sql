-- ═══════════════════════════════════════════════════════════════
-- 🌱 SYNAPSEPAY SEED DATA
-- ═══════════════════════════════════════════════════════════════
-- Run this after schema.sql to populate initial agents

-- Platform owner wallet (update with your real wallet)
-- This is a devnet test wallet - replace with actual owner wallet
SET session my.platform_wallet = '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby';

-- ═══════════════════════════════════════════════════════════════
-- SEED AGENTS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO agents (id, name, description, price, price_display, category, icon, owner_wallet, ai_model, ai_prompt, rating, total_runs) VALUES
-- AI Agents
(
    'pdf-summarizer-v1',
    'PDF Summarizer',
    'AI-powered PDF summary extraction with key points and insights. Supports documents up to 50 pages.',
    50000,
    '0.05 USDC',
    'AI',
    '📄',
    '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby',
    'gpt-4-turbo',
    'You are a professional document analyst. Given a PDF document, provide:
1. A concise summary (2-3 paragraphs)
2. Key points as bullet points
3. Main topics covered
4. Word count estimate
5. Estimated reading time

Be thorough but concise. Focus on the most important information.',
    4.8,
    1250
),
(
    'code-debugger-v1',
    'Code Debugger',
    'AI-powered code analysis and bug detection. Supports Python, JavaScript, TypeScript, Rust, and more.',
    80000,
    '0.08 USDC',
    'AI',
    '🐛',
    '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby',
    'claude-3-sonnet',
    'You are an expert software engineer and code reviewer. Analyze the provided code and:
1. Identify bugs or potential issues
2. Rate severity (low, medium, high, critical)
3. Suggest fixes with code examples
4. Provide best practice recommendations
5. Give an overall code quality grade (A-F)

Be specific and actionable in your feedback.',
    4.7,
    520
),
(
    'image-editor-v1',
    'Smart Image Editor',
    'AI-powered image editing: background removal, enhancement, resizing, and style filters.',
    100000,
    '0.10 USDC',
    'AI',
    '🎨',
    '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby',
    'gpt-4',
    'Process the image according to the user request. Available operations:
- remove_background: Remove background from image
- enhance: Improve image quality and clarity
- resize: Resize to specified dimensions
- style: Apply artistic style filters

Return the processed image URL.',
    4.6,
    890
),
(
    'text-translator-v1',
    'Universal Translator',
    'Translate text between 100+ languages with AI-powered context understanding.',
    30000,
    '0.03 USDC',
    'AI',
    '🌍',
    '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby',
    'gpt-4-turbo',
    'You are a professional translator. Translate the provided text accurately while:
1. Preserving the original meaning and tone
2. Adapting idioms appropriately
3. Maintaining formatting
4. Handling technical terms correctly

Provide the translation and any relevant notes about cultural context.',
    4.9,
    2100
),
(
    'content-writer-v1',
    'AI Content Writer',
    'Generate high-quality blog posts, articles, and marketing copy.',
    150000,
    '0.15 USDC',
    'AI',
    '✍️',
    '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby',
    'claude-3-opus',
    'You are a professional content writer. Create engaging, well-researched content based on the provided topic or brief. Include:
1. Compelling headline
2. Engaging introduction
3. Well-structured body with subheadings
4. Clear conclusion with call-to-action
5. SEO-friendly structure

Maintain the specified tone and target audience throughout.',
    4.5,
    340
),

-- NFT Agents
(
    'nft-minter-v1',
    'NFT Minter',
    'Generate AI art and mint as NFT on Solana. Includes metadata and Arweave storage.',
    250000,
    '0.25 USDC',
    'NFT',
    '🖼️',
    '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby',
    'gpt-4',
    'Generate unique digital art based on the provided prompt, then mint as NFT on Solana.',
    4.9,
    650
),
(
    'nft-analyzer-v1',
    'NFT Price Analyzer',
    'Analyze NFT collections and predict fair market value using AI.',
    100000,
    '0.10 USDC',
    'NFT',
    '📊',
    '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby',
    'gpt-4-turbo',
    'Analyze the provided NFT collection data and provide:
1. Current floor price analysis
2. Volume trends
3. Rarity scoring
4. Price prediction (short/medium term)
5. Buy/sell recommendation

Use market data and historical trends for analysis.',
    4.3,
    180
),

-- IoT Devices
(
    'ugv-rover-01',
    'UGV Rover 01',
    'Control a physical robot with live camera feed. Navigate, explore, and capture images.',
    100000,
    '0.10 USDC',
    'IoT',
    '🤖',
    '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby',
    NULL,
    NULL,
    4.7,
    320
),
(
    'smart-led-array',
    'Smart LED Array',
    'Control RGB LED matrix display remotely. Create patterns, display text, and animations.',
    50000,
    '0.05 USDC',
    'IoT',
    '💡',
    '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby',
    NULL,
    NULL,
    4.5,
    180
),
(
    'weather-station-01',
    'Weather Station Pro',
    'Access real-time weather data: temperature, humidity, pressure, wind speed.',
    20000,
    '0.02 USDC',
    'IoT',
    '🌤️',
    '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby',
    NULL,
    NULL,
    4.8,
    560
),

-- Automation Agents  
(
    'social-scheduler-v1',
    'Social Media Scheduler',
    'AI-powered scheduling and content optimization for Twitter, LinkedIn, and more.',
    80000,
    '0.08 USDC',
    'Automation',
    '📱',
    '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby',
    'gpt-4-turbo',
    'Optimize and schedule social media posts. Analyze best posting times and suggest hashtags.',
    4.4,
    420
),
(
    'email-responder-v1',
    'Smart Email Responder',
    'AI-powered email drafting and response automation.',
    60000,
    '0.06 USDC',
    'Automation',
    '📧',
    '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby',
    'claude-3-sonnet',
    'Draft professional email responses based on the incoming email and context provided.',
    4.6,
    280
),

-- Trading Agents
(
    'dex-aggregator-v1',
    'DEX Price Aggregator',
    'Find best swap rates across Solana DEXs: Jupiter, Raydium, Orca.',
    40000,
    '0.04 USDC',
    'Trading',
    '💹',
    '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby',
    NULL,
    NULL,
    4.7,
    1500
),
(
    'token-analyzer-v1',
    'Token Analyzer',
    'Comprehensive token analysis: holders, liquidity, contract verification, risk score.',
    120000,
    '0.12 USDC',
    'Trading',
    '🔍',
    '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby',
    'gpt-4-turbo',
    'Analyze the provided token address and provide:
1. Token overview and metadata
2. Holder distribution analysis
3. Liquidity depth
4. Contract verification status
5. Risk assessment score (1-100)
6. Red flags if any',
    4.5,
    890
),

-- Utility Agents
(
    'qr-generator-v1',
    'QR Code Generator',
    'Generate custom QR codes with logo and styling options.',
    10000,
    '0.01 USDC',
    'Utility',
    '📱',
    '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby',
    NULL,
    NULL,
    4.9,
    3200
),
(
    'link-shortener-v1',
    'Smart Link Shortener',
    'Shorten URLs with analytics tracking and custom aliases.',
    5000,
    '0.005 USDC',
    'Utility',
    '🔗',
    '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby',
    NULL,
    NULL,
    4.8,
    5600
)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    price_display = EXCLUDED.price_display,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    ai_model = EXCLUDED.ai_model,
    ai_prompt = EXCLUDED.ai_prompt,
    updated_at = NOW();

-- ═══════════════════════════════════════════════════════════════
-- VERIFY SEED
-- ═══════════════════════════════════════════════════════════════
SELECT 
    category,
    COUNT(*) as count,
    SUM(total_runs) as total_runs
FROM agents 
GROUP BY category
ORDER BY count DESC;
