import { createApp } from '../src/app';

// Vercel runs the Express app as a serverless function (no app.listen()).
// `createApp` is the listener-free factory used in both dev and tests.
export default createApp();
