import { defineConfig } from 'tsup';
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'nest/index': 'src/nest/index.ts',
    'cloudflare/index': 'src/cloudflare/index.ts',
    'decorators/index': 'src/decorators/index.ts',
    'dsl/index': 'src/dsl/index.ts',
    'providers/index': 'src/providers/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2023',
  splitting: false,
});
