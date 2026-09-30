// @ts-check

import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import checkFile from 'eslint-plugin-check-file';
import sonarjs from 'eslint-plugin-sonarjs';

export default tseslint.config(
    {
        ignores: ['eslint.config.mjs', 'dist/**', 'coverage/**', 'generated/**'],
    },

    eslint.configs.recommended,

    ...tseslint.configs.recommended,

    eslintPluginPrettierRecommended,

    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },

            sourceType: 'commonjs',

            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },

    {
        plugins: {
            'check-file': checkFile,
            'sonarjs': sonarjs,
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',

            '@typescript-eslint/no-floating-promises': 'warn',

            '@typescript-eslint/no-unsafe-argument': 'warn',

            'prettier/prettier': ['error', { endOfLine: 'auto' }],

            // 1. Architecture & module folder/filename naming conventions
            'check-file/filename-naming-convention': [
                'warn',
                {
                    'src/**/*.controller.ts': 'KEBAB_CASE',
                    'src/**/*.service.ts': 'KEBAB_CASE',
                    'src/**/*.module.ts': 'KEBAB_CASE',
                    'src/**/*.dto.ts': 'KEBAB_CASE',
                    'src/**/*.entity.ts': 'KEBAB_CASE',
                    'src/**/*.strategy.ts': 'KEBAB_CASE',
                    'src/**/*.guard.ts': 'KEBAB_CASE',
                },
                {
                    ignoreMiddleExtensions: true,
                },
            ],
            'check-file/folder-naming-convention': [
                'warn',
                {
                    'src/**/': 'KEBAB_CASE',
                },
            ],

            // 2. Strict syntax: Disallow remote hardcoded URLs
            'no-restricted-syntax': [
                'warn',
                {
                    selector: 'Literal[value=/^https?:\\/\\/(?!localhost)(?!127\\.0\\.0\\.1)/]',
                    message:
                        'Không được hardcode trực tiếp URL remote (http/https). Bắt buộc đưa vào biến môi trường hoặc ConfigService.',
                },
            ],

            // 3. SonarJS: Eliminate Magic Strings
            'sonarjs/no-duplicate-string': [
                'warn',
                {
                    threshold: 4,
                    ignoreStrings:
                        '^(GET|POST|PUT|DELETE|PATCH|id|uuid|name|email|status|role|createdAt|updatedAt|active|bearer|Bearer)$',
                },
            ],

            // 4. SonarJS: Cognitive Complexity limit <= 15
            'sonarjs/cognitive-complexity': ['warn', 15],
        },
    },
);