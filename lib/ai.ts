import { z } from "zod";
import { ApiError } from "./server";

export async function askClaude<T>(
  schema: z.ZodType<T>,
  system: string,
  content: unknown[],
) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key)
    throw new ApiError(
      "Chưa bật AI cho đội ngũ. Bạn vẫn có thể nhập và xác nhận nội dung thủ công.",
      503,
    );
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": key,
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: 2200,
      system,
      messages: [{ role: "user", content }],
      tools: [
        {
          name: "structured_result",
          description: "Trả kết quả có cấu trúc cho giao diện tiếng Việt.",
          input_schema: z.toJSONSchema(schema),
        },
      ],
      tool_choice: { type: "tool", name: "structured_result" },
    }),
    signal: AbortSignal.timeout(45000),
    cache: "no-store",
  });
  if (!response.ok)
    throw new ApiError(
      "AI đang bận hoặc cấu hình chưa hợp lệ. Thử lại hoặc nhập thủ công.",
      502,
    );
  const result = await response.json();
  const tool = result.content?.find(
    (block: { type: string }) => block.type === "tool_use",
  );
  if (!tool || result.stop_reason === "max_tokens")
    throw new ApiError(
      "AI chưa đọc đầy đủ nội dung. Hãy thử ảnh rõ hơn hoặc nhập thủ công.",
      502,
    );
  return schema.parse(tool.input);
}
