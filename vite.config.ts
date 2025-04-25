import { defineConfig } from 'vite';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths(),
    TanStackRouterVite({
      // Replace experimental flag with stable one
      autoCodeSplitting: true,
      routesDirectory: path.resolve(__dirname, './app/routes'),
      generatedRouteTree: path.resolve(__dirname, './app/routeTree.gen.ts'),
    }),
  ],
  optimizeDeps: {
    exclude: [
      // Exclude 'isolated-vm' from client-side dependency optimization
      'isolated-vm',
      // Add other Node.js specific modules if they cause issues
      // e.g., 'fs', 'path' if imported directly in server code that gets scanned
    ],
  },
  // Add SSR specific configuration
  ssr: {
    // Ensure isolated-vm is treated as external during SSR build
    // It's a native Node module and shouldn't be bundled.
    external: ['isolated-vm'],
  },
});
