# The codec

Turns arbitrary bytes into legal chess games (PGN) and back, losslessly.

```
util.ts     shared primitives: bit helpers, move ordering, checksum, PGN splitting
encode.ts   bytes  -> PGN
decode.ts   PGN    -> bytes
index.ts    public exports
```

It is **steganography, not encryption** — the data is hidden in plain sight as
ordinary-looking chess moves, but anyone holding the PGN can decode it. There is
no key and no secrecy. What it *does* guarantee is that the round-trip is exact:
the bytes you put in are the bytes you get out. See [Why it can't be broken](#why-it-cant-be-broken).

---

## The core idea

A chess position has some number `N` of legal moves. Choosing one of them is a
choice among `N` possibilities, which carries up to `log2(N)` bits of
information. So a game of chess is a channel: **each move can transmit bits, and
the move played tells the receiver which bits were sent.**

Concretely, every move encodes

```
b = floor(log2(N))      // N = number of legal moves in the current position
```

bits. We floor it so that every index `0 .. 2^b - 1` maps to a real, legal move
(if `N = 20`, then `b = 4`: indices `0..15` are usable, the extra 4 moves are
simply never selected).

The single rule that makes the whole thing work:

> Both sides order the legal moves the same way, then treat the **position of a
> move in that ordered list** as a `b`-bit number.

We order by UCI string (`from + to + promotion`, e.g. `e2e4`, `e7e8q`) — see
`orderedLegalMoves()` in [util.ts](util.ts). Any total order would do; it only
matters that encoder and decoder agree.

---

## Encoding (`encode.ts`)

1. Flatten the input bytes into one big bit string (`bytesToBits`), MSB first.
2. Start a fresh game. Repeatedly:
   - Compute the ordered legal moves and `b = floor(log2(N))`.
   - **If `b === 0`** (only one legal move): the move is forced, so it carries
     no information. Play it, consume no bits. The decoder will skip it the same
     way, so the streams stay aligned.
   - **Otherwise**: take the next `b` bits, read them as an integer `index`, and
     play the `index`-th ordered move. Advance the bit cursor by `b`.
3. **When a game ends** (checkmate/stalemate → no legal moves) or hits the
   `MAX_PLIES_PER_GAME` cap, seal the PGN and start a new game. The bit stream
   just continues across the boundary; multiple games are concatenated.
4. The very last chunk may be shorter than `b` bits; it is right-padded with
   zeros (`padEnd`). Those padding bits are harmless because the decoder is told
   the exact original length and throws the extras away.
5. `stampHeaders` records that length and a checksum in the first game's PGN
   headers:

   | Header            | Meaning                                          |
   | ----------------- | ------------------------------------------------ |
   | `FileSize`        | original length in **bytes** (final truncation)  |
   | `BitLength`       | original length in **bits** (exact stop point)   |
   | `Checksum`        | FNV-1a over the original bytes (integrity check) |
   | `GameIndex`       | per game — restores order if games get shuffled  |
   | `GameCount`       | total number of games                            |
   | `EncodingVersion` | format version (`2.0`)                           |

## Decoding (`decode.ts`)

The exact mirror image:

1. Split the input into individual games (`getPgnGames`) and read the metadata
   from the first one (`readMeta`).
2. Order the games by `GameIndex` (`sortByGameIndex`) so reshuffling is harmless.
3. For each game, replay its moves from the start (`decodeGame`). Before each
   move, recompute the *same* ordered legal-move list, find the index of the
   move that was actually played, and emit it as `b` bits — skipping forced
   moves exactly as the encoder did.
4. Concatenate all the bits, **truncate to `BitLength`**, regroup into bytes,
   and truncate to `FileSize`. This discards the zero padding from step 4 above.
5. Recompute the checksum and compare. `checksumOk` is `true`/`false`, or `null`
   when the PGN carried no checksum.

Encode and decode share `orderedLegalMoves` and the `floor(log2(N))` formula, so
they are guaranteed to agree move-for-move.

---

## A tiny worked example

Say the current position has `N = 8` legal moves, so `b = floor(log2(8)) = 3`.
Ordered by UCI they are:

```
index:  0     1     2     3     4     5     6     7
move:  a2a3  a2a4  b1a3  b1c3  b2b3  b2b4  c2c3  c2c4
```

To send the bits `101`, the encoder reads `101` = **5** and plays `b2b4`.
The decoder sees `b2b4`, finds it at index **5** in the identical ordered list,
and emits `101`. The three bits survive the trip unchanged.

---

## Why it can't be broken

"Unhackable" here means a specific, provable property — **not** cryptographic
secrecy. The codec cannot silently corrupt your data or desynchronize. Three
reasons:

### 1. Encode and decode are the same function run backwards

Both sides derive the chunk size from one deterministic formula
(`floor(log2(N))`) over one deterministic move ordering (UCI sort). There is no
hidden state, no randomness, no heuristic that one side knows and the other has
to guess. Given a position, the mapping `index ↔ move` is a fixed bijection over
`0 .. 2^b - 1`. Decoding is just looking the move up in the same table the
encoder built. By construction, `decode(encode(x)) === x` for every `x`.

### 2. The streams can never drift apart

The two ways a naïve version desyncs are both closed off:

- **Forced moves** (`b = 0`) consume zero bits on *both* sides, so a stretch of
  only-one-legal-move positions advances neither cursor.
- **Game boundaries** carry no information — games are simply concatenated and
  re-ordered by `GameIndex` — so where one game stops and the next begins never
  shifts a single bit.

Because every move consumes exactly `floor(log2(N))` bits on encode and produces
exactly `floor(log2(N))` bits on decode, the cursors move in lockstep from the
first ply to the last.

### 3. Length and integrity are pinned down explicitly

The only fuzzy part of any bit-packing scheme is the tail — the final partial
byte. We don't guess it: `BitLength` says exactly where the real data ends, so
the zero padding is removed deterministically, and `FileSize` fixes the byte
count. The FNV-1a `Checksum` then verifies the whole thing end-to-end, so even a
hypothetical mismatch would be *detected* rather than silently returned.

### What this earlier versions got wrong

A previous implementation wasn't symmetric: the encoder used retries, fallback
moves, and bit-length reductions that the decoder couldn't see. That drift
corrupted specific inputs, and the code tried to paper over it with hard-coded
"fixes" — special handling for the string `"hai"`, the letter `i`, `"details?"`,
and a character-substitution table (`hah → hai`, `7 → ?`, …).

This version deletes all of that. There are **no special cases, no retries, no
fallbacks, and no character fixes**, because a correct-by-construction bijection
doesn't need them. The round-trip test exercises every byte value `0–255`, those
exact historical trip-ups, and random binary blobs:

```bash
cd backend && bun run tests/roundtrip.test.ts
```

---

## Limits & notes

- **It expands data.** A typical middlegame position offers ~30 moves, so a move
  carries ~4–5 bits, i.e. roughly two moves per byte — and each move is several
  characters of PGN. Expect output far larger than the input; this suits text
  and small files, not large binaries. The API enforces a size cap for that
  reason.
- **No secrecy.** Anyone with the PGN recovers the bytes. Encrypt *before*
  encoding if you need confidentiality.
- **Self-describing.** All the information needed to decode lives in the PGN
  headers, so a PGN encoded by this version decodes without any out-of-band data.
