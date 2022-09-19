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
		date: new Date(date).toLocaleDateString("en-CA"), // YYYY-MM-DD
	};

	it("renders a card with a given props", () => {
		const { container, getByText, getAllByTestId } = render(PostCard, props);

		expect(container).toBeTruthy();
		expect(getByText(props.title)).toBeTruthy();
		expect(getByText(formattedDate)).toBeTruthy();
		expect(getByText(props.desc)).toBeTruthy();
		expect(getAllByTestId("tag")).toHaveLength(props.tags.length);
		getAllByTestId("tag").forEach((el, idx) => {
			expect(el.innerHTML).toBe(`# ${props.tags[idx]} `);
		});
	});
});
