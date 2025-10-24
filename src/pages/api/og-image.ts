import { Resvg } from "@cf-wasm/resvg";
import type { APIRoute } from "astro";
import { satori, type SatoriOptions } from "@cf-wasm/satori";
import { html } from "satori-html";
import sites from "~/data/sites";

const domainName = new URL(sites.siteUrl).hostname;

// satori dimensions
const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

export const GET: APIRoute = async ({ url }) => {
	const title = url.searchParams.get("title");
	const date = url.searchParams.get("date");
	const tags = url.searchParams.get("tags");
	const description = url.searchParams.get("description");

	if (!title || !date || !tags || !description) {
		return new Response("Missing required query parameters", {
			status: 400,
		});
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
	const decodedTags = decodeURIComponent(tags)
		.split(",")
		.map((tag) => tag.trim());
	const decodedDescription = decodeURIComponent(description);

	// satori options with SatoriOptions type
	const loraRegular = await (
		await fetch(`${sites.siteUrl}/assets/fonts/Lora-Regular.ttf`)
	).arrayBuffer();
	const loraBold = await (
		await fetch(`${sites.siteUrl}/assets/fonts/Lora-Bold.ttf`)
	).arrayBuffer();
	const options: SatoriOptions = {
		width: CARD_WIDTH,
		height: CARD_HEIGHT,
		fonts: [
			{
				name: "Lora",
				data: loraRegular,
				weight: 400,
			},
			{
				name: "Lora",
				data: loraBold,
				weight: 700,
			},
		],
	};

	const markup = html(`
	<div style="display: flex; flex-direction: column; width: 100%; height: 100%; background-image: linear-gradient(to bottom right, #fdf2f8, #faf5ff); padding: 20px;">
		<div
			style="display: flex; flex-direction: column; width: 100%; height: 100%; border: 4px dashed #f9a8d4; border-radius: 20px; font-family: 'Lora', serif;"
		>
			<div
				style="display: flex; justify-content: space-between; align-items: center; padding: 20px 20px 0 20px; font-size: 32px; color: #8f2042;"
			>
				<span>${domainName}</span>
				<span>${decodedDate}</span>
			</div>
			<div
				style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; flex-grow: 1; padding: 0 40px;"
			>
				<span
					style="font-size: 48px; font-weight: 900; color: #881337; margin-bottom: 20px;"
				>
					${decodedTitle}
				</span>
				<span
					style="font-size: 36px; color: #881337; opacity: 0.6; font-style: italic; max-width: 90%;"
				>
					${decodedDescription}
				</span>
			</div>
			<div
				style="display: flex; justify-content: center; align-items: center; gap: 16px; padding: 0 20px 20px 20px;"
			>
				${decodedTags
					.map(
						(tag) =>
							`<div style="display: flex; align-items: center; background-color: #f9a8d455; border-radius: 16px; padding: 10px 20px; font-size: 30px; color: #881337;">#${tag.trim()}</div>`,
					)
					.join("")}
			</div>
		</div>
	</div>`);

	const svg = await satori(markup, options);

	const resvg = new Resvg(svg, {
		font: {
			loadSystemFonts: false,
			defaultFontFamily: "Lora",
		},
		fitTo: {
			mode: "width",
			value: CARD_WIDTH,
		},
	});

	const pngData = resvg.render();
	const pngBuffer = pngData.asPng();

	return new Response(pngBuffer, {
		headers: {
			"Content-Type": "image/png",
		},
	});
};
