import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [tailwindcss(), react()],
    define: {
      'process.env.ZEGO_APP_ID': JSON.stringify(env.ZEGO_APP_ID || env.VITE_ZEGO_APP_ID || ''),
      'process.env.ZEGO_SERVER_SECRET': JSON.stringify(env.ZEGO_SERVER_SECRET || env.VITE_ZEGO_SERVER_SECRET || ''),
    },
  };
});
