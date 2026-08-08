import dotenv from 'dotenv';
dotenv.config();

import express from 'express';

async function startServer() {
  // Dynamically import handlers so dotenv.config() runs first
  const { default: healthHandler } = await import('./api/health.ts');
  const { default: usersHandler } = await import('./api/users.ts');
  const { default: balanceHandler } = await import('./api/users/[id]/balance.ts');
  const { default: expensesIndexHandler } = await import('./api/expenses/index.ts');
  const { default: expensesIdHandler } = await import('./api/expenses/[id].ts');
  const { default: queryHandler } = await import('./api/query.ts');

  const app = express();
  app.use(express.json());

  // CORS middleware — locked to allowed domains
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'https://trackex.vercel.app',
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean);

    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      res.header('Access-Control-Allow-Origin', 'https://trackex.vercel.app');
    }

    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-user-id, x-token');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Logger middleware
  app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
  });

  // Health check
  app.get('/api/health', healthHandler);

  // Users API
  app.post('/api/users', usersHandler);
  app.patch('/api/users/:id/balance', (req, res, next) => {
    for (const k in req.params) { req.query[k] = req.params[k]; }
    balanceHandler(req, res).catch(next);
  });

  // Expenses API
  app.get('/api/expenses', expensesIndexHandler);
  app.post('/api/expenses', expensesIndexHandler);

  app.patch('/api/expenses/:id', (req, res, next) => {
    for (const k in req.params) { req.query[k] = req.params[k]; }
    expensesIdHandler(req, res).catch(next);
  });
  app.delete('/api/expenses/:id', (req, res, next) => {
    for (const k in req.params) { req.query[k] = req.params[k]; }
    expensesIdHandler(req, res).catch(next);
  });

  // NL Query API
  app.post('/api/query', queryHandler);

  // Error Handler
  app.use((err, req, res, next) => {
    console.error('[API Error]', err);
    res.status(500).json({ error: err.message ?? 'Internal Server Error' });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 API Local Dev Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start local API server:', err);
});
