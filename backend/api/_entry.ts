// Bundle entry for Vercel. Exports the Express app as the default export,
// which Vercel's Node runtime invokes as the function handler.
import { createApp } from '../src/app.js';

export default createApp();
