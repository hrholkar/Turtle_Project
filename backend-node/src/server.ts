import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

async function bootstrap() {
  const app = express();

  // ── Middleware ──────────────────────────────────────────────────────────────
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── Static file serving for uploaded images ─────────────────────────────────
  app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));
  app.use('/uploads/dataset/images', express.static(path.resolve(process.cwd(), '../dataset/turtles-data/data/images')));

  // ── API Routes ──────────────────────────────────────────────────────────────
  app.use('/api', apiRoutes);

  // ── Error Handling ──────────────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  // ── Database ────────────────────────────────────────────────────────────────
  await connectDatabase();

  // ── Start Server ────────────────────────────────────────────────────────────
  app.listen(env.PORT, () => {
    console.log('');
    console.log('  ╔════════════════════════════════════════╗');
    console.log('  ║        TurtleTrack API Server          ║');
    console.log('  ╠════════════════════════════════════════╣');
    console.log(`  ║  Port    : ${env.PORT}                          ║`);
    console.log(`  ║  Env     : ${env.NODE_ENV}                 ║`);
    console.log(`  ║  MongoDB : ${env.MONGO_URI.substring(0, 30)}... ║`);
    console.log('  ╚════════════════════════════════════════╝');
    console.log('');
  });

  // ── Graceful Shutdown ───────────────────────────────────────────────────────
  const signals = ['SIGTERM', 'SIGINT'] as const;
  for (const signal of signals) {
    process.on(signal, () => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      process.exit(0);
    });
  }
}

bootstrap().catch((err) => {
  console.error('[Bootstrap] Fatal error:', err);
  process.exit(1);
});
