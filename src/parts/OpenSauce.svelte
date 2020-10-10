<style lang="scss">
.sauce {
  padding: 0 1rem;
  margin: 4rem 0;
  text-align: center;

  &__title {
    position: relative;
    display: inline-block;
    font-family: "PT Sans", sans-serif;
    font-size: 2rem;
    margin-bottom: 2rem;

    &::before {
      content: "";
      position: absolute;
      bottom: -0.25rem;
      height: 0.25rem;
      left: 4rem;
      right: 4rem;
      border-radius: 0.25rem;
      background-color: #ff4851;
    }

    s {
      color: #cecece;
      font-style: italic;
      font-size: 1rem;
    }
  }

  &__desc {
    font-family: "Roboto Condensed", sans-serif;
    font-size: 1.25rem;
    line-height: 2rem;
    color: #696969;
    margin-top: -2rem;
  }
}
</style>

<section class="sauce">
  <h1 class="sauce__title">
    Cool Open
    <s>Sauce</s>
    Source Projects You Should Check
  </h1>
  {#each data as item}
    <SauceCard
      name={item.name}
      author={item.author}
      url={item.author_url}
      repo={item.repo_url}
      img={item.img}
      website={item.website}
      desc={item.desc}
    />
  {/each}
  <p class="sauce__desc">
    Of course, there are
    <i>a lot</i>
    more cool open source projects than this but I chose them because why not ツ
  </p>
</section>

<script>
import SauceCard from "../components/SauceCard.svelte"

const data = [
  {
    name: "Tinyhttp",
    author: "v1rtl",
    author_url: "https://github.com/talentlessguy",
    repo_url: "https://github.com/talentlessguy/tinyhttp",
    img: "/opensauce/tinyhttp.png",
    website: "https://tinyhttp.v1rtl.site/",
    desc:
      "Tinyhttp is a modern, lightweight and modular Express-like web framework for NodeJS. I've contributed several times to this project.",
  },
  {
    name: "Neovim",
    author: "Neovim",
    author_url: "https://github.com/neovim",
    repo_url: "https://github.com/neovim/neovim",
    img: "/opensauce/neovim.png",
    website: "https://neovim.io",
    desc:
      "Neovim is basically Vim with steroid. It's my favourite text editor, I love this text editor so much that I spent many hours configuring it.",
  },
  {
    name: "css.gg",
    author: "Astrit",
    author_url: "https://github.com/astrit",
    repo_url: "https://github.com/astrit/css.gg",
    img: "/opensauce/css.png",
    website: "https://css.gg",
    desc:
      "Icons made using CSS. I mean, how cool is that? There are 700+ icons in multiple formats for free. You should definitely check this one out!",
  },
]
</script>
