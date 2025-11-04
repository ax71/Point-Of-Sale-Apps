import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

eslintConfig.push({
  rules: {
    "react-hooks/exhaustive-deps": "off", // Disable exhaustive-deps rule
    "react/jsx-key": "off", // Disable jsx-key rule
    "@typescript-eslint/no-explicit-any": "off", // Disable no-explicit-any rule
    "@typescript-eslint/no-unused-vars": "off", // Disable unused vars rule
  },
});

export default eslintConfig;
