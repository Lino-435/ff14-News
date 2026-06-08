export async function GET() {
  const URLS = [
    "https://jp.finalfantasyxiv.com/lodestone/news/news.xml",
    "https://na.finalfantasyxiv.com/lodestone/news/news.xml",
  ];

  for (const url of URLS) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; FF14NewsBot/1.0)" },
      });

      if (!res.ok) continue;
      const xml = await res.text();

      // デバッグ：最初の500文字を返す
      if (!xml.includes("<item>") && !xml.includes("<entry>")) {
        return Response.json({
          items: [],
          debug: `No items found. First 300 chars: ${xml.slice(0, 300)}`,
          url,
        });
      }

      const items = [];
      // <item> タグ形式（RSS）
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
        const block = match[1];
        const title =
          block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ||
          block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
        const desc =
          block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
          block.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "";
        const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
        items.push({
          title: title.trim(),
          description: desc.replace(/<[^>]+>/g, "").trim().slice(0, 200),
          pubDate,
        });
      }

      if (items.length > 0) return Response.json({ items, url });
    } catch (e) {
      continue;
    }
  }

  // フォールバック：LodestoneのHTMLページをスクレイプ
  try {
    const res = await fetch("https://jp.finalfantasyxiv.com/lodestone/news/", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FF14NewsBot/1.0)" },
    });
    const html = await res.text();
    const items = [];
    const titleRegex = /class="[^"]*news__heading[^"]*"[^>]*>\s*<[^>]+>([^<]+)<\/[^>]+>/g;
    let m;
    while ((m = titleRegex.exec(html)) !== null && items.length < 10) {
      items.push({ title: m[1].trim(), description: "", pubDate: "" });
    }
    return Response.json({ items, source: "html_scrape", debug: items.length === 0 ? html.slice(0, 500) : undefined });
  } catch (e) {
    return Response.json({ items: [], error: e.message });
  }
}
