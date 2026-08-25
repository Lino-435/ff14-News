const OWNER = "Lino-435";
const REPO = "ff14-news";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// タイトルを正規化して重複判定に使う
function normalizeTitle(t) {
  return (t || "").toLowerCase().replace(/[\s　「」【】、。！？!?.,・:：\-—–]/g, "");
}

// 既存データを取得
async function loadExisting(date, token) {
  const path = `data/${date}.json`;
  try {
    const headers = { Accept: "application/vnd.github+json", "User-Agent": "ff14-news" };
    if (token) headers.Authorization = `token ${token}`;
    const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, { headers });
    if (!r.ok) return { items: [], sha: null };
    const d = await r.json();
    const content = Buffer.from(d.content, "base64").toString("utf-8");
    return { items: JSON.parse(content), sha: d.sha };
  } catch {
    return { items: [], sha: null };
  }
}

// マージして保存（上書きではなく累積）
async function mergeAndSave(newItems, token) {
  if (!token || newItems.length === 0) return { merged: newItems, added: 0 };

  const date = todayKey();
  const { items: existing, sha } = await loadExisting(date, token);

  // 既存タイトルのセット
  const seen = new Set(existing.map(i => normalizeTitle(i.title)));
  const added = [];

  for (const item of newItems) {
    const key = normalizeTitle(item.title);
    if (!seen.has(key)) {
      seen.add(key);
      added.push({ ...item, firstSeen: new Date().toISOString() });
    }
  }

  // 既存 + 新規（新しいものを上に）
  const merged = [...added, ...existing];

  const path = `data/${date}.json`;
  const content = Buffer.from(JSON.stringify(merged, null, 2)).toString("base64");
  const body = { message: `data: ${date} (+${added.length} items, total ${merged.length})`, content, branch: "main" };
  if (sha) body.sha = sha;

  await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: "PUT",
    headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return { merged, added: added.length };
}

export async function POST(request) {
  try {
    const { tweets, lodestone_items, yanflash_items, reddit_items } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const githubToken = process.env.GITHUB_TOKEN;
    if (!apiKey) return Response.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

    const limitedTweets = (tweets || []).slice(0, 8);
    const limitedLodestone = (lodestone_items || []).slice(0, 6);
    const limitedYanflash = (yanflash_items || []).slice(0, 8);
    const limitedReddit = (reddit_items || []).slice(0, 8);

    let inputText = "";
    if (limitedLodestone.length > 0) {
      inputText += "【FF14公式 Lodestone】\n";
      limitedLodestone.forEach((item, i) => { inputText += `${i+1}. ${item.title}\n   ${item.description || ""}\n\n`; });
    }
    if (limitedYanflash.length > 0) {
      inputText += "\n【ヤーン速報（国内コミュニティまとめ）】\n";
      limitedYanflash.forEach((item, i) => { inputText += `${i+1}. ${item.title}\n   ${item.description || ""}\n\n`; });
    }
    if (limitedReddit.length > 0) {
      inputText += "\n【Reddit r/ffxivdiscussion（海外コミュニティ議論）】\n";
      limitedReddit.forEach((item, i) => { inputText += `${i+1}. ${item.title}\n   ${item.description || ""}\n\n`; });
    }
    if (limitedTweets.length > 0) {
      inputText += "\n【X（Twitter）上のFF14関連投稿】\n";
      limitedTweets.forEach((t, i) => {
        const clean = t.replace(/\tSTART\t[^\t]*\tEND\t/g, "").replace(/\t/g, " ").trim();
        if (clean.length > 5) inputText += `${i+1}. ${clean}\n---\n`;
      });
    }

    if (!inputText.trim()) return Response.json({ summaries: [] });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 3000,
        messages: [{
          role: "user",
          content: `あなたはFF14情報キュレーターです。以下の情報源からプレイヤーに有益なニュースを抽出し、JSON配列で返してください。

抽出ルール：
- 新コンテンツ・報酬・装備・マウント・ミニオン・イベント・仕様変更を優先
- 「公式未発表だがコミュニティが気づいた変更点」はurgency: highにする
- 期間限定コンテンツ・終了間近のイベントはcategory: limitedにする
- 人間関係の相談・個人の感想文・ファンアート紹介は除外
- 定型スレッド（Megathread等）は除外
- 国内外で同じ話題があればまとめる
- 情報として成立するものは幅広く拾い、12〜15件程度を目安に多めに抽出する

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

    // マージして保存 → マージ後の全件を返す
    const { merged, added } = await mergeAndSave(summaries, githubToken);

    console.log(`[summarize] new:${summaries.length} added:${added} total:${merged.length}`);
    return Response.json({ summaries: merged, added, total: merged.length });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
