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
    const { container, getByTestId } = render(ProjectCard, props);

    expect(container).toBeTruthy();
    expect(getByTestId("title").innerHTML).toBe(props.title);
    expect(getByTestId("title").getAttribute("href")).toBe(props.href);
    expect(getByTestId("img").getAttribute("src")).toBe(props.imgSrc);
    expect(getByTestId("desc").innerHTML).toBe(props.desc);
    expect(getByTestId("demo")).toBeTruthy();
    expect(getByTestId("source")).toBeTruthy();
  });

  it("renders a card without demo url", () => {
    const { container, queryByTestId, getByTestId } = render(ProjectCard, {
      ...props,
      demo: null,
    });

    expect(container).toBeTruthy();
    expect(getByTestId("title").innerHTML).toBe(props.title);
    expect(getByTestId("title").getAttribute("href")).toBe(props.href);
    expect(getByTestId("img").getAttribute("src")).toBe(props.imgSrc);
    expect(getByTestId("desc").innerHTML).toBe(props.desc);
    expect(queryByTestId("demo")).toBeNull();
    expect(getByTestId("source")).toBeTruthy();
  });
});
