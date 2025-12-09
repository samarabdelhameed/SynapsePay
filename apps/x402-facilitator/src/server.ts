import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { invoiceRoutes } from './routes/invoice';
import { verifyRoutes } from './routes/verify';
import { settleRoutes } from './routes/settle';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
    origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
}));

// Health check
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        service: 'x402-facilitator',
        timestamp: new Date().toISOString(),
    });
});

// Routes
app.route('/invoice', invoiceRoutes);
app.route('/verify', verifyRoutes);
app.route('/settle', settleRoutes);

// 404 handler
app.notFound((c) => {
    return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
    console.error('Error:', err);
    return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

const port = parseInt(process.env.FACILITATOR_PORT || '8403');

console.log(`🚀 X402 Facilitator starting on port ${port}...`);

export default {
    port,
    fetch: app.fetch,
};
