// Reddit RSS（認証不要）。429対策で逐次取得＋ディレイ。
const FEEDS = [
  // top/day = その日最も評価された投稿（雑談より情報性が高い傾向）
  { url: "https://www.reddit.com/r/ffxiv/top/.rss?t=day&limit=20", label: "top-day" },
  // 検索フィード：パッチ・アップデート関連に絞る
  { url: "https://www.reddit.com/r/ffxiv/search/.rss?q=flair%3ANews+OR+patch+OR+update&restrict_sr=1&sort=new&t=week&limit=15", label: "news-search" },
];

// 除外したい定型スレッド（情報価値が低い）
const EXCLUDE_PATTERNS = [
  /daily questions/i,
  /faq megathread/i,
  /weekly thread/i,
  /mentor monday/i,
  /free talk friday/i,
  /screenshot sunday/i,
  /\[art by me\]/i,
  /art by me/i,
];

function decodeEntities(s) {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#32;/g, " ").replace(/&amp;/g, "&");
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchFeed(feed) {
  const res = await fetch(feed.url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/atom+xml, application/rss+xml, application/xml, text/xml, */*",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) return { items: [], status: res.status, label: feed.label };

  const xml = await res.text();
  const items = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let m;

  while ((m = entryRegex.exec(xml)) !== null && items.length < 20) {
    const block = m[1];
    const rawTitle = block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || "";
    const rawContent = block.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] || "";
    const link = block.match(/<link[^>]*href="([^"]+)"/)?.[1] || "";
    const updated = block.match(/<updated>([\s\S]*?)<\/updated>/)?.[1] || "";

    const title = decodeEntities(rawTitle).trim();
    if (title.length < 4) continue;
    if (EXCLUDE_PATTERNS.some(p => p.test(title))) continue;

    let content = decodeEntities(rawContent)
      .replace(/<[^>]+>/g, " ")
      .replace(/submitted by\s*\/u\/\S+/gi, "")
      .replace(/\[link\]|\[comments\]/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 250);

    items.push({ title, description: content, link, pubDate: updated });
  }
  return { items, status: res.status, label: feed.label };
}

export async function GET() {
  try {
    const all = [];
    const seen = new Set();
    const statuses = [];

    // 429回避のため逐次取得（間に1.2秒待機）
    for (let i = 0; i < FEEDS.length; i++) {
      if (i > 0) await sleep(1200);
      try {
        const r = await fetchFeed(FEEDS[i]);
        statuses.push({ label: r.label, status: r.status, got: r.items.length });
        for (const item of r.items) {
          const key = item.title.toLowerCase();
          if (!seen.has(key)) { seen.add(key); all.push(item); }
        }
      } catch (e) {
        statuses.push({ label: FEEDS[i].label, error: e.message });
      }
    }

    return Response.json({ items: all.slice(0, 20), count: all.length, statuses });
  } catch (e) {
    return Response.json({ items: [], error: e.message });
  }
}
