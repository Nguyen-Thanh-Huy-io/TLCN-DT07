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
          "src/{components,features,services,types,constants,utils,hooks,contexts}/**/":
            "KEBAB_CASE",
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
          // Chỉ bắt URL có tên miền; chuỗi chỉ có giao thức ("https://..." ở placeholder, startsWith) không tính.
          selector: "Literal[value=/^https?:\\/\\/(?!localhost)(?!127\\.0\\.0\\.1)[a-z0-9]/i]",
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

      // 3. SonarJS: Eliminate Magic Strings (Threshold nâng lên 3 phù hợp React/Tailwind theo ESLINT_REPORT)
      "sonarjs/no-duplicate-string": [
        "warn",
        {
          threshold: 3,
          ignoreStrings:
            "^(use client|use server|button|submit|text|/| |px-4 py-2|font-medium|destructive|outline|ghost|secondary|default|sm|md|lg|xl)$",
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
  {
    // Next.js Server-side Route Handlers (BFF) & Auth/Public services được phép dùng fetch() gọi sang backend;
    // entity-sources gọi API bên ngoài (Wikipedia/Wikimedia/Wikidata) — ngoại lệ đã ghi trong CLAUDE.md.
    files: [
      "src/app/api/**",
      "src/services/auth/**",
      "src/services/public/**",
      "src/features/lessons/strategies/entity-sources/**",
    ],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          // Chỉ bắt URL có tên miền; chuỗi chỉ có giao thức ("https://..." ở placeholder, startsWith) không tính.
          selector: "Literal[value=/^https?:\\/\\/(?!localhost)(?!127\\.0\\.0\\.1)[a-z0-9]/i]",
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
    },
  },
  {
    // Bỏ qua kiểm tra tên thư mục đặc biệt __tests__
    files: ["**/__tests__/**"],
    rules: {
      "check-file/folder-naming-convention": "off",
    },
  },
]);

export default eslintConfig;
