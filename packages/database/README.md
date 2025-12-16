# 💾 SynapsePay Database Package

This package provides Supabase integration for persistent data storage.

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (choose a region close to your users)
3. Wait for the project to be ready (~2 minutes)

### 2. Get Your Credentials

From your Supabase Dashboard:
1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY` (for backend only!)

### 3. Create Database Tables

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy and paste the contents of `schema.sql`
4. Click **Run**
5. Click **New query** again
6. Copy and paste the contents of `seed.sql`
7. Click **Run**

### 4. Configure Environment Variables

Add to your `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Frontend (with VITE_ prefix)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `agents` | AI agents and IoT devices available for rent |
| `payments` | Payment transaction records |
| `executions` | Agent execution history and results |
| `user_stats` | User statistics and preferences |

### Entity Relationship

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   agents    │───┬───│  payments   │───────│ executions  │
└─────────────┘   │   └─────────────┘       └─────────────┘
                  │
                  └── One agent can have many payments
                      Each payment has one execution
```

## 🔧 Usage

### In Backend (Node.js/Bun)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // Use service key for full access
);

// Fetch agents
const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('is_active', true);

// Create payment
const { data: payment } = await supabase
    .from('payments')
    .insert({
        id: 'pay_123',
        agent_id: 'pdf-summarizer-v1',
        payer_wallet: 'ABC...',
        recipient_wallet: 'XYZ...',
        amount: 50000,
        status: 'pending'
    })
    .select()
    .single();
```

### In Frontend (React)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY // Use anon key for frontend
);

// Fetch agents (public data, allowed by RLS)
const { data: agents } = await supabase
    .from('agents')
    .select('id, name, description, price, category')
    .eq('is_active', true);
```

## 🔒 Row Level Security (RLS)

The schema includes RLS policies:

- **Agents**: Public read access for active agents
- **Payments**: Read access for transaction participants
- **Executions**: Read access for payer

Service role key bypasses RLS for backend operations.

## 📦 Package Exports

```typescript
// Client
export { createClient, getClient } from './client';

// Services
export { AgentService } from './services/agents';
export { PaymentService } from './services/payments';
export { ExecutionService } from './services/executions';

// Types
export type { Agent, Payment, Execution, ... } from './types';
```

## ⚠️ Important Notes

1. **Never expose `SUPABASE_SERVICE_KEY` in frontend code!**
2. Use `SUPABASE_ANON_KEY` for frontend - it respects RLS
3. Use `SUPABASE_SERVICE_KEY` for backend - full database access
4. Always test RLS policies before going to production

## 🆘 Troubleshooting

### "relation does not exist" error
Run `schema.sql` in the SQL Editor first.

### "permission denied" error
Check your RLS policies or use service_role key.

### Empty agents list
Run `seed.sql` to populate initial agents.
