import anime from "animejs";
import "./home.scss";
import { FirstName } from "./paths/FirstName";
import { LastName } from "./paths/LastName";
import { MiddleName } from "./paths/MiddleName";

export function Home() {
	function moveDownStaggered(el: HTMLDivElement) {
		const letters = el.querySelectorAll(".greeting-letter");
		const tl = anime.timeline({
			targets: letters,
			easing: "easeOutExpo",
			duration: 1000,
		});
		tl.add({ opacity: 0, translateY: -100, duration: 0 });
		tl.add({ opacity: 1, translateY: 0, delay: anime.stagger(50) });
	}

	return (
		<div class="home">
			<div class="content">
				<span class="greeting" use:moveDownStaggered>
					{"Hello there! I'm".split("").map((letter) => (
						<span class={letter !== " " ? "greeting-letter" : ""}>{letter}</span>
					))}
				</span>
				<h1 class="heading">
					<FirstName />
					<MiddleName />
					<LastName />
					{/* Dicha Z<span class="username">elianiva</span>n Arkana */}
				</h1>
			</div>
		</div>
	);
}
