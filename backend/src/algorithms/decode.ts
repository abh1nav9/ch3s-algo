import { Chess } from 'chess.js';
import { calculateChecksum, getPgnGames, orderedLegalMoves, uci } from './util';

export interface DecodeResult {
  data: Uint8Array;
  checksumOk: boolean | null; // null when the PGN carried no checksum
  gameCount: number;
}

/**
 * Decodes a PGN (one or more games) back into the original bytes.
 *
 * Mirror image of the encoder: replay each game, and for every move recover the
 * index it had within the deterministically ordered legal moves, emitting
 * `floor(log2(legalMoveCount))` bits. The bit stream is then truncated to the
 * exact length recorded in the headers.
 */
export function decode(pgnString: string): DecodeResult {
  const games = getPgnGames(pgnString);
  if (games.length === 0) {
    throw new Error('No valid chess games found in the PGN data');
  }

  const meta = readMeta(games);
  const ordered = sortByGameIndex(games);

  let bits = '';
  for (const game of ordered) {
    bits += decodeGame(game);
    if (meta.bitLength !== null && bits.length >= meta.bitLength) break;
  }

  if (meta.bitLength !== null) {
    bits = bits.slice(0, meta.bitLength);
  } else {
    // No length metadata: keep only whole bytes.
    bits = bits.slice(0, bits.length - (bits.length % 8));
  }

  const data = bitsToBytes(bits);
  const truncated = meta.byteLength !== null ? data.slice(0, meta.byteLength) : data;

  let checksumOk: boolean | null = null;
  if (meta.checksum !== null) {
    checksumOk = calculateChecksum(truncated) === meta.checksum;
  }

  return { data: truncated, checksumOk, gameCount: ordered.length };
}

/** Replays one game and returns the bits it encodes. */
function decodeGame(pgn: string): string {
  const board = new Chess();
  board.loadPgn(pgn);
  const moves = board.history({ verbose: true });

  board.reset();
  let bits = '';
  for (const move of moves) {
    const legalMoves = orderedLegalMoves(board);
    const moveBits = Math.floor(Math.log2(legalMoves.length));
    const playedUci = move.from + move.to + (move.promotion ?? '');

    if (moveBits > 0) {
      const index = legalMoves.findIndex((m) => uci(m) === playedUci);
      if (index === -1) {
        throw new Error(`Move ${playedUci} not legal during decode`);
      }
      bits += index.toString(2).padStart(moveBits, '0');
    }
    board.move({ from: move.from, to: move.to, promotion: move.promotion });
  }
  return bits;
}

interface Meta {
  byteLength: number | null;
  bitLength: number | null;
  checksum: string | null;
}

function readMeta(games: string[]): Meta {
  const board = new Chess();
  board.loadPgn(games[0]);
  const h = board.header();
  return {
    byteLength: h.FileSize ? parseInt(h.FileSize, 10) : null,
    bitLength: h.BitLength ? parseInt(h.BitLength, 10) : null,
    checksum: h.Checksum ?? null,
  };
}

/** Orders games by their GameIndex header, falling back to source order. */
function sortByGameIndex(games: string[]): string[] {
  const indexed = games.map((pgn) => {
    const board = new Chess();
    board.loadPgn(pgn);
    const idx = board.header().GameIndex;
    return { pgn, index: idx ? parseInt(idx, 10) : null };
  });
  if (indexed.every((g) => g.index !== null)) {
    indexed.sort((a, b) => (a.index as number) - (b.index as number));
  }
  return indexed.map((g) => g.pgn);
}

function bitsToBytes(bits: string): Uint8Array {
  const out = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  return out;
}
