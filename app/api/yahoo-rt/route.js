export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("q") || "FF14";

    const url = `https://search.yahoo.co.jp/realtime/api/v1/pagination?p=${encodeURIComponent(keyword)}&md=h&results=30`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      },
    });

    if (!res.ok) {
      return Response.json({ error: "Yahoo RT fetch failed", status: res.status }, { status: 500 });
    }

    const data = await res.json();

    // ツイートのテキストを抽出
    const tweets = [];
    const timelines = data?.timeline || data?.timelines || data?.data || [];

    if (Array.isArray(timelines)) {
      for (const t of timelines.slice(0, 20)) {
        const text = t?.text || t?.body || t?.tweet?.text || "";
        if (text) tweets.push(text);
      }
    }

    return Response.json({ tweets, raw_keys: Object.keys(data || {}) });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
