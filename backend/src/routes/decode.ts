import { Router } from 'express';
import { decode } from '../algorithms';
import { asText, messageOf } from '../utils/http';

/**
 * POST /decode  (application/json: { pgn: string })
 * Returns { base64, text, byteLength, checksumOk } where `text` is the UTF-8
 * interpretation when the bytes are printable, else null.
 */
export const decodeRouter = Router();

decodeRouter.post('/decode', (req, res) => {
  try {
    const pgn = typeof req.body?.pgn === 'string' ? req.body.pgn : '';
    if (!pgn.trim()) {
      return res.status(400).json({ error: 'No PGN provided' });
    }
    const result = decode(pgn);
    res.json({
      base64: Buffer.from(result.data).toString('base64'),
      text: asText(result.data),
      byteLength: result.data.length,
      checksumOk: result.checksumOk,
    });
  } catch (err) {
    res.status(400).json({ error: messageOf(err) });
  }
});
