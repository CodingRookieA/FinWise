import globals from "globals";
import json from "@eslint/json";
import js from '@eslint/js'
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [
      js.configs.recommended
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
