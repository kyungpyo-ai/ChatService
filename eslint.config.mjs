import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "dist/**",
      "public/**",
      "shrimp_data/**",
      ".husky/**",
      "next-env.d.ts",
      "tailwind.config.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettier,
];

export default eslintConfig;
