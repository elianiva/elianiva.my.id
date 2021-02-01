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
  margin: 0 0 1rem;
}

.about__heading:not(:first-child) {
  margin-top: 2rem;
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
  line-height: 2em;
}

.about__details {
  margin: 1rem 0;
  font-family: "Open Sans", sans-serif;
}

.about__summary {
  color: var(--color-main-text);
  transition: color ease-out 0.2s;
  font-size: 1.125rem;
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
  color: var(--color-alt-text);
}
</style>

<SEO title="About" />

<section class="about">
  <section class="about__section">
    <h1 class="about__heading">About Me</h1>
    <p class="about__text">
      Hi there! I'm Elianiva. My online alias was taken from my middle name
      without the first and last letter. My name is Dicha Zelianivan Arkana. I'm
      a 17 y/o Asian boi who loves to build websites (or any software related
      things at this point) and contribute to any open source projects that I
      like.
    </p>
    <p class="about__text">
      I've been learning web development since Q3 2019. I know HTML, CSS, and
      JS/TS and all that jazz quite well. Currently interested on learning lower
      level language like Rust. I also quite like Lua since I use Neovim and
      AwesomeWM.
    </p>
    <p class="about__text">
      I was born and raised in Indonesia. I can speak Indonesian natively
      <span class="about__paren">(obviously)</span>, and English quite fluently.
      I am currently learning Japanese because I want to be able to speak a
      language that uses a different writing system. Also, I want to try to live
      abroad in the future.
    </p>
    <p class="about__text">
      If you want to reach me then feel free to hit me up on
      <a
        class="about__link"
        href="https://twitter.com/@elianiva_"
        target="_blank"
        rel="norel noreferrer">Twitter</a
      >
      or Discord @elianiva#1558. I rarely checked Twitter and only use it for Vtuber
      or Art related stuff. I became more active on Discord lately though, so that'd
      be a better option to reach me out. Or you can just
      <a
        class="about__link"
        href="mailto:dicha.arkana03@gmail.com"
        target="_blank"
        rel="norel noreferrer">email me</a
      >, I check my email quite often.
    </p>
    <details class="about__details">
      <summary class="about__summary">
        Fun fact about me (click this if you really want to know me ;)
      </summary>
      <p class="about__text" style="margin-top: 1rem;" transition:fade>
        I'm that guy who easily gets obsessed with something that I found
        interesting. One of them is
        <a
          class="about__link"
          target="_blank"
          rel="norel noreferrer"
          href="https://www.youtube.com/user/BABYMETALofficial">Babymetal</a
        >, I found them out around March 2020 and got instantly obsessed with
        them. They are the main reason why I decided to learn Japanese and
        appreciate Japanese culture.
      </p>
      <p class="about__text">
        I also love an anime called Kill La Kill (as you might have known
        judging by my github profile), I took Senketsu and Junketsu colour for
        my website ツ
      </p>
      <p class="about__text">
        I also love Vtubers. Before I watch them, I said to myself "why would I
        watch some random 2D anime character streaming on Youtube?" but here I
        am, ended up watching
        <i>a lot</i>
        of vtubers on my free time. It also helped me learn Japanese a bit.
      </p>
      <p class="about__text">
        Some weird thing about me is, I don't really like to discuss stuff that
        I like with other people (not all of them, I do enjoy talking about
        anime related stuff with my friends). I don't know why, I like some
        things better if I just enjoy it myself and not talk about it with other
        people.
      </p>
    </details>
    <h1 class="about__heading">My Website</h1>
    <p class="about__text">
      I made this website mainly because I want to keep a note to myself, but I
      thought it's a good idea to make it public. I sometimes forgot stuff that
      I did. By having this website, I can just revisit what I've done in the
      past.
    </p>
    <p class="about__text">
      I use Sapper and MDSveX to build this website and it's hosted on Vercel.
      If you want more detail about my website the you might want to read
      <a
        class="about__link"
        href="{data.siteUrl}/post/i-rebuild-my-site-using-sapper">this post</a
      >
      where I explain the process of making this site.
    </p>
    <p class="about__text">
      The picture that you see on the home page is Ryuko Matoi from Kill La
      Kill. It was commissioned from
      <a
        class="about__link"
        href="https://twitter.com/enzore_"
        target="_blank"
        rel="noreferrer norel">Enzore</a
      >, such a cool artist. Do yourself a favour by checking his artworks! I
      took it from my
      <a
        class="about__link"
        href={data.github}
        target="_blank"
        rel="noreferrer norel">github pfp</a
      >
      so that might change in the future. Also, if you noticed the icon for my website,
      it's a shitty drawing of
      <a
        class="about__link"
        href="https://knowyourmeme.com/photos/709240-kill-la-kill"
        target="_blank"
        rel="noreferrer norel">derp eyed Ryuko</a
      >
      that I made a while back. I like to draw every now and then just for fun.
    </p>
    <h1 class="about__heading">My Setup</h1>
    <p class="about__text">
      My laptop is Thinkpad X220. I use Linux as my Operating System.
      <a href="https://archlinux.org" class="about__link" rel="norel noreferrer"
        >Archlinux</a
      >
      to be more specific. I've used Linux since around Q3 of 2019. I spent most
      of my time inside terminal and rest of it inside a browser or random GUI app.
      I prefer using my keyboard over my mouse everywhere if possible (except browsing
      the internet, mouse is way better)
    </p>
    <p class="about__text">
      I use a Window Manager called
      <a href="https://awesomewm.org" class="about__link" rel="norel noreferrer"
        >AwesomeWM</a
      >, such an
      <i>awesome</i>
      window manager. I also use a text editor called
      <a href="https://neovim.io" class="about__link" rel="norel noreferrer"
        >Neovim</a
      >. I've been using it fulltime since around Q4 of 2019. It's actually my
      first text editor that I feel comfortable with and do something serious
      hence I can't relate when people say "VIM has a high learning curve" :p I
      started using it when I got my first laptop. After using it for quite a
      while my config is has grown quite a lot. It is now written in Lua and is
      quite lengthy. I've written some post explaining some of my config if
      you're interested on that. Anyway, here's
      <a
        class="about__link"
        href="https://github.com/elianiva/dotfiles"
        rel="norel noreferrer"
      >
        my dotfiles
      </a>
      if you want.
    </p>
    <p class="about__text">
      Well, I guess that's about it. Thanks for visiting my website and I hope
      you found something useful from my site. Have a wonderful day! =)
    </p>
  </section>
</section>
<ProgressButton />

<script>
import { fade } from "svelte/transition"
import data from "@/site-data"
import SEO from "@/components/SEO.svelte"
import ProgressButton from "@/components/ProgressButton.svelte"
</script>
