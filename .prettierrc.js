/** @type {import("prettier").Options} */
export default {
  experimentalTernaries: true,
  semi: false,
  arrowParens: 'avoid',
  bracketSameLine: false,
  bracketSpacing: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 88,
  overrides: [
    {
      files: ['__tests__/**', '**/*.{test,spec}.{js,ts}'],
      options: { printWidth: 100 },
    },
  ],
}
