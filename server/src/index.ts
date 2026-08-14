import http from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { env } from './config/env';
import { initFileDb } from './db/fileStore';
import { setupSocket } from './realtime/socket';
import { startCompletedCleanup } from './services/cleanupCompleted';

async function main() {
  initFileDb();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.clientOrigin,
      methods: ['GET', 'POST'],
    },
  });
  app.set('io', io);
  setupSocket(io);
  startCompletedCleanup(io);

  server.listen(env.port, () => {
    console.log(`[server] listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error('[server] failed to start', err);
  process.exit(1);
});
