import { Router } from 'express';
import { encode } from '../algorithms/index.js';
import { config } from '../config.js';
import { readInput, messageOf } from '../utils/http.js';

/**
 * POST /encode
 *   - application/octet-stream: raw file bytes
 *   - application/json: { text: string }
 * Returns { pgn, byteLength, gameCount, checksum }.
 */
export const encodeRouter = Router();

encodeRouter.post('/encode', (req, res) => {
  try {
    const data = readInput(req);
    if (data.length === 0) {
      return res.status(400).json({ error: 'No input provided' });
    }
    if (data.length > config.maxBytes) {
      return res.status(413).json({ error: `Input exceeds ${config.maxBytes} byte limit` });
    }
    const result = encode(data);
    res.json({
      pgn: result.pgn,
      byteLength: result.byteLength,
      gameCount: result.gameCount,
      checksum: result.checksum,
    });
  } catch (err) {
    res.status(400).json({ error: messageOf(err) });
  }
});
