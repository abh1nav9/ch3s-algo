import { useState } from 'react';
import { Tabs, type Tab } from './components/Tabs';
import { EncodePanel } from './components/EncodePanel';
import { DecodePanel } from './components/DecodePanel';

export function App() {
  const [tab, setTab] = useState<Tab>('encode');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <img src="/vite.svg" alt="" className="h-8 w-8" />
            ch3s
          </h1>
          <p className="mt-2 text-zinc-400">
            Encode any file or text into legal chess games — and decode it back, losslessly.
          </p>
        </header>

        <Tabs tab={tab} onChange={setTab} />

        {tab === 'encode' ? <EncodePanel /> : <DecodePanel />}
      </div>
    </div>
  );
}
