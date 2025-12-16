-- ═══════════════════════════════════════════════════════════════
-- 🚀 SYNAPSEPAY DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════
-- AGENTS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price BIGINT NOT NULL, -- in USDC base units (6 decimals)
    price_display TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('AI', 'IoT', 'Automation', 'Utility', 'Trading', 'NFT')),
    icon TEXT DEFAULT '🤖',
    owner_wallet TEXT NOT NULL,
    ai_model TEXT CHECK (ai_model IN ('gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'llama-3', 'custom', NULL)),
    ai_prompt TEXT,
    api_endpoint TEXT,
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_runs INTEGER DEFAULT 0,
    total_earnings BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    duration INTEGER, -- For IoT devices (seconds)
    input_schema JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_agents_category ON agents(category);
CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_agents_active ON agents(is_active);

-- ═══════════════════════════════════════════════════════════════
-- PAYMENTS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    payer_wallet TEXT NOT NULL,
    recipient_wallet TEXT NOT NULL,
    amount BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    tx_signature TEXT,
    slot BIGINT,
    network TEXT DEFAULT 'devnet' CHECK (network IN ('devnet', 'mainnet-beta')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments(payer_wallet);
CREATE INDEX IF NOT EXISTS idx_payments_recipient ON payments(recipient_wallet);
CREATE INDEX IF NOT EXISTS idx_payments_agent ON payments(agent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_tx ON payments(tx_signature);

-- ═══════════════════════════════════════════════════════════════
-- EXECUTIONS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS executions (
    id TEXT PRIMARY KEY,
    payment_id TEXT REFERENCES payments(id) ON DELETE SET NULL,
    agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    input_data JSONB,
    output_data JSONB,
    result_cid TEXT, -- IPFS CID
    execution_time_ms INTEGER,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_executions_payment ON executions(payment_id);
CREATE INDEX IF NOT EXISTS idx_executions_agent ON executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);

-- ═══════════════════════════════════════════════════════════════
-- USER STATS TABLE (Optional)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_stats (
    wallet_address TEXT PRIMARY KEY,
    total_spent BIGINT DEFAULT 0,
    total_executions INTEGER DEFAULT 0,
    favorite_agents TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Function to increment agent earnings atomically
CREATE OR REPLACE FUNCTION increment_agent_earnings(agent_id TEXT, earning_amount BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE agents 
    SET total_earnings = total_earnings + earning_amount,
        updated_at = NOW()
    WHERE id = agent_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment agent runs atomically
CREATE OR REPLACE FUNCTION increment_agent_runs(agent_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE agents 
    SET total_runs = total_runs + 1,
        updated_at = NOW()
    WHERE id = agent_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update agent rating
CREATE OR REPLACE FUNCTION update_agent_rating(agent_id TEXT, new_rating DECIMAL)
RETURNS VOID AS $$
DECLARE
    current_agent RECORD;
    new_avg DECIMAL;
BEGIN
    SELECT rating, total_runs INTO current_agent FROM agents WHERE id = agent_id;
    
    IF current_agent.total_runs > 0 THEN
        new_avg := (current_agent.rating * current_agent.total_runs + new_rating) / (current_agent.total_runs + 1);
    ELSE
        new_avg := new_rating;
    END IF;
    
    UPDATE agents 
    SET rating = ROUND(new_avg::numeric, 2),
        updated_at = NOW()
    WHERE id = agent_id;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (Optional but recommended)
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;

-- Policies for public read access
CREATE POLICY "Agents are viewable by everyone" ON agents
    FOR SELECT USING (is_active = true);

CREATE POLICY "Completed payments are viewable by participants" ON payments
    FOR SELECT USING (true); -- Adjust based on your needs

CREATE POLICY "Executions are viewable by payer" ON executions
    FOR SELECT USING (true); -- Adjust based on your needs

-- Policies for service role (backend) - full access
CREATE POLICY "Service role can do anything on agents" ON agents
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do anything on payments" ON payments
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do anything on executions" ON executions
    FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
