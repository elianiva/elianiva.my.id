<style>
:global(html) {
  scroll-behavior: smooth
}

.post {
  max-width: 1080px;
  padding: 1rem;
  margin: 0 auto;
  color: #292021;
}

.post__title {
  font-family: "Roboto Condensed", sans-serif;
  font-size: 2.5rem;
  margin-top: 2rem;
  text-transform: uppercase;
  max-width: 30ch;
  margin: 0 auto;
  text-align: center;
}

.post__date {
  font-family: "Roboto Condensed", sans-serif;
  text-align: center;
  display: block;
  font-size: 1.125rem;
  line-height: 2rem;
  color: #696969;
}

.post__divider {
  max-width: 10rem;
  height: 0.125rem;
  border: 0.25rem;
  margin: 0.5rem auto 1rem;
  background-color: #ff4851;
}

.post__content {
  font-family: "Roboto", sans-serif;
  max-width: 70ch;
  margin: 0 auto;
  font-size: 1.125rem;
}

:global(.post__content p) {
  line-height: 2rem;
  font-size: 1.125rem;
  /* margin: 1rem 0; */
}

:global(.post__content > * + *) {
  margin-top: 1rem;
}

:global(.post__content h1) {
  font-family: "Roboto Condensed", sans-serif;
  font-size: 2rem;
  line-height: 3.5rem;
  border-bottom: 0.125rem #ff4851 solid;
  /* margin: 0.25rem 0 0.75rem; */
}

:global(.post__content h2) {
  position: relative;
  font-family: "Roboto Condensed", sans-serif;
  line-height: 1.75rem;
  font-size: 1.625rem;
  /* margin: 0.25rem 0; */
  padding-left: 1.5rem;
}

:global(.post__content h3) {
  position: relative;
  font-family: "Roboto Condensed", sans-serif;
  font-size: 1.5rem;
  line-height: 2.25rem;
  padding-left: 0.5rem;
  padding-left: 1.5rem;
}

:global(.post__content h3::after) {
  content: "• ";
  position: absolute;
  left: 0;
  color: #ff4851;
}

:global(.post__content h2::after) {
  content: "# ";
  position: absolute;
  left: 0;
  color: #ff4851;
}

:global(.post__content img) {
  width: 100%;
}

:global(.post__content pre) {
  border-radius: 0.5rem;
  scrollbar-color: #b0b0b0 #efefef;
}

:global(.post__content pre::-webkit-scrollbar-thumb) {
  background-color: #b0b0b0;
}

:global(.post__content pre::-webkit-scrollbar) {
  background-color: #efefef;
  height: 0.5rem;
}

:global(.post__content a) {
  position: relative;
  display: inline-block;
  color: #ff4851;
  text-decoration: none;
  transition: all ease-out 0.2s;
}

:global(.post__content a:hover) {
  color: #292021;
}

:global(.post__content a::before) {
  position: absolute;
  content: "";
  bottom: 0.25rem;
  left: -0.25rem;
  right: -0.25rem;
  top: 0.25rem;
  transform: scaleY(0.1);
  background-color: rgba(255, 72, 81, 0.5);
  z-index: -1;
  transition: all ease-out 0.2s;
  transform-origin: bottom;
}

:global(.post__content a:hover::before) {
  transform: scaleY(1);
}

:global(.post__content code) {
  background-color: #f4f4f4;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}

:global(.post__content p > code::before),
:global(.post__content p > code::after) {
  content: "`"
}

:global(.post__content pre code) {
  background-color: #1d2021;
  padding: 0;
  border-radius: 0;
  font-size: 1rem;
}

:global(.post__content ul) {
  list-style-position: inside;
}

:global(.post__content ul > li) {
  font-size: 1.125rem;
  line-height: 2rem;
  padding-left: 1rem;
}

:global(.post__content ul > li p) {
  display: inline-block;
  margin: 0;
}

:global(.post__content ul > li a::before) {
  opacity: 0;
  transition: all ease-out 0.2s;
}

:global(.post__content ul > li a:hover::before) {
  opacity: 1;
}

:global(.post__content ul li > ul *) {
  font-size: 1.125rem;
}

:global(.post__content table) {
  width: 100%;
  border-radius: 0.2rem;
  overflow: hidden;
}

:global(.post__content table a) {
  transition: all ease-out 0.2s;
  font-weight: 600;
  line-height: 1.25rem;
  font-style: italic;
}

:global(.post__content table tr:nth-child(odd)) {
  background-color: #f4f4f4;
}

:global(.post__content table th) {
  background-color: #ff4851;
  color: #ffffff;
  font-size: 1.25rem;
}

:global(.post__content table th),
:global(.post__content table td) {
  padding: 0.75rem 1rem;
}

:global(.post__content blockquote p) {
  font-size: 1.5rem;
  color: #b0b0b0;
  font-style: italic;
  font-family: serif;
  margin: 1rem 0;
}

:global(.post__content blockquote p::before) {
  content: "“	";
}

:global(.post__content blockquote p::after) {
  content: " ”";
}

:global(:target:before) {
  content: "";
  display: block;
  height: 4.5rem;
  margin-top: -4.5rem;
}

@media only screen and (max-width: 480px) {
  :global(.post__content pre) {
    margin-left: -1rem !important;
    margin-right: -1rem !important;
    border-radius: 0;
  }
  :global(.post__content ul *) {
    font-size: 0.95rem !important;
  }
}
</style>

<svelte:head>
  <link
    rel="preload"
    href="/prism.css"
    as="style"
    onload="this.rel='stylesheet'"
  />
</svelte:head>

<SEO
  title={title}
  thumbnail={`${data.siteUrl}/post/${currentPost.slug}/cover.png`}
/>

<section class="post">
  <h1 class="post__title">{title}</h1>
  <span class="post__date">
    Posted on
    {dayjs(date).format('dddd')},
    {dayjs(date).format('DD MMMM YYYY')}
  </span>
  <hr class="post__divider" />
  <main class="post__content">
    <slot />
  </main>
</section>
<ProgressButton />

<script>
import { onMount } from "svelte"
import SEO from "../components/SEO.svelte"
import ProgressButton from "../components/ProgressButton.svelte"
import dayjs from "dayjs"
import data from "../site-data"
export let title, date

const posts = __POSTS__
const currentPost = posts.filter(post => post.title === title)[0]

onMount(() => {
  document.querySelectorAll("a").forEach(a => {
    if (!a.hash || !document.querySelectorAll(a.hash).length) return
    a.addEventListener("click", event => {
      event.preventDefault()
      window.location.hash = event.target.getAttribute("href")
    })
  })
})
</script>
