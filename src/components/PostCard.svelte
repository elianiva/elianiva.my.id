<style>
.card {
  overflow: hidden;
  border: 1px #e4e4e4 solid;
  border-radius: 0.25rem;
  text-align: left;
  background-color: #ffffff;
}
.card__img {
  position: relative;
  display: block;
  width: 100%;
  z-index: 2;
}
.card__details {
  color: #121212;
  text-decoration: none;
  padding: 1rem;
  display: grid;
  grid-template-rows: 2rem 3.5rem 5rem 1fr;
  border-top: 0.125rem #e4e4e4 solid;
  transition: all ease-out 0.2s;
}
.card__details:hover {
  color: #ff4851;
}
.card__title {
  font-family: "Roboto Condensed", sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.75rem;
}
.card__desc {
  line-height: 1.5rem;
  color: #696969;
  font-family: "Roboto", sans-serif;
}
.card__date {
  font-family: "Roboto Condensed", sans-serif;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #696969;
}

.card__tags {
  display: flex;
  gap: 0.25rem;
}

.card__tag {
  background-color: #ff4851;
  color: #ffffff;
  font-family: "Roboto", sans-serif;
  text-decoration: none;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: filter ease-out 0.2s;
  text-transform: capitalize;
}

.card__tag:hover {
  filter: brightness(0.95);
}

.card__tag::before {
  content: "# ";
  font-weight: 600;
}

:global(.card__icon) {
  width: 1.125rem;
  height: 1.125rem;
}
</style>

<div class="card">
  <Waypoint throttle="500" offset="320"><img class="card__img" src={src} alt={title} /></Waypoint>
  <a href={href} class="card__details">
    <span class="card__date">
      <Calendar class="card__icon" />
      {dayjs(date).format('DD MMMM YYYY')}
    </span>
    <span class="card__title">{title}</span>
    <p class="card__desc">{desc}</p>
    <div class="card__tags">
      {#each tags as tag}
        <a
          class="card__tag"
          target="_blank"
          rel="norel noreferrer"
          href="#"
        >{tag}</a>
      {/each}
    </div>
  </a>
</div>

<script>
import Calendar from "../icons/calendar.svg"
import Waypoint from "svelte-waypoint"
import dayjs from "dayjs"
export let title, src, desc, href, date, tags
</script>
