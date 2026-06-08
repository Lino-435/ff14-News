export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("q") || "FF14";

    const url = `https://search.yahoo.co.jp/realtime/api/v1/pagination?p=${encodeURIComponent(keyword)}&md=h&results=30`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "ja,en;q=0.9",
        "Referer": "https://search.yahoo.co.jp/",
      },
    });

    if (!res.ok) {
      return Response.json({ tweets: [], error: `HTTP ${res.status}` });
    }

    const data = await res.json();

    // 正しい構造: data.timeline.entry[].displayText
    const entries = data?.timeline?.entry || [];
    const tweets = entries
      .slice(0, 20)
      .map(e => e?.displayText || "")
      .filter(t => t.length > 5);

    return Response.json({
      tweets,
      count: tweets.length,
      total_available: data?.timeline?.head?.totalResultsAvailable || 0,
    });

  } catch (e) {
    return Response.json({ tweets: [], error: e.message });
  }
}
