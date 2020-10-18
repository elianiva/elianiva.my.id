<style>
.card {
  position: relative;
  display: grid;
  grid-template-columns: 2fr 2.5fr;
  gap: 2rem;
  grid-auto-flow: dense;
  text-align: left;
  margin: 0 0 4rem;
}
.card__img {
  grid-column: 1/2;
  border-radius: 0.25rem;
  overflow: hidden;
  box-shadow: 0 0.5rem 0.5rem rgba(0, 0, 0, 0.05);
}
.card__img img {
  display: block;
  width: 100%;
}
:global(.card:nth-child(even) .card__pattern) {
  position: absolute;
  color: #ff4851;
  z-index: -1;
  top: -2rem;
  right: -4rem;
  transform: rotateZ(90deg);
  width: 10rem;
}
:global(.card:nth-child(odd) .card__pattern) {
  position: absolute;
  color: #ff4851;
  z-index: -1;
  top: -2rem;
  left: -4rem;
  transform: rotateZ(-90deg);
  width: 10rem;
}
.card__content {
  position: relative;
  grid-column: 2/3;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
}
.card__title {
  position: relative;
  font-family: "Roboto Condensed", sans-serif;
  font-size: 2rem;
  color: #121212;
  text-decoration: none;
  font-weight: 600;
  transition: color ease-out 0.2s;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.card__title:hover {
  color: #ff4851;
}
.card__title::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 2rem;
  height: 0.25rem;
  background-color: #ff4851;
}
.card__source {
  font-family: "Roboto Condensed", sans-serif;
  font-size: 1.25rem;
  color: #121212;
  text-decoration: none;
}
.card__desc {
  font-family: "Roboto", sans-serif;
  font-size: 1.125rem;
  line-height: 1.75rem;
  color: #696969;
  text-decoration: none;
}
.card__source {
  margin-top: 0.5rem;
}
.card__author,
.card__repo {
  padding: 0.25rem 0.5rem;
  background-color: #efefef;
  border-radius: 0.25rem;
  color: #121212;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  transition: filter ease-out 0.2s;
}
.card__author:hover,
.card__repo:hover {
  filter: brightness(0.95);
}
.card:nth-child(even) {
  grid-template-columns: 2.5fr 2fr;
}
.card:nth-child(even) .card__img {
  grid-column: 2/3;
}
.card:nth-child(even) .card__content {
  grid-column: 1/2;
}
:global(.img__thumb) {
  display: block;
}
@media only screen and (max-width: 960px) {
  .card {
    grid-template-columns: 1fr;
  }
  .card__img {
    grid-column: 1/2;
  }
  .card__content {
    grid-column: 1/2;
    margin-top: 1rem;
  }
  .card:nth-child(even) {
    grid-template-columns: 1fr;
  }
  .card:nth-child(even) .card__img {
    grid-column: 1/2;
  }
  .card:nth-child(even) .card__content {
    grid-column: 1/2;
  }
}
</style>

<div class="card">
  <Pattern class="card__pattern" />
  <div class="card__img">
    <Waypoint throttle="500" offset="320">
      <img src={img} alt={name} />
    </Waypoint>
  </div>
  <div class="card__content">
    <a
      class="card__title"
      href={website}
      target="_blank"
      rel="norel noreferrer"
    >{name}
      <Star color="#ff4851" />
    </a>
    <div class="card__source">
      <a
        class="card__author"
        href={url}
        target="_blank"
        rel="norel noreferrer"
      ><User class="card__icon" />{author}</a>
      <a
        class="card__repo"
        href={repo}
        target="_blank"
        rel="norel noreferrer"
      ><Github class="card__icon" />Repository</a>
    </div>
    <span class="card__desc">{desc}</span>
  </div>
</div>

<script>
import Pattern from "../icons/pattern.svg"
import User from "../icons/user.svg"
import Star from "../icons/star.svg"
import Github from "../icons/github.svg"
import Waypoint from "svelte-waypoint"
export let name, author, url, repo, img, website, desc
</script>
