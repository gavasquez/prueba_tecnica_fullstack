import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      // Redirigir las peticiones de autenticación
      '^/login|/register|/logout': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // Redirigir las peticiones de la API
      '^/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
