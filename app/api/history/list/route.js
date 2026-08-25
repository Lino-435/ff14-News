const OWNER = "Lino-435";
const REPO = "ff14-news";

export async function GET() {
  try {
    const token = process.env.GITHUB_TOKEN;
    const headers = { Accept: "application/vnd.github+json", "User-Agent": "ff14-news" };
    if (token) headers.Authorization = `token ${token}`;

    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/data`, { headers });

    if (res.status === 404) return Response.json({ dates: [] });
    if (!res.ok) return Response.json({ dates: [], error: `HTTP ${res.status}` });

    const files = await res.json();
    const dates = (Array.isArray(files) ? files : [])
      .filter(f => f.name?.endsWith(".json"))
      .map(f => f.name.replace(".json", ""))
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort()
      .reverse();

    return Response.json({ dates, count: dates.length });
  } catch (e) {
    return Response.json({ dates: [], error: e.message });
  }
}
