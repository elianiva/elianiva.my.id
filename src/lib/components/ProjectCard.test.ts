import { describe, it, afterEach, expect } from "vitest";
import { cleanup, render } from "@testing-library/svelte";
import ProjectCard from "./ProjectCard.svelte";

describe("PostCard.svelte", () => {
	afterEach(() => cleanup());

	const props = {
		title: "Some random project",
		imgSrc: "image.source.idk",
		desc: "A random project, blah blah blah",
		href: "/some-random-project",
		demo: "https://graphene.teknologiumum.com",
		source: "https://github.com/teknologi-umum/graphene",
	};

	it("renders a card with all props", () => {
		const { container, getByAltText, getByText, queryByText } = render(ProjectCard, props);

		expect(container).toBeTruthy();
		expect(getByText(props.title)).toBeTruthy();
		expect(getByText(props.title).getAttribute("href")).toBe(props.href);
		expect(getByAltText(props.title)).toBeTruthy();
		expect(getByAltText(props.title).getAttribute("src")).toBe(props.imgSrc);
		expect(getByText(props.desc)).toBeTruthy();
		expect(queryByText("Visit")).toBeTruthy();
		expect(queryByText("Source")).toBeTruthy();
	});

	it("renders a card without demo url", () => {
		const { container, getByText, getByAltText, queryByText } = render(ProjectCard, {
			...props,
			demo: null,
		});

		expect(container).toBeTruthy();
		expect(getByText(props.title)).toBeTruthy();
		expect(getByText(props.title).getAttribute("href")).toBe(props.href);
		expect(getByAltText(props.title)).toBeTruthy();
		expect(getByAltText(props.title).getAttribute("src")).toBe(props.imgSrc);
		expect(getByText(props.desc)).toBeTruthy();
		expect(queryByText("Visit")).toBeNull();
		expect(queryByText("Source")).toBeTruthy();
	});
});
