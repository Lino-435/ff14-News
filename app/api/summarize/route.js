const OWNER = "Lino-435";
const REPO = "ff14-news";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

async function saveToGitHub(items, token) {
  if (!token || items.length === 0) return;
  const date = todayKey();
  const path = `data/${date}.json`;
  const content = Buffer.from(JSON.stringify(items, null, 2)).toString("base64");
  let sha;
  try {
    const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
    });
    if (r.ok) sha = (await r.json()).sha;
  } catch {}
  const body = { message: `data: update ${date}`, content, branch: "main" };
  if (sha) body.sha = sha;
  await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: "PUT",
    headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function POST(request) {
  try {
    const { tweets, lodestone_items, yanflash_items } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const githubToken = process.env.GITHUB_TOKEN;
    if (!apiKey) return Response.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

    const limitedTweets = (tweets || []).slice(0, 8);
    const limitedLodestone = (lodestone_items || []).slice(0, 6);
    const limitedYanflash = (yanflash_items || []).slice(0, 8);

    let inputText = "";
    if (limitedLodestone.length > 0) {
      inputText += "【FF14公式 Lodestone】\n";
      limitedLodestone.forEach((item, i) => { inputText += `${i+1}. ${item.title}\n   ${item.description || ""}\n\n`; });
    }
    if (limitedYanflash.length > 0) {
      inputText += "\n【ヤーン速報（コミュニティまとめ）】\n";
      limitedYanflash.forEach((item, i) => { inputText += `${i+1}. ${item.title}\n   ${item.description || ""}\n\n`; });
    }
    if (limitedTweets.length > 0) {
      inputText += "\n【X（Twitter）上のFF14関連投稿】\n";
      limitedTweets.forEach((t, i) => {
        const clean = t.replace(/\tSTART\t[^\t]*\tEND\t/g, "").replace(/\t/g, " ").trim();
        if (clean.length > 5) inputText += `${i+1}. ${clean}\n---\n`;
      });
    }

    console.log(`[summarize] chars:${inputText.length} yanflash:${limitedYanflash.length} lodestone:${limitedLodestone.length} tweets:${limitedTweets.length}`);
    if (!inputText.trim()) return Response.json({ summaries: [] });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: `あなたはFF14情報キュレーターです。以下の情報源からプレイヤーに重要なニュースを抽出し、JSON配列で返してください。

抽出ルール：
- 新コンテンツ・報酬・装備・マウント・イベント・仕様変更を優先
- 「公式未発表だがコミュニティが気づいた変更点」はurgency: highにする
- 期間限定コンテンツ・終了間近のイベントはcategory: limitedにする
- 単なる感想・日記・愚痴は除外し、有益な情報のみ抽出
- 重複する話題はまとめる

各要素：{"title":"30文字以内","summary":"100文字以内の説明","category":"content|reward|buzz|limited","urgency":"high|medium|low","tags":["タグ1","タグ2"],"source":"情報源"}

JSONのみ返してください。\n\n---\n${inputText}`,
        }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: `Anthropic API error: ${res.status}`, detail: err }, { status: 500 });
    }

    const aiData = await res.json();
    const raw = aiData.content?.[0]?.text || "[]";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    let summaries;
    try { summaries = JSON.parse(cleaned); } catch { summaries = []; }

    console.log(`[summarize] count: ${summaries.length}`);
    saveToGitHub(summaries, githubToken).catch(() => {});
    return Response.json({ summaries });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
