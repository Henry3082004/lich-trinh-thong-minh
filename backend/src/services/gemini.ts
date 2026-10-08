import { config } from "../config";
import { HttpError } from "../lib/http";

// Gọi Gemini dùng chung cho chatbot và AI lên lịch: model chính quá tải thì thử model dự phòng một lần.
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 30000;

export type GeminiContent = { role: "user" | "model"; parts: { text: string }[] };

export async function generate(options: {
  system: string;
  contents: GeminiContent[];
  generationConfig?: Record<string, unknown>;
}): Promise<string> {
  if (!config.geminiApiKey) throw new HttpError(503, "Trợ lý chưa được bật");
  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: options.system }] },
    contents: options.contents,
    generationConfig: { temperature: 0.4, maxOutputTokens: 1024, ...options.generationConfig },
  });
  const models = [config.geminiModel, config.geminiFallbackModel].filter((m, i, a) => m && a.indexOf(m) === i);
  let res: Response | null = null;
  for (const model of models) {
    try {
      res = await fetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": config.geminiApiKey },
        body: payload,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      res = null;
      continue;
    }
    if (res.ok || ![429, 500, 503].includes(res.status)) break;
  }
  if (!res) throw new HttpError(502, "Không kết nối được trợ lý, bạn thử lại sau nhé");
  if (!res.ok) throw new HttpError(502, "Trợ lý đang bận, bạn thử lại sau nhé");
  const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return (body.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
}
