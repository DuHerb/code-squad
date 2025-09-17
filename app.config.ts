import { defineConfig } from '@tanstack/react-start/config';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  vite: {
    plugins: [
      tsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
    ],
    optimizeDeps: {
      exclude: ['isolated-vm'],
    },
    ssr: {
      external: ['isolated-vm'],
    },
  },
});
