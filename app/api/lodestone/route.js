export async function GET() {
  try {
    const res = await fetch(
      "https://jp.finalfantasyxiv.com/lodestone/news/news.xml",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; FF14NewsBot/1.0)",
        },
      }
    );

    if (!res.ok) {
      return Response.json({ error: "Lodestone fetch failed", status: res.status }, { status: 500 });
    }

    const xml = await res.text();

    // XMLからアイテムを抽出（シンプルな正規表現パース）
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
      const block = match[1];
      const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
        || block.match(/<title>(.*?)<\/title>/)?.[1]
        || "";
      const description = block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]
        || block.match(/<description>(.*?)<\/description>/)?.[1]
        || "";
      const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
      const link = block.match(/<link>(.*?)<\/link>/)?.[1] || "";

      // HTMLタグを除去
      const cleanDesc = description.replace(/<[^>]+>/g, "").trim().slice(0, 200);

      items.push({ title, description: cleanDesc, pubDate, link });
    }

    return Response.json({ items });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
