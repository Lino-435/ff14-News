const KEYWORDS = [
  "FF14 FFXIV",
  "FF14 仕様変更 こっそり",
  "FF14 零式 極",
  "FF14 パッチ アップデート",
  "FF14 装備 マウント ミニオン",
];

async function fetchKeyword(keyword) {
  const url = `https://search.yahoo.co.jp/realtime/api/v1/pagination?p=${encodeURIComponent(keyword)}&md=h&results=20`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      "Accept": "application/json",
      "Accept-Language": "ja,en;q=0.9",
      "Referer": "https://search.yahoo.co.jp/",
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.timeline?.entry || [])
    .slice(0, 10)
    .map(e => e?.displayText || "")
    .filter(t => t.length > 5);
}

export async function GET() {
  try {
    // 全キーワードを並列取得
    const results = await Promise.allSettled(KEYWORDS.map(fetchKeyword));
    const allTweets = [];
    const seen = new Set();

    for (const r of results) {
      if (r.status === "fulfilled") {
        for (const t of r.value) {
          if (!seen.has(t)) {
            seen.add(t);
            allTweets.push(t);
          }
        }
      }
    }

    return Response.json({
      tweets: allTweets,
      count: allTweets.length,
    });
  } catch (e) {
    return Response.json({ tweets: [], error: e.message });
  }
}
