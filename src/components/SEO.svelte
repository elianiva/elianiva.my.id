<svelte:head>
  <title>{title} | {siteName}</title>
  <link rel="canonical" href={siteUrl} />
  <meta name="description" content={desc} />
  <meta name="keywords" content={keywords.join(',').toLowerCase()} />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content={isPost ? 'blog' : 'website'} />
  <meta property="og:url" content="{siteUrl}{$page.path}" />
  <meta property="og:title" content={title || siteName} />
  <meta property="og:description" content={desc} />
  <meta property="og:image" content={thumbnail || 'https://avatars3.githubusercontent.com/u/51877647?s=240&v=4'} />

  <!-- Twitter -->
  <meta
    property="twitter:card"
    content={thumbnail ? 'summary_large_image' : 'summary'}
  />
  <meta property="twitter:url" content="{siteUrl}{$page.path}" />
  <meta property="twitter:title" content={title || siteName} />
  <meta property="twitter:description" content={desc} />
  {#if thumbnail}
    <meta property="twitter:image" content={thumbnail} />
  {/if}
</svelte:head>

<script>
import { stores } from "@sapper/app"
import data from "@/site-data"

const { page } = stores()

const { siteName, siteUrl } = data

export let title
export let isPost = false
export let thumbnail = false
export let desc = data.desc
export let keywords = data.keywords
</script>
