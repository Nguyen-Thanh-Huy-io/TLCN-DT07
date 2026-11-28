import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    css: false,
    testTimeout: 20000,
    maxWorkers: 2,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/utils/common.ts',
        'src/hooks/useEventCategories.ts',
        'src/services/auth/public-auth.service.ts',
        'src/services/auth/use-auth-session.ts',
        'src/components/common/AuthorFollowButton.tsx',
        'src/features/lessons/utils/lesson-quiz.util.ts',
        'src/features/lessons/utils/lesson-toc.util.ts',
        'src/features/lessons/extensions/typography.extension.ts',
        'src/features/lessons/extensions/table.extension.ts',
        'src/features/lessons/strategies/row-layout.strategy.ts',
        'src/features/notes/utils/note-cluster.util.ts',
        'src/features/notes/utils/note-anchor.strategy.ts',
        'src/features/quiz/utils/practice-quiz.helper.ts',
        'src/features/saved-materials/utils/saved-material.normalizer.ts',
      ],
      thresholds: {
        lines: 70,
      },
    },
  },
});
