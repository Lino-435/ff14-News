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
    const allKeys = Object.keys(data || {});

    // timeline配列を取得
    const timeline = data?.timeline || [];
    const tweets = [];

    if (Array.isArray(timeline) && timeline.length > 0) {
      // 最初の要素の構造をデバッグ用に返す
      const firstItem = timeline[0];
      const firstItemKeys = typeof firstItem === "object" ? Object.keys(firstItem) : [];

      for (const t of timeline.slice(0, 20)) {
        // 様々なテキストフィールドを試す
        const text =
          t?.text ||
          t?.body ||
          t?.tweet?.text ||
          t?.tweet?.body ||
          t?.message ||
          t?.content ||
          (typeof t === "string" ? t : "");
        if (text && text.length > 5) tweets.push(text);
      }

      return Response.json({
        tweets,
        count: tweets.length,
        timeline_length: timeline.length,
        first_item_keys: firstItemKeys,
        first_item_sample: JSON.stringify(timeline[0]).slice(0, 300),
      });
    }

    // timelineが空 or 構造が違う場合
    return Response.json({
      tweets: [],
      raw_keys: allKeys,
      timeline_length: timeline.length,
      raw_sample: JSON.stringify(data).slice(0, 500),
    });

  } catch (e) {
    return Response.json({ tweets: [], error: e.message });
  }
}
