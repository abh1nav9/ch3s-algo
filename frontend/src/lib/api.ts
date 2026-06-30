const BASE = import.meta.env.VITE_API_URL ?? 'https://ch3s-algo-backend.onrender.com';

export interface EncodeResponse {
  pgn: string;
  byteLength: number;
  gameCount: number;
  checksum: string;
}

export interface DecodeResponse {
  base64: string;
  text: string | null;
  byteLength: number;
  checksumOk: boolean | null;
}

async function post<T>(path: string, body: BodyInit, contentType: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export function encodeText(text: string) {
  return post<EncodeResponse>('/encode', JSON.stringify({ text }), 'application/json');
}

export function encodeFile(file: File) {
  return post<EncodeResponse>('/encode', file, 'application/octet-stream');
}

export function decodePgn(pgn: string) {
  return post<DecodeResponse>('/decode', JSON.stringify({ pgn }), 'application/json');
}
