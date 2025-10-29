import { RAINDROP_API_KEY } from "astro:env/server";

export type RaindropCollection = {
	id: number;
	title: string;
	slug: string;
	public: boolean;
};

export type RaindropItem = {
	id: number;
	link: string;
	title: string;
	cover: string;
	domain: string;
};

export type Raindrop = RaindropCollection & {
	items: RaindropItem[];
};

const RAINDROP_BASE_URL = "https://api.raindrop.io/rest/v1";

async function getRaindropCollections(): Promise<RaindropCollection[]> {
	const collections = await fetch(`${RAINDROP_BASE_URL}/collections`, {
		headers: {
			Authorization: `Bearer ${RAINDROP_API_KEY}`,
		},
	});
	const result = (await collections.json()) as {
		items: Record<string, unknown>[];
	};
	return result.items
		.filter(
			(c): c is Omit<RaindropCollection, "id"> & { _id: number } =>
				!!c.public &&
				c._id !== undefined &&
				c.title !== undefined &&
				c.slug !== undefined,
		)
		.map((c) => ({
			id: c._id,
			title: c.title,
			slug: c.slug,
			public: c.public,
		}));
}

async function getRaindropItems(
	collection: RaindropCollection,
): Promise<Raindrop> {
	const response = await fetch(
		`${RAINDROP_BASE_URL}/raindrops/${collection.id}`,
		{
			headers: {
				Authorization: `Bearer ${RAINDROP_API_KEY}`,
			},
		},
	);
	const raindrop = (await response.json()) as {
		items: Record<string, unknown>[];
	};
	return {
		...collection,
		items: raindrop.items
			.filter(
				(d): d is Omit<RaindropItem, "id"> & { _id: number } =>
					d._id !== undefined &&
					d.link !== undefined &&
					d.title !== undefined &&
					d.cover !== undefined,
			)
			.map((d) => ({
				id: d._id,
				link: d.link,
				title: d.title,
				cover: d.cover,
				domain: d.domain,
			}))
			.sort((a, b) =>
				a.title.toLowerCase().localeCompare(b.title.toLowerCase()),
			),
	};
}

export async function getRaindrops() {
	const collections = await getRaindropCollections();
	const raindrops = await Promise.all(
		collections.map((c) => getRaindropItems(c)),
	);
	return raindrops;
}
