export interface AIResult {
  is_abuse: boolean;
  confidence: number;
  type: string;
  reason: string;
}

interface Env {
  AI: any;
  KV: KVNamespace;
}

export async function analyzeRequest(env: Env, data: any): Promise<AIResult> {
  const response = await env.AI.run(
    "@cf/meta/llama-3.3-8b-instruct",
    {
      messages: [
        {
          role: "system",
          content: "You are a cybersecurity AI that detects API abuse."
        },
        {
          role: "user",
          content: `Analyze this request:
${JSON.stringify(data)}

Return JSON:
{
  "is_abuse": boolean,
  "confidence": number,
  "type": "bot/ddos/normal",
  "reason": "short explanation"
}`
        }
      ]
    }
  );

  return JSON.parse(response.response);
}