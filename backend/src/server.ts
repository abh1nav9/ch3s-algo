import { createApp } from './app';
import { config } from './config';

createApp().listen(config.port, () => {
  console.log(`ch3s backend listening on http://localhost:${config.port}`);
});
