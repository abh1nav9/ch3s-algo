import { useState, type ReactNode } from 'react';

export function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-xl bg-zinc-900 p-5 ring-1 ring-zinc-800">{children}</div>;
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">{children}</div>
  );
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <span>
      <span className="text-zinc-500">{label}: </span>
      <span className="font-mono text-zinc-200">{value}</span>
    </span>
  );
}

export function ChecksumBadge({ ok }: { ok: boolean | null }) {
  if (ok === null) return <span className="text-zinc-500">no checksum</span>;
  return ok ? (
    <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-400">checksum ✓</span>
  ) : (
    <span className="rounded bg-red-500/15 px-2 py-0.5 text-red-400">checksum ✗</span>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md bg-zinc-950 p-3 font-mono text-xs ring-1 ring-zinc-800">
      {children}
    </pre>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/30">
      {message}
    </div>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="mt-3 rounded-md px-4 py-2 text-sm font-medium text-zinc-300 ring-1 ring-zinc-700 hover:bg-zinc-800"
    >
      {copied ? 'Copied!' : 'Copy PGN'}
    </button>
  );
}
