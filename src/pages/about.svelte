<style>
.about {
  max-width: 1080px;
  margin: 0 auto;
  color: var(--color-main-text);
  padding: 2rem 1rem 0;
}

.about__section {
  max-width: 80ch;
  margin: auto;
}

.about__section p + p {
  margin-top: 1.5rem;
}

.about__heading {
  position: relative;
  font-family: "Overpass", sans-serif;
  color: var(--color-main-text);
  font-size: 2rem;
  margin: 2rem 0 1rem;
}

.about__heading::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 0.125rem;
  background-image: linear-gradient(
    to right,
    var(--color-main-accent),
    rgba(0, 0, 0, 0)
  );
}

.about__text {
  font-family: "Open Sans", sans-serif;
  color: var(--color-main-text);
  font-size: 1.125rem;
  line-height: 2rem;
}

.about__details {
  margin: 1rem 0;
  font-family: "Open Sans", sans-serif;
}

.about__summary {
  color: var(--color-main-text);
  transition: color ease-out 0.2s;
  cursor: pointer;
  outline: none;
}

.about__summary:hover {
  color: var(--color-main-accent);
}

.about__link {
  position: relative;
  display: inline-block;
  color: var(--color-main-accent);
  text-decoration: none;
  transition: all ease-out 0.2s;
}

.about__link::before {
  position: absolute;
  content: "";
  bottom: 0.25rem;
  left: -0.25rem;
  right: -0.25rem;
  top: 0.25rem;
  transform: scale3d(0, 0.1, 1);
  transform-origin: 0 100%;
  background-image: linear-gradient(
    to right,
    var(--color-main-accent),
    rgba(0, 0, 0, 0)
  );
  z-index: -1;
  transition: transform ease-out 0.2s;
}

.about__link:hover::before {
  transform: scale3d(1, 0.1, 1);
}

.about__paren {
  color: var(--color-thin);
}

.lmao {
  color: var(--color-main-text);
  opacity: 0.15;
}
</style>

<SEO title="About" />

<section class="about">
  <section class="about__section">
    <h1 class="about__heading">About Me</h1>
    <p class="about__text">
      Hi! My name is Dicha Zelianivan Arkana. I go on the internet as Elianiva.
      Yup, my usename is
      <i>part</i>
      of my middle name and I'm proud of it ツ. I'm a 16 y/o asian boi who loves
      to build website and contribute to any open source projects that I like.
      My biggest goal in my life is to make an impact to open source community
      so even if I die, people can still enjoy what I've made when I was alive
      =).
    </p>
    <p class="about__text">
      I've been learning web development for about a year and a half. I
      understand the basic of HTML, CSS, and JS quite well. Currently learning
      React/Next, Svelte/Sapper, and Typescript. Besides webdev stuff, I also
      learn Rust and Lua. Though, I'm still at the very early stage of Rust and
      only use Lua for Neovim and AwesomeWM.
    </p>
    <p class="about__text">
      I live in a beautiful country called Indonesia. I can speak Indonesian
      natively
      <span class="about__paren">(obviously)</span>, Javanese
      <span class="about__paren">(kinda)</span>
      natively, and English fluently. I am currently learning Japanese because I
      want to be able to speak a language that uses different writing system.
      <span class="lmao">and watch anime with no subtitle lol</span>
    </p>
    <details class="about__details">
      <summary class="about__summary">Fun fact about me</summary>
      <p class="about__text" style="margin-top: 1rem;" transition:fade>
        I'm easily obsessed with one thing that I just found and like. For
        example, I found out
        <a
          class="about__link"
          target="_blank"
          rel="norel noreferrer"
          href="https://www.youtube.com/user/BABYMETALofficial"
        >Babymetal</a>
        (check them out btw ツ) few months ago and got obsessed with them. They
        are the main reason why I decided to learn Japanese and appreciate
        Japanese culture. The other example is Kill La Kill. I love this anime
        <span class="about__paren">(no, not because 2d anime tiddies)</span>
        so much that I want to learn to draw so I can draw Ryuko myself xD. My
        website colour is heavily inspired from Senketsu (dark mode) and
        Junketsu (light mode).
      </p>
    </details>
    <h1 class="about__heading">About My Website</h1>
    <p class="about__text">
      I made this website so I can post stuff that I learned and share it to the
      others. I also use this as a note to myself because I sometimes forgot
      stuff that I did in the past. By having this website, I can just revisit
      what I've done in the past.
    </p>
    <p class="about__text">
      The picture that you see on the home page is Ryuko Matoi from Kill La
      Kill. It was made by
      <a
        class="about__link"
        href="https://www.facebook.com/enjor.s"
        target="_blank"
        rel="noreferrer norel"
      >Enzore</a>, such an awesome artist. Do yourself a favour by checking his
      artworks ツ. I don't want to use a picture of myself like most people do
      because, yeah, no, bad idea. Don't want random people on the internet see
      my real face.
    </p>
    <h1 class="about__heading">About My Setup</h1>
    <p class="about__text">
      I use Linux as my Operating System.
      <a
        href="https://archlinux.org"
        class="about__link"
        rel="norel noreferrer"
      >Archlinux</a>
      is the distribution that I use. I've used Linux for about a year. I also
      understand how to use CLI because I spent most of my time inside terminal
      and rest of it inside a browser.
    </p>
    <p class="about__text">
      I use a Window Maager called
      <a
        href="https://awesomewm.org"
        class="about__link"
        rel="norel noreferrer"
      >AwesomeWM</a>, such an
      <i>awesome</i>
      window manager. You can read
      <a
        href="{data.siteUrl}/post/full-explanation-of-my-dotfiles"
        class="about__link"
        rel="norel noreferrer"
      >this post</a>
      where I explained about my dotfiles in detail. I also use a text editor
      called
      <a
        href="https://neovim.io"
        class="about__link"
        rel="norel noreferrer"
      >Neovim</a>. My Neovim config is written in lua and is quite lengthy so I
      also made a
      <a
        href="https://neovim.io"
        class="about__link"
        rel="norel noreferrer"
      >post</a>
      about my neovim config to make it easier if people want to steal something
      from my config.
    </p>
    <p class="about__text">
      Well, I guess that's about it. Thanks for visiting my website and I hope
      you found something useful from my site. Have a good day!
    </p>
  </section>
</section>

<script>
import { onMount } from "svelte"
import { fade } from "svelte/transition"
import data from "@/site-data"
import SEO from "@/components/SEO.svelte"

// use setTimeout because we need to wait
// for some time before scrolling, otherwise it would look glitchy
onMount(() => setTimeout(() => window.scrollTo(0, 0), 100))
// i gave up on this, it sometimes works and sometimes not, idk how to fix
</script>
