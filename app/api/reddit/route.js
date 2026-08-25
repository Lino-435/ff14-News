// Reddit RSS（認証不要）
// r/ffxivdiscussion = 仕様・バランス・変更点を議論する場（r/ffxivより情報密度が高い）
// 429回避のため1リクエストにつき1フィードのみ取得
const FEED = "https://www.reddit.com/r/ffxivdiscussion/top/.rss?t=week&limit=25";

// 予備フィード（メインが429の時のみ使用）
const FALLBACK = "https://www.reddit.com/r/ffxivdiscussion/.rss?limit=25";

const EXCLUDE_PATTERNS = [
  /daily questions/i,
  /faq megathread/i,
  /weekly thread/i,
  /mentor monday/i,
  /free talk/i,
  /screenshot sunday/i,
  /art by me/i,
  /^\[?fluff\]?/i,
];

function decodeEntities(s) {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#32;/g, " ").replace(/&amp;/g, "&");
}

function parseFeed(xml) {
  const items = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = entryRegex.exec(xml)) !== null && items.length < 25) {
    const block = m[1];
    const rawTitle = block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || "";
    const rawContent = block.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] || "";
    const link = block.match(/<link[^>]*href="([^"]+)"/)?.[1] || "";
    const updated = block.match(/<updated>([\s\S]*?)<\/updated>/)?.[1] || "";

    const title = decodeEntities(rawTitle).trim();
    if (title.length < 6) continue;
    if (EXCLUDE_PATTERNS.some(p => p.test(title))) continue;

    const content = decodeEntities(rawContent)
      .replace(/<[^>]+>/g, " ")
      .replace(/submitted by\s*\/u\/\S+/gi, "")
      .replace(/\[link\]|\[comments\]/gi, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);

    items.push({ title, description: content, link, pubDate: updated });
  }
  return items;
}

async function tryFetch(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/atom+xml, application/rss+xml, application/xml, text/xml, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
    },
  });
  if (!res.ok) return { items: [], status: res.status };
  const xml = await res.text();
  return { items: parseFeed(xml), status: res.status };
}

export async function GET() {
  try {
    // メインフィードを試す
    let result = await tryFetch(FEED);

    // 429ならフォールバックを試す
    if (result.status === 429 || result.items.length === 0) {
      await new Promise(r => setTimeout(r, 1500));
      const fb = await tryFetch(FALLBACK);
      if (fb.items.length > 0) {
        return Response.json({
          items: fb.items,
          count: fb.items.length,
          source: "fallback",
          statuses: [result.status, fb.status],
        });
      }
    }

    return Response.json({
      items: result.items,
      count: result.items.length,
      source: "main",
      statuses: [result.status],
    });
  } catch (e) {
    return Response.json({ items: [], error: e.message });
  }
}
