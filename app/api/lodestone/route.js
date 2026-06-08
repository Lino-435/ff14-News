export async function GET() {
  try {
    // LodestoneのNewsページをスクレイプ
    const res = await fetch("https://jp.finalfantasyxiv.com/lodestone/news/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ja,en;q=0.9",
      },
    });

    const html = await res.text();

    const items = [];

    // ニュースリンクとタイトルを抽出
    // Lodestone HTMLパターン: <a href="/lodestone/news/..." class="...">タイトル</a>
    const linkRegex = /href="(\/lodestone\/(?:news|topics|updates|maintenance|status)\/[^"]+)"[^>]*>\s*([^<]{5,100})\s*</g;
    let m;
    const seen = new Set();
    while ((m = linkRegex.exec(html)) !== null && items.length < 15) {
      const path = m[1];
      const title = m[2].trim();
      if (!seen.has(path) && !title.includes("javascript") && title.length > 4) {
        seen.add(path);
        items.push({
          title,
          description: "",
          pubDate: "",
          link: `https://jp.finalfantasyxiv.com${path}`,
        });
      }
    }

    // 見出しテキストも試みる
    if (items.length === 0) {
      const h2Regex = /<(?:h[123456]|p)[^>]*class="[^"]*(?:news|heading|title)[^"]*"[^>]*>\s*(?:<[^>]+>)*([^<]{5,100})(?:<\/[^>]+>)*\s*<\/(?:h[123456]|p)>/g;
      while ((m = h2Regex.exec(html)) !== null && items.length < 15) {
        const title = m[1].trim();
        if (title.length > 4) items.push({ title, description: "", pubDate: "" });
      }
    }

    // デバッグ：news関連の部分を抽出
    const newsIdx = html.indexOf("news");
    const debugSnippet = newsIdx > -1 ? html.slice(Math.max(0, newsIdx - 50), newsIdx + 500) : html.slice(2000, 2500);

    return Response.json({
      items,
      count: items.length,
      debug: items.length === 0 ? debugSnippet : undefined,
    });
  } catch (e) {
    return Response.json({ items: [], error: e.message });
  }
}
