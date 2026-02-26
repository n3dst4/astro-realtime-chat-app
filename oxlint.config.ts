import { defineConfig } from "oxlint";

// export default defineConfig({
//   categories: {
//     correctness: "warn",
//   },
//   rules: {
//     "eslint/no-unused-vars": "error",
//   },
// });

export default defineConfig({
  plugins: ["react"],
  categories: {
    correctness: "error",
    style: "off",
    suspicious: "error",
  },
  rules: {
    "react/react-in-jsx-scope": "off",
    "eslint/sort-keys": "off",
    "eslint/func-style": "off",
    "react/jsx-max-depth": "off",
    "eslint/no-ternary": "off",
    // "eslint/sort-imports": [
    //   "error",
    //   { memberSyntaxSortOrder: ["multiple", "all", "single", "none"] },
    // ],
    "eslint/sort-imports": "off",
    "eslint/capitalized-comments": "off",
    "eslint/no-magic-numbers": [
      "error",
      { ignore: [-1, 0, 1, 2, 24, 60, 1000] },
    ],
  },
  settings: {
    "jsx-a11y": {
      polymorphicPropName: null,
      components: {},
      attributes: {},
    },
    next: {
      rootDir: [],
    },
    react: {
      formComponents: [],
      linkComponents: [],
      version: null,
      componentWrapperFunctions: [],
    },
    jsdoc: {
      ignorePrivate: false,
      ignoreInternal: false,
      ignoreReplacesDocs: true,
      overrideReplacesDocs: true,
      augmentsExtendsReplacesDocs: false,
      implementsReplacesDocs: false,
      exemptDestructuredRootsFromChecks: false,
      tagNamePreference: {},
    },
    vitest: {
      typecheck: false,
    },
  },
  env: {
    builtin: true,
  },
  globals: {},
  ignorePatterns: [],
});
