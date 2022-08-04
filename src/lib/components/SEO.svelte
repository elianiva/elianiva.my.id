<svelte:head>
	<title>{title} | {siteName}</title>
	<link rel="canonical" href="{siteUrl}{$page.url.pathname}" />
	<meta name="description" content={desc} />
	<meta name="keywords" content={keywords.join(",").toLowerCase()} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={isPost ? "blog" : "website"} />
	<meta property="og:url" content="{siteUrl}{$page.url.pathname}" />
	<meta property="og:title" content={title || siteName} />
	<meta property="og:description" content={desc} />
	<meta
		property="og:image"
		content={thumbnail ? thumbnail.toString() : "https://avatars3.githubusercontent.com/u/51877647?s=240&v=4"}
	/>

	<!-- Twitter -->
	<meta property="twitter:card" content={thumbnail ? "summary_large_image" : "summary"} />
	<meta property="twitter:url" content="{siteUrl}{$page.url.pathname}" />
	<meta property="twitter:title" content={title || siteName} />
	<meta property="twitter:description" content={desc} />
	{#if thumbnail}
		<meta property="twitter:image" content={thumbnail ? thumbnail.toString() : ""} />
	{/if}
</svelte:head>

<script lang="ts">
import { page } from "$app/stores";
import data from "$lib/data/site";

const { siteName, siteUrl } = data;

export let title: string;
export let isPost: boolean = false;
export let thumbnail: string | boolean = false;
export let desc: string = data.desc;
export let keywords: string[] = data.keywords;
</script>
