<style>
.post {
  max-width: 1080px;
  padding: 2rem;
  margin: 0 auto;
  color: #3a181a;
}

.post__title {
  font-family: "PT Sans", sans-serif;
  font-size: 2rem;
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
  margin: 1rem auto 2rem;
  background-color: #ff4851;
}

.post__content {
  max-width: 80ch;
  margin: 0 auto;
  font-size: 1.125rem;
  font-family: "PT Sans", sans-serif;
}

:global(.post__content p) {
  line-height: 2rem;
  font-size: 1.25rem;
}

:global(.post__content p) {
  margin: 0.5rem 0;
}

:global(.post__content h1) {
  font-size: 2rem;
  line-height: 3.5rem;
  border-bottom: 0.125rem #ff4851 solid;
  margin: 0.25rem 0;
}

:global(.post__content h2) {
  line-height: 3rem;
  font-size: 1.625rem;
  margin: 0.25rem 0;
}

:global(.post__content h3) {
  font-size: 1.5rem;
  line-height: 2.25rem;
  border-left: 0.25rem #ff4851 solid;
  padding-left: 0.5rem;
  margin: 0.25rem 0;
}

:global(.post__content h2::before) {
  content: "# ";
  color: #ff4851;
}

:global(.post__content img) {
  width: 100%;
}

:global(.post__content pre) {
  border-radius: 0.5rem;
  margin: 0.5rem 0;
}

:global(.post__content a) {
  position: relative;
  display: inline-block;
  color: #ff4851;
  text-decoration: none;
  margin: 0 0.125rem;
  transition: all ease-out 0.2s;
}

:global(.post__content a:hover) {
  color: #3a181a;
}

:global(.post__content a::before) {
  position: absolute;
  content: "";
  bottom: 0;
  left: -0.25rem;
  right: -0.25rem;
  top: 0;
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
  background-color: #e4e4e4;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}

:global(.post__content pre code) {
  background-color: #1d2021;
  padding: 0;
  border-radius: 0;
  font-size: 1rem;
}

:global(.post__content ul) {
  margin: 1rem 0;
  list-style-position: inside;
}

:global(.post__content ul li) {
  font-size: 1.25rem;
  line-height: 2rem;
}

a {
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
  <div class="post__content">
    <slot />
  </div>
</section>

<script context="module">
import Code from "../components/Code.svelte"
</script>

<script>
import SEO from "../components/SEO.svelte"
import Navbar from "../components/Navbar.svelte"
import Footer from "../components/Footer.svelte"
import dayjs from "dayjs"
import data from "../site-data"
export let title, date

const posts = __POSTS__
const currentPost = posts.filter(post => post.title === title)[0]
</script>
