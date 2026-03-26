import { createRequire } from 'module';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const require = createRequire(import.meta.url);
const { handlePinnedQuestRequest } = require('./server/githubPinned');

function githubPinnedDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'github-pinned-dev-endpoint',
    configureServer(server) {
      server.middlewares.use('/api/github-pinned', async (req, res) => {
        await handlePinnedQuestRequest(req, res, {
          ...process.env,
          ...env,
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');

  return {
    plugins: [react(), githubPinnedDevPlugin(env)],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    css: {
      modules: {
        localsConvention: 'camelCase',
      },
    },
    server: {
      allowedHosts: 'all',
    },
  };
});
