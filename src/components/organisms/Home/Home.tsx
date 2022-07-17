import anime, { type AnimeInstance } from "animejs";
import "./home.scss";
import { FirstName } from "./paths/FirstName";
import { LastName } from "./paths/LastName";
import { MiddleName } from "./paths/MiddleName";

export function Home() {
	function moveDownStaggered(el: HTMLDivElement) {
		const firstLetters = el.querySelectorAll(".greeting-letter.first");
		const secondLetters = el.querySelectorAll(".greeting-letter.second");

		const tl = anime.timeline({ targets: [firstLetters, secondLetters], easing: "easeOutExpo" });
		tl.add({ opacity: 0, translateY: -100, duration: 0 });
		tl.add({ targets: firstLetters, opacity: 1, translateY: 0, delay: anime.stagger(50) });
		tl.add({ opacity: 1, translateY: 0, delay: anime.stagger(50) }, "-=500");
	}

	function drawPath(el: SVGElement) {
		const paths = el.querySelectorAll("path");
		anime({
			targets: paths,
			strokeDashoffset: [anime.setDashoffset, 0],
			duration: 5000,
			delay: 2200,
			easing: "easeOutSine",
		});
	}

	function revealSummary(el: HTMLParagraphElement) {
		anime({
			targets: el,
			delay: 3500,
			opacity: 1,
			duration: 500,
			easing: "easeOutSine",
		});
	}

	function blurOut(el: HTMLDivElement, anim: AnimeInstance) {
		el.style.filter = `blur(${(anim.progress / 40) * 16}px)`;
	}

	function animateParticles(el: HTMLDivElement) {
		const crossedBoxA: HTMLDivElement = el.querySelector(".crossed-box.box-a");
		const crossedBoxB: HTMLDivElement = el.querySelector(".crossed-box.box-b");
		const crossedBoxC: HTMLDivElement = el.querySelector(".crossed-box.box-c");
		const crossedBoxD: HTMLDivElement = el.querySelector(".crossed-box.box-d");
		const linesBoxA: HTMLDivElement = el.querySelector(".lines-box.box-a");

		const tl = anime.timeline({
			loop: true,
			duration: 10000,
			easing: "linear",
			opacity: 0.75,
			filter: "blur(10px)",
		});

		tl.add(
			{
				targets: crossedBoxA,
				translateX: -1000,
				translateY: 600,
				rotate: "30deg",
				scale: "400%",
				opacity: 0,
				update: (anim) => blurOut(crossedBoxA, anim),
			},
			0
		);
		tl.add(
			{
				targets: crossedBoxB,
				translateX: 800,
				translateY: -800,
				rotate: "-45deg",
				scale: "250%",
				update: (anim) => blurOut(crossedBoxB, anim),
			},
			"-=1000"
		);
		tl.add(
			{
				targets: crossedBoxC,
				translateX: 600,
				translateY: 1000,
				rotate: "60deg",
				scale: "450%",
				update: (anim) => blurOut(crossedBoxC, anim),
			},
			"-=250"
		);
		tl.add(
			{
				targets: crossedBoxD,
				translateX: -600,
				translateY: -1000,
				rotate: "-80deg",
				scale: "500%",
				update: (anim) => blurOut(crossedBoxD, anim),
			},
			"-=550"
		);
		tl.add(
			{
				targets: linesBoxA,
				translateX: -600,
				translateY: -1000,
				rotate: "-80deg",
				scale: "500%",
				update: (anim) => blurOut(linesBoxA, anim),
			},
			2000
		);
	}

	return (
		<div class="home">
			<div class="content">
				<span class="greeting" use:moveDownStaggered>
					{"Hello there! ".split("").map((letter) => (
						<span class={letter !== " " ? "greeting-letter first" : ""}>{letter}</span>
					))}
					{"I'm".split("").map((letter) => (
						<span class={"greeting-letter second"}>{letter}</span>
					))}
				</span>
				<h1 class="heading" use:drawPath>
					<FirstName />
					<MiddleName />
					<LastName />
				</h1>
				<p class="summary" use:revealSummary>
					I like building softwares that (hopefully) make people's life easier.
				</p>
			</div>
			<div class="scroll-indicator" />
			<div class="particles-bg" use:animateParticles>
				<div class="crossed-box box-a" />
				<div class="crossed-box box-b" />
				<div class="crossed-box box-c" />
				<div class="crossed-box box-d" />
				<div class="lines-box box-a" />
			</div>
		</div>
	);
}
