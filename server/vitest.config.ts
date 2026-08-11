import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      DEV_AUTH: 'true',
      OWNER_EMAILS: 'alice@dev.local,bob@dev.local',
      CLIENT_ORIGIN: 'http://localhost:5173',
      NODE_ENV: 'test',
      DEV_DATA_FILE: ':memory:',
    },
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 60_000,
  },
});
