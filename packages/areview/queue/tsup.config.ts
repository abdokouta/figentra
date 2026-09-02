import { defineConfig } from 'tsup';
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'nest/index': 'src/nest/index.ts',
    'cloudflare/index': 'src/cloudflare/index.ts',
    'sqs/index': 'src/sqs/index.ts',
    'redis/index': 'src/redis/index.ts',
    'bullmq/index': 'src/bullmq/index.ts',
  },
  format: ['esm'], dts: true, sourcemap: true, clean: true, target: 'es2023', splitting: false,
});
