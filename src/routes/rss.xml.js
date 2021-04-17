import data from "$lib/data/site"
import { getResources } from "$lib/utils/fetch-data"

const feedItem = (item: any) => `
    <item>
      <title>${item.title}</title>
      <description><![CDATA[${item.desc}]]></description>
      <link>${data.siteUrl}/post/${item.slug}</link>
      <guid isPermaLink="false">${data.siteUrl}/post/${item.slug}</guid>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
    </item>
`

const renderXmlRssFeed = (items: any) => `<?xml version="1.0" encoding="UTF-8" ?>
<rss xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
  <channel>
    <title><![CDATA[elianiva.my.id]]></title>
    <description><![CDATA[Elianiva's Personal site]]></description>
    <link>${data.siteUrl}</link>
    <atom:link href="${
      data.siteUrl
    }/feed.xml" rel="self" type="application/rss+xml" />
    <generator>Svelte-Kit</generator>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items.map(feedItem).join("\n")}
  </channel>
</rss>`

export function get() {
  const feed = renderXmlRssFeed(getResources("post"))

  return {
    headers: {
      "Cache-Control": `max-age=0, s-max-age=${600}`, // 10 minutes
      "Content-Type": "application/rss+xml",
    },
    body: feed
  }
}
