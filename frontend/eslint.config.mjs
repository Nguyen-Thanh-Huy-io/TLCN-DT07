import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import checkFile from "eslint-plugin-check-file";
import sonarjs from "eslint-plugin-sonarjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "tests/**",
    "report/**",
  ]),
  {
    plugins: {
      "check-file": checkFile,
      "sonarjs": sonarjs,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react/no-unescaped-entities": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      // 1. Architecture & module folder/filename naming conventions
      "check-file/filename-naming-convention": [
        "warn",
        {
          "src/components/**/*.tsx": "PASCAL_CASE",
          "src/features/**/components/**/*.tsx": "PASCAL_CASE",
          "src/services/**/*.ts": "KEBAB_CASE",
          "src/types/**/*.ts": "KEBAB_CASE",
          "src/constants/**/*.ts": "KEBAB_CASE",
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
      "check-file/folder-naming-convention": [
        "warn",
        {
          "src/**/": "KEBAB_CASE",
        },
      ],

      // 2. Strict syntax: Disallow direct raw fetch calls, hardcoded remote URLs, and Magic Strings
      "no-restricted-syntax": [
        "warn",
        {
          selector: "CallExpression[callee.name='fetch']",
          message:
            "Không được gọi fetch() tự do trong component. Bắt buộc dùng service API tập trung từ '@/services/api'.",
        },
        {
          selector: "Literal[value=/^https?:\\/\\/(?!localhost)(?!127\\.0\\.0\\.1)/]",
          message:
            "Không được hardcode trực tiếp URL remote (http/https). Bắt buộc đưa vào biến môi trường hoặc '@/constants/routes'.",
        },
        {
          selector:
            "BinaryExpression[operator=/^(===|!==)$/]:not(:has(UnaryExpression[operator='typeof'])) > Literal[value=/^[a-zA-Z0-9_-]{2,}$/]",
          message:
            "Phát hiện Magic String trong phép so sánh logic (===, !==). Bắt buộc định nghĩa Enum hoặc hằng số tập trung tại '@/constants/...' để đảm bảo nguyên tắc SOLID (OCP).",
        },
        {
          selector: "SwitchCase > Literal[value=/^[a-zA-Z0-9_-]{2,}$/]",
          message:
            "Phát hiện Magic String trong switch-case. Bắt buộc sử dụng Enum hoặc hằng số tập trung tại '@/constants/...'.",
        },
      ],

      // 3. SonarJS: Eliminate Magic Strings (Threshold nâng cấp lên 2 theo yêu cầu)
      "sonarjs/no-duplicate-string": [
        "warn",
        {
          threshold: 2,
          ignoreStrings: "^(use client|use server|button|submit|text|/| |)$",
        },
      ],

      // 4. SonarJS: Cognitive Complexity limit <= 15
      "sonarjs/cognitive-complexity": ["warn", 15],
    },
  },
  {
    // Bỏ qua kiểm tra chuỗi trùng lặp trên các file Mock Data / Seed tĩnh
    files: ["src/data/**"],
    rules: {
      "sonarjs/no-duplicate-string": "off",
    },
  },
]);

export default eslintConfig;
