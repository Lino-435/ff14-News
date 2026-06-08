const OWNER = "Lino-435";
const REPO = "ff14-news";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

async function saveToGitHub(items, token) {
  if (!token) return;
  const date = todayKey();
  const path = `data/${date}.json`;
  const content = Buffer.from(JSON.stringify(items, null, 2)).toString("base64");

  // 既存ファイルのSHAを取得（更新の場合に必要）
  let sha;
  try {
    const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
    });
    if (r.ok) {
      const d = await r.json();
      sha = d.sha;
    }
  } catch {}

  const body = {
    message: `data: update ${date}`,
    content,
    branch: "main",
  };
  if (sha) body.sha = sha;

  await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function POST(request) {
  try {
    const { tweets, lodestone_items } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const githubToken = process.env.GITHUB_TOKEN;

    if (!apiKey) return Response.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

    let inputText = "";
    if (lodestone_items?.length > 0) {
      inputText += "【FF14公式 Lodestone】\n";
      lodestone_items.forEach((item, i) => {
        inputText += `${i+1}. ${item.title}\n   ${item.description}\n\n`;
      });
    }
    if (tweets?.length > 0) {
      inputText += "\n【X（Twitter）上のFF14関連投稿】\n";
      tweets.forEach((t, i) => { inputText += `${i+1}. ${t}\n---\n`; });
    }

    if (!inputText.trim()) return Response.json({ summaries: [] });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: `あなたはFF14情報キュレーターです。以下の情報からプレイヤーに重要なニュースを抽出し、JSON配列で返してください。

抽出ルール：
- パッチ情報、仕様変更、新コンテンツ、イベント、報酬情報を優先
- 「公式未発表だがコミュニティが気づいた変更点」は urgency: high にする
- 単なる感想・日記は除外
- 重複する話題はまとめる

各要素：{"title":"30文字以内","summary":"100文字以内","category":"content|reward|buzz|limited","urgency":"high|medium|low","tags":["タグ"],"source":"情報源"}

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

    // GitHubに自動保存（失敗しても結果は返す）
    saveToGitHub(summaries, githubToken).catch(() => {});

    return Response.json({ summaries });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
