module.exports = {
	env: {
		browser: true, es6: true, node: true,
	},
	extends: ["eslint:recommended", 'plugin:svelte/recommended'],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: 2019, sourceType: "module",
	},
	plugins: ["@typescript-eslint"],
	rules: {},
	overrides: [
		{
			files: ['*.svelte'],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser'
			}
		}
	]
};
