import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      reporter: [
        ['lcov', { projectRoot: './src' }],
        ['json', { file: 'coverage.json' }],
        ['text'],
        ['html'],
      ],
    },
  },
})
