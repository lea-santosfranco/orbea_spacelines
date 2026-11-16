import { defineConfig } from 'vitest/config';
import { testDatabaseUrl } from './tests/testDatabaseUrl.js';

export default defineConfig({
  test: {
    globalSetup: './tests/globalSetup.js',
    // Les fichiers de test partagent la même base : ils s'exécutent l'un après l'autre
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testDatabaseUrl(),
      JWT_SECRET: 'secret-de-test',
      STRIPE_SECRET_KEY: 'sk_test_factice',
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
    },
  },
});
