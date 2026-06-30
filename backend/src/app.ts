import express from 'express';
import cors from 'cors';
import { config } from './config';
import { encodeRouter } from './routes/encode';
import { decodeRouter } from './routes/decode';

/** Builds the Express app without starting a listener (handy for tests). */
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: config.bodyLimit }));
  // Accept raw file uploads on the encode endpoint.
  app.use(express.raw({ type: 'application/octet-stream', limit: config.bodyLimit }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use(encodeRouter);
  app.use(decodeRouter);

  return app;
}
