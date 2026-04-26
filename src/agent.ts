import Anthropic from "@anthropic-ai/sdk";
import { searchTexts, getAllTexts } from "./db";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
    _client = new Anthropic({ apiKey: key });
  }
  return _client;
}

const SYSTEM_PROMPT = `You are Hermes Trismegistus, the Thrice-Greatest, master of alchemy, astrology, and theurgy. You draw from a rich knowledge base of primary alchemical and herbal texts.

When answering questions about alchemy, herbalism, or astrology:
1. Cite the primary source (author, work, year) for each claim
2. Use the authentic language of the tradition — tria prima, nigredo/albedo/rubedo, planetary correspondences, signatures
3. Speak with authority and wisdom, but remain practical and helpful
4. Connect theory to practice: if asked about an herb, mention its ruling planet, elemental quality, and therapeutic virtue
5. Reference the macrocosm-microcosm correspondence when appropriate

Knowledge base context will be provided as <sources> tags. Always cite these when relevant.

Format: Provide thoughtful, substantive answers that honor the depth of the tradition. Use the alchemical/herbal terminology naturally.`;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chat(
  userMessage: string,
  history: ChatMessage[] = []
): Promise<string> {
  const client = getClient();

  // Search knowledge base for relevant passages
  const relevantTexts = searchTexts(userMessage);

  const sourcesBlock =
    relevantTexts.length > 0
      ? `<sources>\n${relevantTexts
          .map(
            (t) =>
              `[${t.author}, "${t.work}", ${t.year}]\n${t.content}`
          )
          .join("\n\n---\n\n")}\n</sources>`
      : "";

  const systemWithSources = sourcesBlock
    ? `${SYSTEM_PROMPT}\n\n${sourcesBlock}`
    : SYSTEM_PROMPT;

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: userMessage },
  ];

  const response = await client.messages.create({
    model: process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: systemWithSources,
    messages,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : "The Oracle is silent.";
}

export async function generateForecastNarrative(
  forecastText: string
): Promise<string> {
  const client = getClient();

  const response = await client.messages.create({
    model: process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: `You are Hermes Trismegistus. Given raw ephemeris data, compose a brief (3-5 sentence) daily alchemical forecast rich in symbolic meaning. Reference the planetary positions and their alchemical correspondences. Speak with prophetic authority. End with a practical suggestion for the day's Work.`,
    messages: [
      {
        role: "user",
        content: `Here is today's ephemeris:\n\n${forecastText}\n\nCompose the daily alchemical forecast.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : forecastText;
}

// Send a message via NanoClaw MCP (mcp__nanoclaw__send_message tool)
// This uses Claude with tool use to invoke the NanoClaw tool
export async function sendViaNameclaw(message: string): Promise<void> {
  const client = getClient();
  const nanoclawMcpUrl = process.env.NANOCLAW_MCP_URL;

  if (!nanoclawMcpUrl) {
    console.log("[Hermes] NANOCLAW_MCP_URL not set — logging forecast instead:");
    console.log(message);
    return;
  }

  // Use Claude with mcp__nanoclaw__send_message tool
  try {
    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001",
      max_tokens: 256,
      tools: [
        {
          name: "mcp__nanoclaw__send_message",
          description: "Send a message via NanoClaw messaging system",
          input_schema: {
            type: "object" as const,
            properties: {
              message: {
                type: "string",
                description: "The message content to send",
              },
            },
            required: ["message"],
          },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Send this daily alchemical forecast via NanoClaw: ${message}`,
        },
      ],
    });

    // Handle tool use — call the NanoClaw MCP endpoint
    for (const block of response.content) {
      if (block.type === "tool_use" && block.name === "mcp__nanoclaw__send_message") {
        const input = block.input as { message: string };
        await callNanoclawSendMessage(nanoclawMcpUrl, input.message);
      }
    }
  } catch (err) {
    console.error("[Hermes] Failed to send via NanoClaw:", err);
    console.log("[Hermes] Forecast (not sent):", message);
  }
}

async function callNanoclawSendMessage(
  mcpUrl: string,
  message: string
): Promise<void> {
  const url = mcpUrl.endsWith("/") ? mcpUrl + "send_message" : mcpUrl + "/send_message";

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`NanoClaw send_message returned ${response.status}`);
  }

  console.log("[Hermes] Forecast sent via NanoClaw successfully");
}
