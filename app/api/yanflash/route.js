export async function GET() {
  try {
    const res = await fetch("https://yan-flash.com/feed.xml", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FF14NewsBot/1.0)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    if (!res.ok) {
      return Response.json({ items: [], error: `HTTP ${res.status}` });
    }

    const xml = await res.text();
    const items = [];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 15) {
      const block = match[1];

      const title =
        block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ||
        block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";

      const desc =
        block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
        block.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "";

      const link =
        block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ||
        block.match(/<guid>([\s\S]*?)<\/guid>/)?.[1] || "";

      const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";

      const cleanDesc = desc.replace(/<[^>]+>/g, "").trim().slice(0, 200);
      const cleanTitle = title.trim();

      if (cleanTitle.length > 3) {
        items.push({ title: cleanTitle, description: cleanDesc, link, pubDate });
      }
    }

    return Response.json({ items, count: items.length });
  } catch (e) {
    return Response.json({ items: [], error: e.message });
  }
}
