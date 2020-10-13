<style>
.post {
  max-width: 1080px;
  padding: 2rem;
  margin: 0 auto;
  color: #3A181A;
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

:global(.post__content  p) {
  margin-bottom: 2rem;
}

:global(.post__content h1) {
  font-size: 2rem;
  line-height: 3.5rem;
  border-bottom: 0.125rem #ff4851 solid;
  margin-bottom: 0.25rem;
}

:global(.post__content h2) {
  font-size: 1.85rem;
  line-height: 3rem;
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

:global(.post__content h2::before) {
  content: "# ";
  color: #ff4851;
}

:global(.post__content img) {
  width: 100%;
}
</style>

<section class="post">
  <h1 class="post__title">{title}</h1>
  <span class="post__date">
    Posted on
    {dayjs(date).format('dddd')},
    {dayjs(date).format('DD MMMM YYYY')}
  </span>
  <hr class="post__divider">
  <div class="post__content">
    <slot />
  </div>
</section>

<script>
import Navbar from "../components/Navbar.svelte"
import Footer from "../components/Footer.svelte"
import dayjs from "dayjs"
export let title, date
</script>
