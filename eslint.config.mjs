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
  {
    rules: {
      "sort-imports": [
        "error",
        {
          ignoreDeclarationSort: true,
        },
      ],
      "import/order": [
        "error",
        {
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
          groups: ["builtin", "external", "parent", "sibling", "index"],
          pathGroups: [
            {
              pattern: "@\/**",
              group: "external",
              position: "after",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
