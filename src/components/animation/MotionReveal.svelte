<script context="module" lang="ts">
export type Variant =
	| "reveal"
	| "fade"
	| "slide-up"
	| "blur-in"
	| "custom"
	| "float";
</script>

<script lang="ts">
	import { onMount } from "svelte";
	import { inView, animate } from "motion";
	import type { AnimationPlaybackControlsWithThen } from "motion";
	import type { CSSProperty } from "astro/types";

	export let as: keyof HTMLElementTagNameMap = "section";

	export let variant: Variant = "reveal";
	export let from: Record<string, CSSProperty> | undefined = undefined;
	export let to: Record<string, CSSProperty> | undefined = undefined;

	export let y = 16;
	export let blur = 8;
	export let duration = 0.7;
	export let ease: any = [0.34, 1.8, 0.64, 1]; // squishSpring for bouncy feel
	export let delay: number = 0;

	export let amount: number | "some" | "all" = 0.5;

	export let group = false;
	export let groupSelector = ":scope > *";
	export let stagger = 0.08; // Increased for more playful timing

	export let className: string = "";

	let el: HTMLElement;
	let mounted = false;

	function computeFrom() {
		if (variant === "custom" && from) return from;

		if (variant === "float") {
			return {
				opacity: 0,
				transform: "translateY(20px)",
			};
		}

		return {
			opacity: 0,
			transform: `translateY(${y}px)`,
			filter: `blur(${blur}px)`,
		};
	}

	function computeTo() {
		if (variant === "custom" && to) return to;

		if (variant === "float") {
			return {
				opacity: 1,
				y: 0,
			};
		}

		return { opacity: 1, y: 0, filter: "blur(0px)" };
	}

	function applyInitialStyles(node: HTMLElement) {
		const f = computeFrom();
		if (f.opacity !== undefined) {
			node.style.opacity = String(f.opacity);
		}
		if (f.transform !== undefined) {
			node.style.transform = String(f.transform);
		}
		if (f.filter !== undefined) {
			node.style.filter = String(f.filter);
		}
		node.style.willChange = "transform, opacity, filter";
	}

	function setEndStyles(node: HTMLElement) {
		node.style.opacity = "1";
		node.style.transform = "none";
		node.style.filter = "none";
		node.style.willChange = "auto";
	}

	onMount(() => {
		mounted = true;

		const targets: HTMLElement[] = group
			? Array.from(el.querySelectorAll<HTMLElement>(groupSelector))
			: [el];

		const prefersReduced = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		if (prefersReduced) {
			targets.forEach(setEndStyles);
			return;
		}

		// Only apply initial styles if JS is enabled
		if (document.documentElement.hasAttribute('data-js-enabled')) {
			targets.forEach(applyInitialStyles);
		}

		const endKeyframes = computeTo();
		const stop = inView(
			el,
			() => {
				let controls: AnimationPlaybackControlsWithThen;

				if (group && targets.length > 0) {
					controls = animate(targets, endKeyframes, {
						duration,
						ease,
						delay: (i) => delay + i * stagger,
					});
				} else {
					controls = animate(el, endKeyframes, {
						duration,
						ease,
						delay,
					});
				}

				return () => {
					if (controls && typeof controls.stop === "function") {
						controls.stop();
					}
				};
			},
			{ amount },
		);

		return () => {
			stop();
		};
	});
</script>

<svelte:element
		this={as}
		bind:this={el}
		class={className}
		data-motion-reveal={mounted ? "true" : "false"}
		{...$$restProps}
	>
		<slot />
	</svelte:element>
