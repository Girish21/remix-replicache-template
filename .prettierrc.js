/**
 * @type {import('prettier').Options}
 */
module.exports = {
  semi: false,
  singleQuote: true,
  jsxSingleQuote: true,
  trailingComma: 'all',
  arrowParens: 'avoid',
  plugins: [require('prettier-plugin-tailwindcss')],
}
