/** Runtime configuration, overridable via environment variables. */
export const config = {
  port: Number(process.env.PORT ?? 3001),
  /** 256 KB cap — encoding is O(bytes) but PGNs expand significantly. */
  maxBytes: 256 * 1024,
  /** Body-parser size limit for incoming requests. */
  bodyLimit: '2mb',
};
