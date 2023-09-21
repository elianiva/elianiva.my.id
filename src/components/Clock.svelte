<script lang="ts">
	import { onMount } from "svelte";

	let now = new Date();

	// calculates the angle of the clock arms based on the timestamp
	$: secondInMs = now.getSeconds() * 1000 + now.getMilliseconds();
	$: angle = {
		hour: (now.getHours() * 30) + (now.getMinutes() / 2),
		minute: (now.getMinutes() * 6) + (now.getSeconds() / 10),
		second: secondInMs / 60_000 * 360
	}

	$: angleRotation = {
		hour: `rotate(${angle.hour}deg)`,
		minute: `rotate(${angle.minute}deg)`,
		second: `rotate(${angle.second}deg)`
	}

	// update the time every frames
	function updateTime() {
		now = new Date();
		requestAnimationFrame(updateTime)
	}
	onMount(() => {
		requestAnimationFrame(updateTime)
	})
</script>

<div class="relative -rotate-90">
	<div class="absolute transition-all ease-out w-4 h-[2px] bg-slate-900 origin-left" style="transform: {angleRotation.hour}" id="hour-arm" />
	<div class="absolute transition-all ease-out w-8 h-[2px] bg-slate-900 origin-left" style="transform: {angleRotation.minute}" id="minute-arm" />
	<div class="absolute transition-all ease-out w-9 h-[2px] bg-red-500 origin-left" style="transform: {angleRotation.second}" id="second-arm" />
</div>
