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
    Object.assign(req.query, req.params);
    balanceHandler(req, res).catch(next);
  });

  // Expenses API
  app.get('/api/expenses', expensesIndexHandler);
  app.post('/api/expenses', expensesIndexHandler);

  app.patch('/api/expenses/:id', (req, res, next) => {
    Object.assign(req.query, req.params);
    expensesIdHandler(req, res).catch(next);
  });
  app.delete('/api/expenses/:id', (req, res, next) => {
    Object.assign(req.query, req.params);
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
