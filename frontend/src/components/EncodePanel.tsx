import { useRef, useState } from 'react';
import { encodeText, encodeFile, type EncodeResponse } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { Card, Label, Stat, Mono, ErrorBox, CopyButton } from './ui';

export function EncodePanel() {
  const [text, setText] = useState('checkmate');
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const { result, busy, error, run } = useAsync<EncodeResponse>();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    run(() => encodeFile(file));
  }

  return (
    <div className="space-y-4">
      <Card>
        <Label>Text to encode</Label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-md bg-zinc-950 p-3 font-mono text-sm outline-none ring-1 ring-zinc-800 focus:ring-emerald-500"
          placeholder="Type something..."
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            disabled={busy || !text}
            onClick={() => run(() => encodeText(text))}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-40"
          >
            {busy ? 'Encoding…' : 'Encode text'}
          </button>
          <span className="text-sm text-zinc-500">or</span>
          <button
            disabled={busy}
            onClick={() => fileInput.current?.click()}
            className="rounded-md px-4 py-2 text-sm font-medium text-zinc-300 ring-1 ring-zinc-700 hover:bg-zinc-800 disabled:opacity-40"
          >
            Upload a file
          </button>
          <input ref={fileInput} type="file" hidden onChange={onFile} />
          {fileName && <span className="text-sm text-zinc-500">{fileName}</span>}
        </div>
      </Card>

      {error && <ErrorBox message={error} />}

      {result && (
        <Card>
          <div className="mb-3 flex flex-wrap gap-4 text-sm text-zinc-400">
            <Stat label="bytes" value={result.byteLength} />
            <Stat label="games" value={result.gameCount} />
            <Stat label="checksum" value={result.checksum} />
          </div>
          <Label>PGN output</Label>
          <Mono>{result.pgn}</Mono>
          <CopyButton text={result.pgn} />
        </Card>
      )}
    </div>
  );
}
