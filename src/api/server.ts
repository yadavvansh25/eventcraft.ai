import express, { Express } from 'express';
import path from 'path';
import { createEventCraftRouter } from './routes';

export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: '2mb' }));

  // Microservice API Routes
  const router = createEventCraftRouter();
  app.use('/api', router);
  app.use('/health', (_req, res) => res.redirect('/api/health'));

  // Static files for Demonstrator Web UI
  const clientDir = path.join(__dirname, '../client');
  app.use(express.static(clientDir));

  // Fallback to client index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      next();
      return;
    }
    res.sendFile(path.join(clientDir, 'index.html'), (err) => {
      if (err) next();
    });
  });

  return app;
}

export function startServer(initialPort: number = 3000): void {
  const app = createApp();
  let currentPort = initialPort;

  const tryListen = (port: number): void => {
    const server = app.listen(port);

    server.on('listening', () => {
      console.log(`\n=============================================================`);
      console.log(`⚡ [EventCraft AI] Autonomous Engine & UI Active!`);
      console.log(`👉 Web Demonstrator: http://localhost:${port}/`);
      console.log(`👉 API Health Check:  http://localhost:${port}/api/health`);
      console.log(`=============================================================\n`);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[EventCraft AI] Port ${port} is currently occupied, trying port ${port + 1}...`);
        currentPort = port + 1;
        tryListen(currentPort);
      } else {
        console.error('[EventCraft AI] Failed to start server:', err);
      }
    });
  };

  tryListen(currentPort);
}

// Auto-run if executed directly
if (require.main === module) {
  const port = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3000;
  startServer(port);
}
