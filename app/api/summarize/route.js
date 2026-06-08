export async function POST(request) {
  try {
    const { tweets, lodestone_items } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return Response.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
    }

    // 入力テキストを組み立て
    let inputText = "";

    if (lodestone_items && lodestone_items.length > 0) {
      inputText += "【FF14公式 Lodestone お知らせ】\n";
      lodestone_items.forEach((item, i) => {
        inputText += `${i + 1}. ${item.title}\n   ${item.description}\n\n`;
      });
    }

    if (tweets && tweets.length > 0) {
      inputText += "\n【X（Twitter）上のFF14関連投稿】\n";
      tweets.forEach((t, i) => {
        inputText += `${i + 1}. ${t}\n---\n`;
      });
    }

    if (!inputText.trim()) {
      return Response.json({ summaries: [] });
    }

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
        messages: [
          {
            role: "user",
            content: `あなたはFF14（ファイナルファンタジー14）の情報キュレーターです。
以下の情報源からFF14プレイヤーにとって重要・有益なニュースを抽出し、JSON配列で返してください。

抽出ルール：
- パッチ情報、仕様変更、新コンテンツ、イベント、報酬情報を優先
- 「公式は大々的に発信していないが、コミュニティが気づいた変更点」は特に重要度を高くする
- 単なる感想やプレイ日記は除外
- 重複する話題はまとめる

各要素のフォーマット：
{
  "title": "30文字以内のタイトル",
  "summary": "100文字以内の説明",
  "category": "content|reward|buzz|limited のいずれか",
  "urgency": "high|medium|low",
  "tags": ["タグ1", "タグ2"],
  "source": "情報源（公式/X/コミュニティ等）"
}

JSONのみを返してください。マークダウンの装飾は不要です。

---
${inputText}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: `Anthropic API error: ${res.status}`, detail: errText }, { status: 500 });
    }

    const aiData = await res.json();
    const raw = aiData.content?.[0]?.text || "[]";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let summaries;
    try {
      summaries = JSON.parse(cleaned);
    } catch {
      summaries = [];
    }

    return Response.json({ summaries });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
