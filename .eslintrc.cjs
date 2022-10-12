module.exports = {
	env: {
		browser: true,
		es6: true,
		node: true,
	},
	extends: "eslint:recommended",
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: 2019,
		sourceType: "module",
	},
	plugins: ["@typescript-eslint"],
	rules: {},
};
