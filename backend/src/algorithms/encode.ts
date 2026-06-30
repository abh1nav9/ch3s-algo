import { Chess } from 'chess.js';
import { calculateChecksum, orderedLegalMoves, uci, toBinaryString } from './util';

const MAX_PLIES_PER_GAME = 100; // cap game length so PGNs stay readable

export interface EncodeResult {
  pgn: string;
  byteLength: number;
  bitLength: number;
  checksum: string;
  gameCount: number;
}

/**
 * Encodes arbitrary bytes into one or more legal chess games (PGN).
 *
 * Each move encodes `floor(log2(legalMoveCount))` bits: the next chunk of the
 * bit stream is read as an integer index into the deterministically ordered
 * legal moves. The decoder reverses this exactly — there are no fallbacks or
 * special cases, so any byte sequence round-trips losslessly.
 */
export function encode(data: Uint8Array): EncodeResult {
  if (data.length === 0) {
    throw new Error('Cannot encode empty input');
  }

  const bits = bytesToBits(data);
  const checksum = calculateChecksum(data);

  const pgns: string[] = [];
  let bitIndex = 0;
  let board = newGame();

  while (bitIndex < bits.length) {
    const legalMoves = orderedLegalMoves(board);

    // Terminal position or length cap reached: seal this game, start a new one.
    if (legalMoves.length === 0 || board.history().length >= MAX_PLIES_PER_GAME) {
      pgns.push(board.pgn());
      board = newGame();
      continue;
    }

    const moveBits = Math.floor(Math.log2(legalMoves.length));

    if (moveBits === 0) {
      // Only one legal move: forced, encodes nothing. Decoder skips it too.
      const only = legalMoves[0];
      board.move({ from: only.from, to: only.to, promotion: only.promotion });
      continue;
    }

    // Read the next chunk of bits as an index, padding the final chunk with 0s.
    const chunk = bits.slice(bitIndex, bitIndex + moveBits).padEnd(moveBits, '0');
    const index = parseInt(chunk, 2);
    const move = legalMoves[index];
    board.move({ from: move.from, to: move.to, promotion: move.promotion });
    bitIndex += moveBits;
  }

  if (board.history().length > 0) {
    pgns.push(board.pgn());
  }

  const gameCount = pgns.length;
  // Stamp metadata onto the first game so the decoder knows the exact length.
  const stamped = stampHeaders(pgns, {
    byteLength: data.length,
    bitLength: bits.length,
    checksum,
    gameCount,
  });

  return {
    pgn: stamped.join('\n\n'),
    byteLength: data.length,
    bitLength: bits.length,
    checksum,
    gameCount,
  };
}

function newGame(): Chess {
  return new Chess();
}

function bytesToBits(data: Uint8Array): string {
  let bits = '';
  for (const byte of data) bits += toBinaryString(byte, 8);
  return bits;
}

interface Meta {
  byteLength: number;
  bitLength: number;
  checksum: string;
  gameCount: number;
}

/**
 * Re-loads each game and applies headers. The first game carries the file
 * metadata; every game gets a GameIndex so order survives any reshuffling.
 */
function stampHeaders(pgns: string[], meta: Meta): string[] {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
  return pgns.map((pgn, i) => {
    const board = new Chess();
    board.loadPgn(pgn);
    board.header('Event', 'ChessCrypto File');
    board.header('Site', 'ChessCrypto');
    board.header('Date', date);
    board.header('Round', String(i + 1));
    board.header('White', 'ChessCrypto');
    board.header('Black', 'ChessCrypto');
    board.header('GameIndex', String(i + 1));
    board.header('GameCount', String(meta.gameCount));
    if (i === 0) {
      board.header('FileSize', String(meta.byteLength));
      board.header('BitLength', String(meta.bitLength));
      board.header('Checksum', meta.checksum);
      board.header('EncodingVersion', '2.0');
    }
    return board.pgn();
  });
}
