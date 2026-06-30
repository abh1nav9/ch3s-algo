import { encode } from '../src/algorithms/encode.js';
import { decode } from '../src/algorithms/decode.js';

function check(name: string, data: Uint8Array) {
  const enc = encode(data);
  const dec = decode(enc.pgn);
  const ok =
    dec.data.length === data.length &&
    data.every((b, i) => b === dec.data[i]) &&
    dec.checksumOk === true;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(28)} ${data.length}B -> ${enc.gameCount} game(s)`,
  );
  if (!ok) {
    console.log('  expected:', Array.from(data));
    console.log('  got     :', Array.from(dec.data), 'checksumOk=', dec.checksumOk);
    process.exitCode = 1;
  }
}

const enc = new TextEncoder();
check('the classic "hai"', enc.encode('hai'));
check('"hello world details?"', enc.encode('hello world details?'));
check('single byte i', enc.encode('i'));
check('all special chars', enc.encode('?+=\\*/%<>&^|'));
check('newlines/tabs', enc.encode('a\nb\tc\r\nd'));
check('longer text', enc.encode('The quick brown fox jumps over the lazy dog. '.repeat(20)));

// Every single byte value 0..255 in isolation.
for (let b = 0; b < 256; b++) check(`byte ${b}`, new Uint8Array([b]));

// Random binary blobs of assorted sizes.
for (const size of [1, 7, 8, 9, 64, 255, 1000]) {
  const buf = new Uint8Array(size);
  for (let i = 0; i < size; i++) buf[i] = Math.floor(Math.random() * 256);
  check(`random ${size}B`, buf);
}

console.log(process.exitCode ? '\nSOME TESTS FAILED' : '\nALL TESTS PASSED');
