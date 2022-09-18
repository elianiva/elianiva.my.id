import data from "$lib/data/site";
import { getResourcesAsync } from "$lib/utils/fetch-data";
import type { RequestHandler } from "./$types";

type FeedItem = {
	title: string;
	desc: string;
	slug: string;
	date: string;
};

const feedItem = (item: FeedItem) => `
    <item>
      <title>${item.title}</title>
      <description><![CDATA[${item.desc}]]></description>
      <link>${data.siteUrl}/post/${item.slug}</link>
      <guid isPermaLink="false">${data.siteUrl}/post/${item.slug}</guid>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
    </item>
`;

const renderXmlRssFeed = (items: FeedItem[]) => `<?xml version="1.0" encoding="UTF-8" ?>
<rss xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
  <channel>
    <title><![CDATA[elianiva.my.id]]></title>
    <description><![CDATA[Elianiva's Personal site]]></description>
    <link>${data.siteUrl}</link>
    <atom:link href="${data.siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <generator>Svelte-Kit</generator>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items.map(feedItem).join("\n")}
  </channel>
</rss>`;

export const GET: RequestHandler = async () => {
	const posts = await getResourcesAsync("post");
	const feed = renderXmlRssFeed(posts);

	return new Response(JSON.stringify(feed), {
		headers: {
			"Cache-Control": `max-age=0, s-max-age=${600}`, // 10 minutes
			"Content-Type": "application/rss+xml",
		},
	});
};
