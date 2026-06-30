import type { ReactNode } from 'react';

export type Tab = 'encode' | 'decode';

export function Tabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="mb-6 inline-flex rounded-lg bg-zinc-900 p-1">
      <TabButton active={tab === 'encode'} onClick={() => onChange('encode')}>
        Encode
      </TabButton>
      <TabButton active={tab === 'decode'} onClick={() => onChange('decode')}>
        Decode
      </TabButton>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-5 py-2 text-sm font-medium transition ${
        active ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-100'
      }`}
    >
      {children}
    </button>
  );
}
