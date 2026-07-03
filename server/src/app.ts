import cors from 'cors';
import express from 'express';
import { CLIENT_ORIGIN } from './config';

export function createApp(): express.Application {
  const app = express();

  app.use(
    cors({
      origin: CLIENT_ORIGIN,
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}
