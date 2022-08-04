/** @type {import("prettier").Config} */
module.exports = {
	semi: true,
	useTabs: true,
	arrowParens: "always",
	trailingComma: "es5",
	bracketSpacing: true,
	svelteSortOrder: "options-styles-markup-scripts",
	svelteAllowShorthand: true,
	svelteIndentScriptAndStyle: false,
	printWidth: 120,
	plugins: [require.resolve("prettier-plugin-svelte")],
	overrides: [{ files: "*.svelte", options: { parser: "svelte" } }],
};
