import { useState } from 'react';
import { decodePgn, type DecodeResponse } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { downloadBase64 } from '../lib/download';
import { Card, Label, Stat, Mono, ErrorBox, ChecksumBadge } from './ui';

export function DecodePanel() {
  const [pgn, setPgn] = useState('');
  const { result, busy, error, run } = useAsync<DecodeResponse>();

  return (
    <div className="space-y-4">
      <Card>
        <Label>PGN to decode</Label>
        <textarea
          value={pgn}
          onChange={(e) => setPgn(e.target.value)}
          rows={8}
          className="w-full resize-y rounded-md bg-zinc-950 p-3 font-mono text-xs outline-none ring-1 ring-zinc-800 focus:ring-emerald-500"
          placeholder="Paste one or more PGN games..."
        />
        <button
          disabled={busy || !pgn.trim()}
          onClick={() => run(() => decodePgn(pgn))}
          className="mt-3 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-40"
        >
          {busy ? 'Decoding…' : 'Decode'}
        </button>
      </Card>

      {error && <ErrorBox message={error} />}

      {result && (
        <Card>
          <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-zinc-400">
            <Stat label="bytes" value={result.byteLength} />
            <ChecksumBadge ok={result.checksumOk} />
          </div>
          {result.text !== null ? (
            <>
              <Label>Decoded text</Label>
              <Mono>{result.text}</Mono>
            </>
          ) : (
            <p className="text-sm text-zinc-400">
              Binary data — not printable text. Download to inspect.
            </p>
          )}
          <button
            onClick={() => downloadBase64(result.base64, 'decoded.bin')}
            className="mt-3 rounded-md px-4 py-2 text-sm font-medium text-zinc-300 ring-1 ring-zinc-700 hover:bg-zinc-800"
          >
            Download bytes
          </button>
        </Card>
      )}
    </div>
  );
}
