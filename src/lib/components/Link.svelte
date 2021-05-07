<style>
.link {
  position: relative;
  display: inline-block;
  color: var(--color-main-accent);
  text-decoration: none;
  transition: all ease-out 0.2s;
}

.link::before {
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

.link:hover::before {
  transform: scale3d(1, 0.1, 1);
}
</style>

<a class="link" {href} rel="norel noreferrer" target={blank ? "_blank" : ""}>
  <slot />
</a>

<script lang="ts">
export let href: string;
export let blank: boolean = true;
</script>
