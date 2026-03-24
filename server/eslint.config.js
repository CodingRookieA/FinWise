import globals from "globals";
import json from "@eslint/json";
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [
      eslintPluginUnicorn.configs.recommended
    ],
    languageOptions: {
      globals: globals.node
    },
  },
  {
    files: ["**/*.json"],
    plugins: {
      json
    },
    language: "json/json"
  },
]);
