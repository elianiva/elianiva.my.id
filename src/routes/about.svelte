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

.about__section > p + p {
  margin-top: 1.5rem;
}

.about__heading {
  position: relative;
  font-family: "Overpass", sans-serif;
  color: var(--color-main-text);
  font-size: 1.75rem;
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

.about__paren {
  color: var(--color-alt-text);
}

.about__list {
  list-style-position: inside;
}

.list__item {
  padding-bottom: 1rem;
}

.item__title {
  font-size: 1.125rem;
  font-weight: 600;
  font-family: "Overpass", sans-serif;
}

.item__content {
  font-family: "Open Sans", sans-serif;
  color: var(--color-main-text);
  font-size: 1rem;
  line-height: 1.75em;
  padding-left: 1.5rem;
}

code {
  font-family: "JetBrains Mono", monospace;
  color: var(--color-main-accent);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  background-color: var(--color-alt-bg);
  box-shadow: 0 0 0.25em rgba(0, 0, 0, 0.1);
}

.lt {
  text-decoration: line-through;
  color: var(--color-alt-text);
}
</style>

<SEO title="About" />

<section class="about">
  <section class="about__section">
    <h1 class="about__heading">About Me</h1>
    <p class="about__text">
      Hi there! I'm Elianiva. My online alias was taken from my middle name
      without the first and the last letter. My name is Dicha Zelianivan Arkana,
      in case you're curious. I'm a 17 y/o pleb who loves to build websites (or
      any software related things at this point :) and contribute to open source
      projects as many as I can to make other people happy!
    </p>
    <h1 class="about__heading">Background</h1>
    <p class="about__text">
      I was born in Indonesia, Java island to be more precise. I've been always
      interested on technology since I was around 6 years old. I had my first PC
      when I was 7 or 8, but I thought it was a "machine to play games" so I
      only use it just for that.
    </p>
    <p class="about__text">
      A few years passed, my interest in technology decreased until I reach 13,
      I like to tinker around with my phone back then. A year later, a friend of
      mine told me to check out how to build a website using HTML. I got curious
      and try to learn many web related things. After a while, I, for some
      reason, stopped learning and got addicted to a mobile game which is
      unfortunate now that I think about it.
    </p>
    <p class="about__text">
      When I was turning to 16, I'm starting to think more about my future, so I
      stopped playing games. I don't find game is fun to play anymore, and I
      don't get any benefit from it. Now, I'm trying to contribute as much as I
      can to open source projects to make other people happy and improve my
      skills that could be useful someday in the future.
    </p>
    <h1 class="about__heading">Spoken Languages</h1>
    <p class="about__text">
      I can speak Indonesian, Javanese
      <span class="about__paren">(since I'm a Javanese :)</span>
      and English quite fluently. I am currently learning Japanese because I want
      to be able to speak a language that uses a different writing system. I'm also
      trying to learn some passive Arabic, as long as I understand what I read or
      hear in Arabic, I'd be more than satisfied.
    </p>
    <h1 class="about__heading">Programming Languages</h1>
    <p class="about__text" style="margin-bottom: 1rem">
      Here are some programming (and markup) languages that I know. I'm trying
      not to limit myself to <em>one</em> language because not every problems can
      be solved using that language, in my opinion.
    </p>
    <ul class="about__list">
      <li class="list__item">
        <span class="item__title">HTML/CSS</span>
        <p class="item__content">
          I'd consider myself to be quite proficient in both of these languages.
          I really like CSS as a styling language, but not so much with HTML.
          <A href="https://svelteception.vercel.app">Svelteception</A>
          is one of my website where I heavily use HTML/CSS and I'm quite proud of
          it. I basically took random UI designs that I found on the internet (mostly
          from Dribbble) and implemented it. It's only meant for the look though,
          it's not functional.
        </p>
      </li>
      <li class="list__item">
        <span class="item__title">Javascript/Typescript</span>
        <p class="item__content">
          Javascript is the first programming language I learned when I was
          introduced to programming. (technically second, but I think you can
          guess why :) Nowadays I prefer Typescript because I prefer statically
          typed language for most cases. It provides a better developer
          experience in my opinion.
        </p>
        <p class="item__content">
          I would say that I'm quite good at it, I've made several apps in the
          past. Either fullstack or just the frontend. My goto frontend
          framework is usually Svelte or React, but I'm trying not to limit
          myself to a certain framework, I like learning new things!
        </p>
      </li>
      <li class="list__item">
        <span class="item__title">Lua</span>
        <p class="item__content">
          Lua is a language that I thought I would never learned. I mainly use
          it for my text editor, which is
          <A href="https://neovim.io">Neovim</A>
          and my window manager
          <A href="https://awesomewm.org/">AwesomeWM</A> . I think it's a nice, small
          and a very simple language, it's meant to be easily embedable so it doesn't
          have a big stdlib like Python.
        </p>
      </li>
      <li class="list__item">
        <span class="item__title">Go/Rust</span>
        <p class="item__content">
          I'm trying to learn both of these languages, but I'm leaning towards
          Rust. It's an interesting language IMO. I made a Telegram Bot using
          Golang and a scraper using Rust just for fun. One of my dream is being
          able to have a dayjob using either of these languages.
        </p>
      </li>
      <li class="list__item">
        <span class="item__title">Java</span>
        <p class="item__content">
          I only used Java several times. One of my
          <A href="https://TODO">final school assignment</A> is to make a desktop
          app using Java. I'm not going to lie, I don't really enjoy writing Java
          as much as I do with other languages. Maybe it's due to the fact that I
          don't really like OOP in the first place, and the fact that you could have
          a <code>deeply/nested/modules/like/this/to/get/to/one/file.java</code>
          and you have to
          <code
            >import pkg.name.deeply.nested.modules.like.this.to.get.to.one.file</code
          >, not to mention you <em>have</em> to name the class the same as the filename.
        </p>
      </li>
    </ul>
    <p class="about__text" style="margin-bottom: 1rem">
      ..and here are some languages that I think is unique, and will possibly
      try to learn in the future.
    </p>
    <ul class="about__list">
      <li class="list__item">
        <span class="item__title">Clojure</span>
        <p class="item__content">
          I'm interested on learning Clojure or any Lisp-family languages in the
          future because I quite like
          <A href="https://en.wikipedia.org/wiki/S-expression">S-expression</A>.
          The syntax is unique and simple, it gives me happiness when I try to
          learn it, let alone use it! But for now, I don't have a strong reason
          to learn it thoroughly and I have a limit to how many things I can
          learn at the same time :)
        </p>
      </li>
      <li class="list__item">
        <span class="item__title">Haskell</span>
        <p class="item__content">
          Haskell is like a complete different world to me for now. Everytime I
          met someone who knows Haskell, they always speak about how great it
          is. This language reminds me of math, which I'm interested in. I
          learned it a bit, I haven't learn this language thoroughly because of
          the same reason I've mentioned before.
        </p>
      </li>
    </ul>
    <h1 class="about__heading">Social</h1>
    <p class="about__text">
      If you want to reach me then feel free to hit me up on
      <A href="https://twitter.com/@elianiva_">Twitter</A>
      or Discord @elianiva#1558. I barely checked Twitter, only use it for Vtuber
      or Art related stuff. A better option is my Discord since I'm quite active
      on that platform. You can also
      <A href="mailto:dicha.arkana03@gmail.com">email me</A>
      if you prefer, I check my email quite often :)
    </p>
    <h1 class="about__heading">Why I Made This Website.</h1>
    <p class="about__text">
      Originally, I made this website as a place to keep my "notes", but I
      thought that wouldn't be useful unless I share it with other people. I
      also think it's cool to have your own website where you can do
      <em>whatever</em> you want with it. If you want to check my portfolio,
      either check on the <A href="/project" blank={false}>projects</A> page or
      <A href="https://github.com/elianiva/">my github profile.</A>
    </p>
    <p class="about__text">
      I use
      <A href="https://sapper.svelte.dev">
        <span class="lt">Sapper</span>
      </A>
      <A href="https://kit.svelte.dev">Svete-Kit</A> and
      <A href="https://mdsvex.pngwn.io/">MDSveX</A>
      to build this website and it's hosted on Vercel. If you want more detail about
      my website the you might want to read
      <A href="{data.siteUrl}/post/i-rebuild-my-site-using-sapper">this post</A>
      or <A href="TODO">this updated post</A> where I explain the process of making
      (or rather,
      <em>rebuilding</em>) this site.
    </p>
    <h1 class="about__heading">My Setup</h1>
    <p class="about__text">
      My laptop is Thinkpad X220. I use Linux as my main Operating System.
      <A href="https://archlinux.org">Archlinux</A>
      to be more specific. I've used Linux since around late 2019. I spend most of
      my time inside the terminal which is
      <A href="https://github.com/kovidgoyal/kitty">Kitty</A> and the browser. I
      prefer using my keyboard over my mouse everywhere if possible (except browsing
      the internet, mouse is inherently better)
    </p>
    <p class="about__text">
      I use a Window Manager called
      <A href="https://awesomewm.org">AwesomeWM</A>, such an
      <i>awesome</i>
      window manager. I also use a text editor called
      <A href="https://neovim.io">Neovim</A>
      I've been using it fulltime since late 2019. It's actually my first text editor
      that I feel comfortable with. I started using it when I got my first laptop
      and got serious into programming. Anyway, here's
      <A href="https://github.com/elianiva/dotfiles">my dotfiles</A>
      if you want :)
    </p>
    <p class="about__text">
      Well, I guess that's about it. Thanks for visiting my website and I hope
      you found something useful from my site. Have a wonderful day! ツ
    </p>
  </section>
</section>
<ProgressButton />

<script>
import data from "$lib/data/site"
import SEO from "$lib/components/SEO.svelte"
import A from "$lib/components/Link.svelte"
import ProgressButton from "$lib/components/ProgressButton.svelte"
</script>
