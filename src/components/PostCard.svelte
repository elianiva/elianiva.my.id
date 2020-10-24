<style>
.card {
  overflow: hidden;
  border: 0.0625rem #e4e4e4 solid;
  border-radius: 0.25rem;
  text-align: left;
  background-color: #ffffff;
  z-index: 2;
}

.card__details {
  color: #292021;
  text-decoration: none;
  padding: 1rem;
  display: grid;
  grid-template-rows: 3.5rem 2rem 5.5rem 1fr;
  transition: all ease-out 0.2s;
}

.card__title {
  font-family: "Overpass", sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.75rem;
  text-transform: capitalize;
}

.card__desc {
  border-top: 0.0625rem #e4e4e4 solid;
  font-family: "Open Sans", sans-serif;
  line-height: 1.5rem;
  color: #696969;
  margin-top: 0.25rem;
  padding-top: 0.5rem;
}

.card__date {
  font-family: "Overpass", sans-serif;
  display: flex;
  align-items: center;
  justify-self: start;
  font-size: 0.8rem;
  gap: 0.25rem;
  color: #696969;
  border-radius: 0.25rem;
}

.card__tags {
  display: flex;
  gap: 0.75rem;
}

.card__tag {
  /* background-color: #ff4851; */
  font-family: "Overpass", sans-serif;
  font-weight: 600;
  color: #292021;
  font-size: 0.8rem;
  text-decoration: none;
  gap: 0.5rem;
  padding: 0.5rem 0 0;
  border-radius: 1rem;
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
  width: 0.5rem;
  height: 0.5rem;
}

@media only screen and (min-width: 480px) {
  .card__details:hover {
    color: #ff4851;
  }
}
</style>

<div class="card">
  <a rel="prefetch" href={href} class="card__details">
    <span class="card__title">{title}</span>
    <div class="card__date">
      <Calendar class="card__icon" />
      <span>{dayjs(date).format('DD MMMM YYYY')}</span>
    </div>
    <p class="card__desc">{desc}</p>
    <div class="card__tags">
      {#each tags as tag}<span class="card__tag">{tag}</span>{/each}
    </div>
  </a>
</div>

<script>
import Calendar from "../icons/calendar.svg"
import dayjs from "dayjs"
export let title, desc, href, date, tags
</script>
