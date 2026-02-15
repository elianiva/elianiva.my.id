<script lang="ts">
import { animate } from "motion";

interface Option {
	id: string;
	text: string;
	isCorrect: boolean;
}

interface QuizResponse {
	title: string;
	message: string;
}

interface Props {
	question: string;
	options: Option[];
	correctResponse?: QuizResponse;
	errorResponse?: QuizResponse;
}

let { question, options, correctResponse, errorResponse }: Props = $props();

const defaultCorrectResponse: QuizResponse = {
	title: "Correct!",
	message: "You got it right! Nice job.",
};

const defaultErrorResponse: QuizResponse = {
	title: "Not quite!",
	message: "That's not the right answer. Give it another try!",
};

let correctMsg = $derived(correctResponse ?? defaultCorrectResponse);
let errorMsg = $derived(errorResponse ?? defaultErrorResponse);

let selectedOption = $state<string | null>(null);
let hasAnswered = $state(false);
let showExplanation = $state(false);

let optionRefs: Record<string, HTMLButtonElement> = $state({});
let cardRef: HTMLDivElement;

function handleSelect(option: Option) {
	if (hasAnswered) return;

	selectedOption = option.id;
	hasAnswered = true;

	const prefersReduced = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches;

	if (option.isCorrect) {
		// Satisfying correct animation
		const btn = optionRefs[option.id];
		if (btn && !prefersReduced) {
			// Scale up with bounce
			animate(
				btn,
				{ scale: [1, 1.05, 1] },
				{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
			);
			// Green glow pulse
			animate(
				btn,
				{
					boxShadow: [
						"0 0 0 0 rgba(74, 222, 128, 0)",
						"0 0 0 12px rgba(74, 222, 128, 0.2)",
						"0 0 0 4px rgba(74, 222, 128, 0.3)",
					],
				},
				{ duration: 0.6, ease: "easeOut" },
			);
		}
	} else {
		// Scary error animation
		const btn = optionRefs[option.id];
		if (btn && !prefersReduced) {
			// Violent shake
			animate(
				btn,
				{ x: [0, -8, 8, -8, 8, -4, 4, -2, 2, 0] },
				{ duration: 0.5, ease: "easeInOut" },
			);
			// Red flash
			animate(
				btn,
				{
					backgroundColor: ["#fff", "#fee2e2", "#fff"],
					borderColor: ["#f9a8d4", "#ef4444", "#f9a8d4"],
				},
				{ duration: 0.4 },
			);
		}

		// Also animate the whole card slightly
		if (cardRef && !prefersReduced) {
			animate(
				cardRef,
				{ x: [0, -4, 4, -4, 4, 0] },
				{ duration: 0.4, ease: "easeInOut" },
			);
		}
	}

	// Show explanation after a brief delay
	setTimeout(() => {
		showExplanation = true;
	}, 300);
}

function reset() {
	selectedOption = null;
	hasAnswered = false;
	showExplanation = false;
}
</script>

<div
	bind:this={cardRef}
	class="my-8 p-4 rounded-xl border-[0.5px] border-pink-200/60 bg-linear-to-bl from-white/70 to-pink-50/20 backdrop-blur-sm shadow-card"
	role="region"
	aria-label="Quiz"
>
	<p class="font-body text-pink-950/90 mb-3! leading-relaxed">
		{@html question}
	</p>

	<div class="space-y-2.5" role="radiogroup" aria-label="Answer options">
		{#each options as option (option.id)}
			<button
				type="button"
				bind:this={optionRefs[option.id]}
				class="w-full text-left p-2 rounded-lg border transition-all duration-200 font-body text-sm
					{!hasAnswered
					? 'border-dashed border-pink-300 bg-white/60 hover:bg-pink-100/50 hover:border-pink-400 cursor-pointer'
					: option.isCorrect
						? 'border-2 border-green-400 bg-green-50/70 cursor-default'
						: selectedOption === option.id
							? 'border-2 border-red-300 bg-red-50/50 cursor-default'
							: 'border-dashed border-pink-200/50 bg-white/40 opacity-60 cursor-default'}"
				onclick={() => handleSelect(option)}
				disabled={hasAnswered}
				aria-checked={selectedOption === option.id}
				role="radio"
			>
				<div class="flex items-center gap-3">
					<span
						class="shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold
						{!hasAnswered
							? 'border-pink-300 text-pink-400'
							: option.isCorrect
								? 'border-green-500 bg-green-500 text-white'
								: selectedOption === option.id
									? 'border-red-400 bg-red-400 text-white'
									: 'border-pink-200 text-pink-300'}"
					>
						{#if hasAnswered}
							{#if option.isCorrect}
								✓
							{:else if selectedOption === option.id}
								✕
							{:else}
								{String.fromCharCode(
									65 + options.indexOf(option),
								)}
							{/if}
						{:else}
							{String.fromCharCode(65 + options.indexOf(option))}
						{/if}
					</span>
					<span
						class={hasAnswered && option.isCorrect
							? "text-green-800 font-medium"
							: hasAnswered &&
								  selectedOption === option.id &&
								  !option.isCorrect
								? "text-red-700"
								: "text-pink-950/80"}
					>
						{option.text}
					</span>
				</div>
			</button>
		{/each}
	</div>

	{#if showExplanation}
		<div
			class="mt-5 p-4 border rounded-lg {selectedOption &&
			options.find((o) => o.id === selectedOption)?.isCorrect
				? 'bg-green-50/70 border-green-400'
				: 'bg-red-50/50 border-red-400'}"
		>
			<p
				class="font-body text-sm leading-relaxed mb-0! {selectedOption &&
				options.find((o) => o.id === selectedOption)?.isCorrect
					? 'text-green-800'
					: 'text-red-800'}"
			>
				{#if selectedOption && options.find((o) => o.id === selectedOption)?.isCorrect}
					<span class="font-semibold">{correctMsg.title}</span>
					{@html correctMsg.message}
				{:else}
					<span class="font-semibold">{errorMsg.title}</span>
					{@html errorMsg.message}
				{/if}
			</p>
			{#if selectedOption && !options.find((o) => o.id === selectedOption)?.isCorrect}
				<button
					type="button"
					class="mt-2 text-xs font-body text-pink-600 hover:text-pink-800 underline underline-offset-2 cursor-pointer"
					onclick={reset}
				>
					Try again
				</button>
			{/if}
		</div>
	{/if}
</div>
