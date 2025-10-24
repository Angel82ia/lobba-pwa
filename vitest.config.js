import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // Entorno de testing
    environment: 'happy-dom', // Cambiar de 'node' a 'happy-dom' para soporte DOM

    // Archivos de setup
    setupFiles: './src/test/setup.js',

    // Configuración global
    globals: true,

    // Pool de procesos para mejor rendimiento
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },

    // Configuración de servidor para tests
    server: {
      deps: {
        inline: ['happy-dom'],
      },
    },

    // Optimización de dependencias
    optimizeDeps: {
      include: ['happy-dom'],
    },

    // Configuración para resolver módulos
    resolve: {
      alias: {
        // Evitar problemas con require en el navegador
        'node:fs': false,
        'node:path': false,
      },
    },

    // Definiciones globales
    define: {
      global: 'globalThis',
    },
  },
})
