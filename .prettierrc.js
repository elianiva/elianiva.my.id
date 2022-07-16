/**
 * @type {import('prettier').Options}
 */
module.exports = {
	semi: true,
	arrowParens: "always",
	trailingComma: "es5",
	bracketSpacing: true,
	printWidth: 120,
	useTabs: true,
	astroAllowShorthand: false,
	plugins: [require.resolve("prettier-plugin-astro")],
	overrides: [
		{
			files: "**/*.astro",
			options: { parser: "astro" },
		},
	],
};
