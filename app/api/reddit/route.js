// Reddit RSS（認証不要・.jsonは2026年5月に403化したがRSSは生存）
const FEEDS = [
  { url: "https://www.reddit.com/r/ffxiv/hot/.rss?limit=15", label: "r/ffxiv hot" },
  { url: "https://www.reddit.com/r/ffxiv/top/.rss?t=day&limit=15", label: "r/ffxiv top today" },
];

function decodeEntities(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

async function fetchFeed(feed) {
  const res = await fetch(feed.url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/atom+xml, application/rss+xml, application/xml, text/xml, */*",
    },
  });
  if (!res.ok) return { items: [], status: res.status };

  const xml = await res.text();
  const items = [];

  // RedditのRSSはAtom形式（<entry>）
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = entryRegex.exec(xml)) !== null && items.length < 15) {
    const block = m[1];
    const title =
      block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || "";
    const contentRaw =
      block.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] || "";
    const link = block.match(/<link[^>]*href="([^"]+)"/)?.[1] || "";
    const updated = block.match(/<updated>([\s\S]*?)<\/updated>/)?.[1] || "";

    // HTMLエンティティをデコードしてタグ除去
    const content = decodeEntities(contentRaw)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 250);

    const cleanTitle = decodeEntities(title).trim();
    if (cleanTitle.length > 3) {
      items.push({ title: cleanTitle, description: content, link, pubDate: updated });
    }
  }
  return { items, status: res.status };
}

export async function GET() {
  try {
    const results = await Promise.allSettled(FEEDS.map(fetchFeed));
    const all = [];
    const seen = new Set();
    const statuses = [];

    for (const r of results) {
      if (r.status === "fulfilled") {
        statuses.push(r.value.status);
        for (const item of r.value.items) {
          if (!seen.has(item.title)) {
            seen.add(item.title);
            all.push(item);
          }
        }
      }
    }

    return Response.json({ items: all.slice(0, 20), count: all.length, statuses });
  } catch (e) {
    return Response.json({ items: [], error: e.message });
  }
}
