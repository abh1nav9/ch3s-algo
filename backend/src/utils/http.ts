import type { Request } from 'express';

/** Extracts encode input from either a raw body or a JSON `{ text }` payload. */
export function readInput(req: Request): Uint8Array {
  if (Buffer.isBuffer(req.body)) return new Uint8Array(req.body);
  if (req.body && typeof req.body.text === 'string') {
    return new TextEncoder().encode(req.body.text);
  }
  return new Uint8Array(0);
}

/** Returns decoded bytes as a string only when they are printable UTF-8 text. */
export function asText(data: Uint8Array): string | null {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(data);
    return /^[\x09\x0A\x0D\x20-\x7E -￿]*$/.test(text) ? text : null;
  } catch {
    return null;
  }
}

/** Normalizes any thrown value into a string message. */
export function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
