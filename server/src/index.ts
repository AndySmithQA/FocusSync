import { createServer } from 'http';
import { createApp } from './app';
import { PORT } from './config';
import { createWebSocketServer } from './ws/server';

const app = createApp();
const server = createServer(app);

createWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`FocusSync server listening on http://localhost:${PORT}`);
});
