import { Chess, type Move } from 'chess.js';

/**
 * Converts a number to a fixed-width binary string, padding with leading zeros.
 */
export function toBinaryString(num: number, bits: number): string {
  return num.toString(2).padStart(bits, '0');
}

/**
 * FNV-1a 32-bit checksum, returned as 8 hex chars. Used to verify round-trips.
 */
export function calculateChecksum(buffer: Uint8Array): string {
  let hash = 2166136261;
  const fnvPrime = 16777619;
  for (let i = 0; i < buffer.length; i++) {
    hash ^= buffer[i];
    hash = Math.imul(hash, fnvPrime);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Returns the legal moves in the current position in a single, deterministic
 * order shared by the encoder and decoder. Sorting by UCI string guarantees
 * both sides agree on which move maps to which index — this symmetry is what
 * makes the codec lossless.
 */
export function orderedLegalMoves(board: Chess): Move[] {
  return board
    .moves({ verbose: true })
    .sort((a, b) => uci(a).localeCompare(uci(b)));
}

/** UCI representation of a move, e.g. "e2e4" or "e7e8q". */
export function uci(move: Move): string {
  return move.from + move.to + (move.promotion ?? '');
}

/**
 * Splits a multi-game PGN string into individual game strings.
 * Games are separated by a blank line, with each game starting at its tag block.
 */
export function getPgnGames(pgnString: string): string[] {
  if (!pgnString || pgnString.trim() === '') return [];
  const normalized = pgnString.replace(/\r\n?/g, '\n');
  return normalized
    .split(/\n\s*\n(?=\[)/)
    .map((g) => g.trim())
    .filter((g) => g.length > 0);
}
