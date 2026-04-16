import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Next.js 16 React 19 uchun jsdom muhiti; alias @/* tsconfig bilan sinxron
export default defineConfig({
  plugins: [],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/lib/analitika.ts',
        'src/app/api/sotuvlar/**/*.ts',
        'src/app/(dashboard)/sotuvlar/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/__mocks__/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
