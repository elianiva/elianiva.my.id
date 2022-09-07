<SEO title="Home" />

<Transition {url}>
	<main class="max-w-[1080px] my-0 mx-auto pt-8 px-4 pb-0 z-[2]">
		<Header />
		<Section title="Recent Posts" data={posts} btnText="More Posts" url="/post" type="posts" />
		<Section title="Recent Projects" data={projects} btnText="More Projects" url="/project" type="projects" />
	</main>
</Transition>
<Progress />

<script lang="ts">
import SEO from "$lib/components/SEO.svelte";
import Header from "$lib/parts/Header.svelte";
import Section from "$lib/parts/Section.svelte";
import Progress from "$lib/components/Progress.svelte";
import Transition from "$lib/components/Transition.svelte";
import type { PageData } from "./$types";

export let data: PageData;
$: ({ posts, projects, url } = data);
</script>
