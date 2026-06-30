import { build } from 'esbuild';

// Bundle the whole backend into a single self-contained file at api/index.js.
// Vercel's Node runtime treats api/*.js as a function and invokes the default
// export (the Express app). Bundling everything — including node_modules —
// eliminates all runtime module resolution, which is what was crashing the
// function with ERR_MODULE_NOT_FOUND under Vercel's ESM loader.
await build({
  entryPoints: ['api/_entry.ts'],
  outfile: 'api/index.js',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  minify: false,
  sourcemap: false,
  // express/chess.js are CJS; let esbuild interop them into the ESM bundle.
  banner: {
    js: "import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);",
  },
});

console.log('Bundled api/index.js');
