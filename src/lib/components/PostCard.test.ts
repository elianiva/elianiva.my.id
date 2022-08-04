import { describe, it, afterEach, expect } from "vitest";
import { cleanup, render } from "@testing-library/svelte";
import PostCard from "./PostCard.svelte";

describe("PostCard.svelte", () => {
	afterEach(() => cleanup());

	const date = Date.now();
	const formattedDate = new Date(date).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	const props = {
		title: "Some random post title",
		desc: "A post used for testing purpose. Please don't read this",
		href: "/some-random-post",
		tags: ["random", "bruh", "sheesh"],
		date: date,
	};

	it("renders a card with a given props", () => {
		const { container, getByTestId, getAllByTestId } = render(PostCard, props);

		expect(container).toBeTruthy();
		expect(getByTestId("title").innerHTML).toBe(props.title);
		expect(getByTestId("date").innerHTML).toBe(formattedDate);
		expect(getByTestId("desc").innerHTML).toBe(props.desc);
		getAllByTestId("tag").forEach((el, idx) => {
			expect(el.innerHTML).toBe(props.tags[idx]);
		});
	});
});
