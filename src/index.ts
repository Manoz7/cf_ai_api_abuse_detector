/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
interface Env {
  AI: any;
  REQUEST_LOG: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (request.method === "GET") {
      return new Response(JSON.stringify({
        status: "ok",
        service: "cf_ai_api_abuse_detector"
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Stats endpoint
    if (url.pathname === "/stats") {
      return new Response(JSON.stringify({
        message: "Stats endpoint (extendable)"
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (request.method !== "POST") {
      return new Response("Only POST requests allowed", { status: 405 });
    }

    const body: any = await request.json();

    // Input validation
    if (
      typeof body.endpoint !== "string" ||
      typeof body.requests_per_min !== "number" ||
      typeof body.user_agent !== "string"
    ) {
      return new Response(JSON.stringify({
        error: "Invalid input format"
      }), { status: 400 });
    }

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";

    // Load history
    let history = await env.REQUEST_LOG.get(ip, "json") as {
      requests: number;
      flags: number;
      blocks: number;
      last_block_time?: number;
    } | null;

    if (!history) {
      history = {
        requests: 0,
        flags: 0,
        blocks: 0
      };
    }

    const now = Date.now();

    // Cooldown logic
    if (history.last_block_time && now - history.last_block_time < 60000) {
      return new Response(JSON.stringify({
        action: "BLOCK",
        reason: "Temporary cooldown active"
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Hard rule
    if (body.requests_per_min > 300) {
      return new Response(JSON.stringify({
        action: "BLOCK",
        reason: "Rate limit exceeded"
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // AI Prompt
    const prompt = `
You are a cybersecurity AI detecting API abuse.

INPUT:
Endpoint: ${body.endpoint}
Requests per minute: ${body.requests_per_min}
User Agent: ${body.user_agent}

HISTORY:
Total Requests: ${history.requests}
Flags: ${history.flags}
Blocks: ${history.blocks}

RULES:
- High request rate + bot user agent = abuse
- Repeated flags/blocks increase likelihood
- Normal traffic should NOT be flagged

OUTPUT STRICT JSON:
{
  "is_abuse": boolean,
  "confidence": number,
  "type": "bot | human | ddos | unknown",
  "reason": "short explanation"
}
`;

    const aiResponse = await env.AI.run(
      "@cf/meta/llama-3.3-8b-instruct",
      {
        messages: [
          { role: "system", content: "You detect API abuse." },
          { role: "user", content: prompt }
        ]
      }
    );

    const output = (aiResponse as any).response || "";

    let aiResult: any = null;

    try {
      const match = output.match(/\{[\s\S]*\}/);
      if (match) {
        aiResult = JSON.parse(match[0]);
      }
    } catch {
      aiResult = { error: "Invalid AI response" };
    }

    // Risk scoring
    let riskScore = 0;

    if (aiResult?.is_abuse) {
      riskScore += aiResult.confidence * 60;
    }

    if (body.requests_per_min > 100) riskScore += 20;

    riskScore += history.flags * 5;
    riskScore += history.blocks * 10;

    riskScore = Math.min(100, Math.round(riskScore));

    // Decision
    let action = "ALLOW";

    if (riskScore >= 80) action = "BLOCK";
    else if (riskScore >= 50) action = "FLAG";

    // Repeat offender override
    if (history.flags >= 3) {
      action = "BLOCK";
    }

    // Update history
    history.requests += 1;

    if (action === "FLAG") history.flags += 1;

    if (action === "BLOCK") {
      history.blocks += 1;
      history.last_block_time = now;
    }

    await env.REQUEST_LOG.put(ip, JSON.stringify(history));

    return new Response(JSON.stringify({
      success: true,
      data: {
        ip,
        action,
        risk_score: riskScore,
        ai_result: aiResult,
        history
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });
  },
} satisfies ExportedHandler<Env>;

