import { Resvg } from "@cf-wasm/resvg";
import { type SatoriOptions, satori } from "@cf-wasm/satori";
import type { APIRoute } from "astro";
import { html } from "satori-html";
import sites from "~/data/sites";

const domainName = new URL(sites.siteUrl).hostname;

// satori dimensions
const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

// Soft peachy-pink color palette matching the site
const COLORS = {
	bgGradientStart: "#fff5f0",
	bgGradientMid: "#fff9f5",
	bgGradientEnd: "#fff0f5",
	peach: "#ffd4bc",
	lavender: "#e6e6fa",
	blush: "#fff0f5",
	pinkLight: "#fce7f3",
	pinkMedium: "#f9a8d4",
	pinkDark: "#db2777",
	roseDeep: "#be185d",
	textPrimary: "#831843",
	textSecondary: "#9d174d",
	textMuted: "#be185d",
};

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

	const decodedTitle = decodeURIComponent(title);
	const decodedDate = decodeURIComponent(formattedDate);
	const decodedTags = decodeURIComponent(tags)
		.split(",")
		.map((tag) => tag.trim());
	const decodedDescription = decodeURIComponent(description);

	// Load Chonburi font for that soft, fun aesthetic
	const chonburiFont = await (
		await fetch(`${sites.siteUrl}/assets/fonts/Chonburi.ttf`)
	).arrayBuffer();

	const options: SatoriOptions = {
		width: CARD_WIDTH,
		height: CARD_HEIGHT,
		fonts: [
			{
				name: "Chonburi",
				data: chonburiFont,
				weight: 400,
			},
		],
	};

	const markup = html(`
	<div style="
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, ${COLORS.bgGradientStart} 0%, ${COLORS.bgGradientMid} 50%, ${COLORS.bgGradientEnd} 100%);
		padding: 24px;
		position: relative;
		overflow: hidden;
	">
		<div style="
			display: flex;
			flex-direction: column;
			width: 100%;
			height: 100%;
			border-radius: 32px;
			font-family: 'Chonburi', serif;
			background: linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 240, 245, 0.5) 50%, rgba(255, 245, 240, 0.6) 100%);
			backdrop-filter: blur(20px);
			position: relative;
			border: 2px solid rgba(249, 168, 212, 0.6);
		">
			<!-- Header with domain and date -->
			<div style="
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 28px 32px 0 32px;
				font-size: 22px;
				color: ${COLORS.textSecondary};
				letter-spacing: 0.5px;
			">
				<span style="font-weight: 600;">${domainName}</span>
				<span style="opacity: 0.8;">${decodedDate}</span>
			</div>

			<!-- Content area -->
			<div style="
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				text-align: center;
				flex-grow: 1;
				padding: 20px 48px;
				gap: 16px;
			">
				<!-- Title with soft styling -->
				<h1 style="
					font-size: 52px;
					font-weight: 400;
					color: ${COLORS.textPrimary};
					line-height: 1.2;
					margin: 0;
					letter-spacing: -0.5px;
					text-shadow: 2px 2px 0px rgba(255, 212, 188, 0.5);
				">
					${decodedTitle}
				</h1>

				<!-- Description -->
				<p style="
					font-size: 28px;
					color: ${COLORS.textMuted};
					line-height: 1.4;
					margin: 0;
					max-width: 85%;
					opacity: 0.85;
				">
					${decodedDescription}
				</p>
			</div>

			<!-- Tags footer -->
			<div style="
				display: flex;
				justify-content: center;
				align-items: center;
				gap: 12px;
				padding: 0 32px 28px 32px;
				flex-wrap: wrap;
			">
				${decodedTags
					.map(
						(tag) =>
							`<span style="
								display: flex;
								align-items: center;
								background: linear-gradient(135deg, rgba(255, 212, 188, 0.6) 0%, rgba(252, 231, 243, 0.7) 100%);
								border-radius: 20px;
								padding: 10px 20px;
								font-size: 22px;
								color: ${COLORS.roseDeep};
								box-shadow: 0 2px 8px rgba(255, 182, 193, 0.2);
								border: 1px solid rgba(249, 168, 212, 0.6);
							">#${tag.trim()}</span>`,
					)
					.join("")}
			</div>
		</div>
	</div>`);

	const svg = await satori(markup, options);

	const resvg = new Resvg(svg, {
		font: {
			loadSystemFonts: false,
			defaultFontFamily: "Chonburi",
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
