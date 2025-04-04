/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Add type declarations for unplugin-icons
declare module "~icons/*" {
	import { SvelteComponentTyped } from "svelte";
	const component: typeof SvelteComponentTyped;
	export default component;
}
