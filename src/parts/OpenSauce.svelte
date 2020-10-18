<style>
.sauce {
  margin: 4rem 0 0;
  text-align: center;
}
.sauce__title {
  position: relative;
  display: inline-block;
  font-family: "Roboto", sans-serif;
  font-size: 2rem;
  margin-bottom: 4rem;
}
.sauce__title::before {
  content: "";
  position: absolute;
  bottom: -0.25rem;
  height: 0.25rem;
  left: 4rem;
  right: 4rem;
  border-radius: 0.25rem;
  background-color: #ff4851;
}
.sauce__desc {
  font-family: "Roboto Condensed", sans-serif;
  font-size: 1.25rem;
  line-height: 2rem;
  color: #696969;
  margin-top: 1rem;
}
.sauce hr {
  margin-top: -2rem;
}
</style>

<section class="sauce">
  <h1 class="sauce__title">Cool Open Source Projects You Should Check</h1>
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
  <hr />
  <p class="sauce__desc">
    Of course, there are
    <i>a lot</i>
    more cool open source projects than this but I chose them because why not ツ
  </p>
  <p class="sauce__desc">
    To be fair, I chose them because they has less than 1k stars and in my
    opinion they deserve more than that. Do yourself a favor and give them star
    on Github :D
  </p>
</section>

<script>
import SauceCard from "../components/SauceCard.svelte"

const data = [
  {
    name: "tinyhttp",
    author: "v1rtl",
    author_url: "https://github.com/talentlessguy",
    repo_url: "https://github.com/talentlessguy/tinyhttp",
    img: "opensauce/tinyhttp.png",
    website: "https://tinyhttp.v1rtl.site/",
    desc:
      "Tinyhttp is a modern, lightweight and modular Express-like web framework for NodeJS. I've contributed several times to this project.",
  },
  {
    name: "MDsveX",
    author: "pngwn",
    author_url: "https://github.com/pngwn",
    repo_url: "https://github.com/pngwn/MDsveX",
    img: "opensauce/mdsvex.png",
    website: "https://mdsvex.com",
    desc:
      "Just like MDX, but for Svelte. Simplicity of markdown combined with the power of Svelte. Without this tech, my website wouldn't be possible.",
  },
  {
    name: "yrv",
    author: "pateketrueke",
    author_url: "https://github.com/pateketrueke",
    repo_url: "https://github.com/pateketrueke/yrv",
    img: "opensauce/yrv.png",
    website: "https://github.com/pateketrueke/yrv",
    desc:
      "yrv is one of routing library for Svelte. It looks quite similar to react-router. If you're coming from React to Svelte like I do, try this one out!",
  },
]
</script>
