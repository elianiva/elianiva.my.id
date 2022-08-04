<SEO title="Home" />

<Transition url={url}>
	<main class="max-w-[1080px] my-0 mx-auto pt-8 px-4 pb-0 z-[2]">
		<Header />
		<Section title="Recent Posts" data={posts} btnText="More Posts" url="/post" type="posts" />
		<Section title="Recent Projects" data={projects} btnText="More Projects" url="/project" type="projects" />
	</main>
</Transition>
<Progress />

<script context="module">
export const prerender = true;
</script>

<script lang="ts">
import SEO from "$lib/components/SEO.svelte";
import Header from "$lib/parts/Header.svelte";
import Section from "$lib/parts/Section.svelte";
import Progress from "$lib/components/Progress.svelte";
import type { ResourceMetadata } from "$lib/utils/fetch-data";
import Transition from "$lib/components/Transition.svelte";

export let posts: Array<ResourceMetadata>;
export let projects: Array<ResourceMetadata>;
export let url: string;
</script>
