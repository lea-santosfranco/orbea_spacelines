import app from './app.js';
import { config } from './config/env.js';

app.listen(config.port, () => {
  console.log(`API Orbéa démarrée sur http://localhost:${config.port}`);
});