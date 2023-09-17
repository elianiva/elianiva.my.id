/** @type {import("prettier").Config} */
module.exports = {
	semi: true,
	useTabs: true,
	arrowParens: "always",
	trailingComma: "es5",
	bracketSpacing: true,
	printWidth: 120,
	plugins: ["prettier-plugin-astro", "prettier-plugin-svelte"],
	overrides: [
		{
			files: "*.astro",
			options: {
				parser: "astro",
			},
		},
		{
			files: "*.svelte",
			options: {
				parser: "svelte",
			},
		},
	],
};
