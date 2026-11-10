import type { ChatMsg } from "./store";

type Block =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };

/** Calls the Messages API. The fixed instructions are cached (prompt caching) to cut the cost per message. */
export async function askClaude(fixed: string, variable: string, messages: ChatMsg[], tools: unknown[]) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Falta ANTHROPIC_API_KEY");
  const r = await fetch(`${process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com"}/v1/messages`, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      max_tokens: 3000,
      system: [
        { type: "text", text: fixed, cache_control: { type: "ephemeral" } },
        { type: "text", text: variable },
      ],
      messages,
      tools,
    }),
  });
  if (!r.ok) {
    console.error("Anthropic", r.status, await r.text());
    throw new Error("La IA no ha respondido");
  }
  const j = (await r.json()) as { content: Block[] };
  const text = j.content
    .filter((b): b is Extract<Block, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  const tool = j.content.find((b): b is Extract<Block, { type: "tool_use" }> => b.type === "tool_use");
  return { text, tool };
}
