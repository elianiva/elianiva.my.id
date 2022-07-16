import anime from "animejs";
import "./home.scss";
import { FirstName } from "./paths/FirstName";
import { LastName } from "./paths/LastName";
import { MiddleName } from "./paths/MiddleName";

export function Home() {
	function moveDownStaggered(el: HTMLDivElement) {
		const firstLetters = el.querySelectorAll(".greeting-letter.first");
		const secondLetters = el.querySelectorAll(".greeting-letter.second");

		const tl = anime.timeline({ easing: "easeOutExpo" });
		tl.add({ targets: [firstLetters, secondLetters], opacity: 0, translateY: -100, duration: 0 });
		tl.add({ targets: firstLetters, opacity: 1, translateY: 0, delay: anime.stagger(50) });
		tl.add(
			{ targets: [firstLetters, secondLetters], opacity: 1, translateY: 0, delay: anime.stagger(50) },
			"-=750"
		);
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
			delay: 3000,
			opacity: 1,
			duration: 500,
			easing: "easeOutSine"
		});
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
					I like building softwares that (hopefully) makes people's life easier.
				</p>
			</div>
			<div class="scroll-indicator" />
		</div>
	);
}
