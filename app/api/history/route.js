const OWNER = "Lino-435";
const REPO = "ff14-news";
const BRANCH = "main";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // YYYY-MM-DD
  if (!date) return Response.json({ error: "date required" }, { status: 400 });

  try {
    const path = `data/${date}.json`;
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "ff14-news-app",
        },
      }
    );

    if (res.status === 404) {
      return Response.json({ items: [], exists: false });
    }

    const meta = await res.json();
    const content = Buffer.from(meta.content, "base64").toString("utf-8");
    const items = JSON.parse(content);
    return Response.json({ items, exists: true });
  } catch (e) {
    return Response.json({ items: [], error: e.message });
  }
}
