import type { APIRoute } from "astro";
import { Resvg } from "@resvg/resvg-js";
import sites from "~/data/sites";

const domainName = new URL(sites.siteUrl).hostname;

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const TAG_CHAR_WIDTH_ESTIMATE = 20;
const TAG_HORIZONTAL_PADDING = 52;
const TAG_SPACING = 16;
const TAG_RECT_CORNER_RADIUS = 16;
const TAG_RECT_HEIGHT = 52;
const TAG_FONT_SIZE = 30;
const TAG_RECT_VERTICAL_OFFSET = -(TAG_RECT_HEIGHT / 2);

const PINK_50 = "#fdf2f8";
const PURPLE_50 = "#faf5ff";

const calculateTagWidth = (t: string) =>
	t.trim().length * TAG_CHAR_WIDTH_ESTIMATE + TAG_HORIZONTAL_PADDING;

// this endpoint is only valid in development mode because it writes stuff to the filesystem
// a bit of a hack but i can't be bothered to do it properly
export const GET: APIRoute = async ({ url }) => {
	if (import.meta.env.PROD) {
		return new Response("Not found", { status: 404 });
	}

	const title = url.searchParams.get("title");
	const date = url.searchParams.get("date");
	const tags = url.searchParams.get("tags");
	const description = url.searchParams.get("description");

	if (!title || !date || !tags || !description) {
		return new Response("Missing required query parameters", { status: 400 });
	}

	const formattedDate = new Date(date).toLocaleDateString("en-GB", {
		month: "long",
		day: "numeric",
		year: "numeric",
		weekday: "long",
	});

	// add comma after weekday
	const weekday = formattedDate.split(" ").at(0);
	const formattedDateWithoutWeekday = formattedDate
		.split(" ")
		.slice(1)
		.join(" ");
	const formattedDateWithComma = `${weekday}, ${formattedDateWithoutWeekday}`;

	const decodedTitle = decodeURIComponent(title);
	const decodedDate = decodeURIComponent(formattedDateWithComma);
	const decodedTags = decodeURIComponent(tags);
	const decodedDescription = decodeURIComponent(description);

	const descriptionLines = [];
	let currentLine = "";
	for (const word of decodedDescription.split(" ")) {
		if (`${currentLine} ${word}`.trim().length <= 45) {
			currentLine = `${currentLine} ${word}`.trim();
		} else {
			if (currentLine.length > 0) {
				descriptionLines.push(currentLine);
			}
			currentLine = word;
		}
	}
	if (currentLine.length > 0) {
		descriptionLines.push(currentLine);
	}

	if (descriptionLines.length > 2) {
		descriptionLines.length = 2;
		const secondLine = descriptionLines[1] ?? "";
		if (secondLine.length > 45) {
			descriptionLines[1] = `${secondLine.slice(0, 42).trimEnd()}...`;
		} else {
			descriptionLines[1] = `${secondLine.trimEnd()}...`;
		}
	}

	const escapedDescriptionLines = descriptionLines.map(escapeXML);

	const descriptionTspans = escapedDescriptionLines
		.map((line, idx) => {
			const dy = idx === 0 ? "0" : "1.5em";
			return `<tspan x="50%" dy="${dy}">${line}</tspan>`;
		})
		.join("");

	const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
	 <defs>
	   <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
	     <stop offset="0%" stop-color="${PINK_50}" />
	     <stop offset="100%" stop-color="${PURPLE_50}" />
	   </linearGradient>
	   <style>
	     .title {
		   font-family: "Lora Variable", serif;
		   font-weight: 900;
	       fill: #881337;
	     }
	     .tagline {
	       fill: #881337;
	       font-style: italic;
	       opacity: 0.6;
	     }
	     .meta {
	       fill: #881337b3;
	     }
	     .footer {
	       fill: #881337;
	     }
	     .site-name {
	       fill: #8f2042;
	     }
	     .date {
	       fill: #8f2042;
	     }
	     .tag-pill {
	       fill: #881337;
	     }
	   </style>
	 </defs>
	 <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#grad)" />
	 <rect x="20" y="20" width="1160" height="590" fill="none" stroke="#f9a8d4" stroke-width="4" stroke-dasharray="20,15" rx="20" ry="20" />
	 <text x="5%" y="12%" dominant-baseline="middle" text-anchor="start" font-size="32" class="site-name">${domainName}</text>
	 <text x="95%" y="12%" dominant-baseline="middle" text-anchor="end" font-size="32" class="date">${escapeXML(decodedDate)}</text>
	 <text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" font-size="42" class="title">${escapeXML(decodedTitle)}</text>
	 <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="36" class="tagline">
	   ${descriptionTspans}
	 </text>
	 <g id="tags" transform="translate(${CARD_WIDTH / 2}, ${CARD_HEIGHT - 80})">
	   ${decodedTags
				.split(",")
				.map((tag, idx, arr) => {
					const text = `#${tag.trim()}`;
					const totalTagsWidth = arr.reduce(
						(acc, t) => acc + calculateTagWidth(t) + TAG_SPACING,
						-TAG_SPACING,
					);
					const initialOffset = -(totalTagsWidth / 2);
					const xOffset = arr
						.slice(0, idx)
						.reduce(
							(acc, t) => acc + calculateTagWidth(t) + TAG_SPACING,
							initialOffset,
						);
					const width = calculateTagWidth(tag);
					const currentTagCenterOffset = xOffset + width / 2;

					return `
			 <g transform="translate(${currentTagCenterOffset}, 0)">
			   <rect x="-${width / 2}" y="${TAG_RECT_VERTICAL_OFFSET}" rx="${TAG_RECT_CORNER_RADIUS}" ry="${TAG_RECT_CORNER_RADIUS}" width="${width}" height="${TAG_RECT_HEIGHT}" fill="#f9a8d455" />
			   <text x="0" y="0" dominant-baseline="middle" text-anchor="middle" font-size="${TAG_FONT_SIZE}" class="tag-pill">${escapeXML(text)}</text>
			 </g>
		   `;
				})
				.join("")}
	 </g>
</svg>`;

	// make it shorter by removing newlines and indentations (tabs, spaces)
	const shorterSvg = svg
		.replace(/^ +/, "")
		.replace(/\n/g, "")
		.replace(/\t/g, "");

	// convert to png using resvg because og-image doesn't support svg
	const resvg = new Resvg(shorterSvg);
	const pngData = resvg.render();
	const pngBuffer = pngData.asPng();

	return new Response(pngBuffer, {
		headers: {
			"Content-Type": "image/png",
		},
	});
};

function escapeXML(str: string) {
	return str
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}
