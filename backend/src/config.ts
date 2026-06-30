const DEFAULT_ORIGINS = [
  'https://ch3s-algo-frontend.vercel.app',
  'http://localhost:3000',
];

/**
 * Browser origins allowed to call the API. Override in production with a
 * comma-separated `ALLOWED_ORIGINS` env var (e.g. preview deployments).
 */
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : DEFAULT_ORIGINS;

/** Runtime configuration, overridable via environment variables. */
export const config = {
  port: Number(process.env.PORT ?? 3001),
  /** 256 KB cap — encoding is O(bytes) but PGNs expand significantly. */
  maxBytes: 256 * 1024,
  /** Body-parser size limit for incoming requests. */
  bodyLimit: '2mb',
  allowedOrigins,
};
