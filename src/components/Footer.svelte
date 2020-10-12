<style>
footer {
  margin-top: 3rem;
  border-top: 0.125rem #eaeaea solid;
  font-family: "Roboto Condensed", sans-serif;
  text-align: center;
  padding: 1rem;
}

p {
  line-height: 1.5rem;
}
a {
  text-decoration: none;
}
.sapper {
  color: #ff3e00;
}
.vercel {
  color: #2f6ef3;
}
.github {
  color: #8351e6;
}
.elianiva {
  color: #ff4851;
}

.icons {
  margin: 0 auto 0.5rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  max-width: 220px;
}

.icons a {
  color: #121212;
  transition: color ease-out 0.2s;
}
.icons a:hover {
  color: #ff4851;
}

.last-commit {
  font-size: 0.75rem;
  color: #b0b0b0;
}
</style>

<footer>
  <div class="icons">
    <a href="mailto:dicha.arkana03@gmail.com">
      <Email height="1.5rem" width="1.5rem" />
    </a>
    <a href="https://github.com/elianiva">
      <Github height="1.5rem" width="1.5rem" />
    </a>
    <a href="https://twitter/elianiva_">
      <Twitter height="1.5rem" width="1.5rem" />
    </a>
    <a href="https://elianiva.github.io">
      <RSS height="1.5rem" width="1.5rem" />
    </a>
  </div>
  <p>
    Powered by
    <a class="sapper" href="https://sapper.dev">Sapper</a>
    and
    <a class="vercel" href="https://vercel.app">Vercel</a>
    • Source code is available on
    <a class="github" href="https://github.com/elianiva/elianiva.me">Github</a>
  </p>
  <p>
    Copyright &copy; 2020
    <a class="elianiva" href="https://github.com/elianiva">Elianiva</a>
  </p>
  <span class="last-commit">{lastCommit}</span>
</footer>

<script>
import Email from "../icons/email.svg"
import Github from "../icons/github.svg"
import Twitter from "../icons/twitter.svg"
import RSS from "../icons/rss.svg"

const lastCommit = "2d82f7703009bedccc18dafb0fee7d7a92bcc778"
</script>
