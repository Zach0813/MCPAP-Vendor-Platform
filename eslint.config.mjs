// ESLint flat-config — required by ESLint 9 + Next 16.
// Replaces the legacy .eslintrc.json. See https://eslint.org/docs/latest/use/configure/migration-guide
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  // Ignore build artifacts and the scratch diagnostic file.
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'build/**', 'types/__diag.ts'],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Project-level overrides go here.
      'react/jsx-key': 'error',
    },
  },
];

export default config;
