import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages はリポジトリ名のサブパス配下で配信されるため、相対パスにしておく
  // (絶対パス "/" だとリポジトリ名を知らないと assets が 404 になる)
  base: "./",
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
