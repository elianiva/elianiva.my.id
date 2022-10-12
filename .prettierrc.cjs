/** @type {import("prettier").Config} */
module.exports = {
	semi: true,
	useTabs: true,
	arrowParens: "always",
	trailingComma: "es5",
	bracketSpacing: true,
	printWidth: 120,
	plugins: [require.resolve("prettier-plugin-astro")],
	overrides: [
		{
			files: "*.astro",
			options: {
				parser: "astro",
			},
		},
	],
};
