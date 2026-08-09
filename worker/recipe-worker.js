// Cloudflare Worker — recipe extraction proxy.
//
// Why this exists: the web app can't safely call the Anthropic API directly
// from the browser, because that would expose your API key to anyone who
// opens the page's source. This Worker holds the key as a secret on
// Cloudflare's servers and exposes two small endpoints the app calls instead.
//
// Deploy: see README.md. In short —
//   1. workers.cloudflare.com → Create a Worker → paste this file in.
//   2. Settings → Variables → add secret ANTHROPIC_API_KEY (your key from
//      console.anthropic.com).
//   3. (optional but recommended) add variable ALLOWED_ORIGIN set to your
//      GitHub Pages URL, e.g. https://yourname.github.io — restricts who can
//      call this Worker.
//   4. Save/deploy, copy the worker's URL into firebase-config.js as WORKER_URL.

const MODEL = "claude-sonnet-5";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const allowedOrigin = env.ALLOWED_ORIGIN || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (url.pathname === "/extract-url" && request.method === "POST") {
        const { url: pageUrl } = await request.json();
        if (!pageUrl) return json({ error: "Missing url" }, 400, corsHeaders);

        const jinaRes = await fetch("https://r.jina.ai/" + pageUrl);
        if (!jinaRes.ok) return json({ error: "Could not read that page." }, 502, corsHeaders);
        let text = await jinaRes.text();
        text = text.slice(0, 15000);

        const prompt = `You are extracting a single cooking recipe from webpage content below, ignoring blog stories, ads, comments, and unrelated navigation text. Respond with ONLY valid JSON and nothing else — no markdown fences, no commentary. Schema:
{"title": string, "imageUrl": string or null, "ingredients": [string, ...], "instructions": [string, ...]}
Each ingredient should be one line including quantity (e.g. "2 cups all-purpose flour"). Each instruction should be one clear step. imageUrl should be an absolute image URL found in the content that represents the finished dish, or null if none is present. If no recipe is found, return {"title": null, "imageUrl": null, "ingredients": [], "instructions": []}.

WEBPAGE CONTENT:
${text}`;

        const result = await callClaude(env.ANTHROPIC_API_KEY, [{ role: "user", content: prompt }]);
        return json(result, 200, corsHeaders);
      }

      if (url.pathname === "/extract-text" && request.method === "POST") {
        const { text } = await request.json();
        if (!text) return json({ error: "Missing text" }, 400, corsHeaders);

        const prompt = `You are extracting a single cooking recipe from the text below. This may be a social media caption (Instagram, TikTok, etc.), a note, or recipe text pasted from anywhere. Ignore hashtags, decorative emojis, unrelated commentary, and calls-to-action like "link in bio" or "follow for more". Respond with ONLY valid JSON and nothing else — no markdown fences, no commentary. Schema:
{"title": string, "ingredients": [string, ...], "instructions": [string, ...]}
Each ingredient should be one line including quantity where given. Each instruction should be one clear step — if steps aren't spelled out, use your best reasonable interpretation of the order implied by the text. If no recipe is found, return {"title": null, "ingredients": [], "instructions": []}.

TEXT:
${text.slice(0, 8000)}`;

        const result = await callClaude(env.ANTHROPIC_API_KEY, [{ role: "user", content: prompt }]);
        return json(result, 200, corsHeaders);
      }

      if (url.pathname === "/extract-image" && request.method === "POST") {
        const { mediaType, data } = await request.json();
        if (!data) return json({ error: "Missing image" }, 400, corsHeaders);

        const prompt = `This image shows a handwritten or printed recipe card, note, or page. Read it carefully — including handwriting — and respond with ONLY valid JSON and nothing else, no markdown fences, no commentary. Schema:
{"title": string, "ingredients": [string, ...], "instructions": [string, ...]}
Each ingredient should be one line including quantity where legible. Each instruction should be one clear step. Use your best reasonable interpretation for unclear handwriting rather than leaving things blank. If this image is not a recipe, return {"title": null, "ingredients": [], "instructions": []}.`;

        const result = await callClaude(env.ANTHROPIC_API_KEY, [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data } },
            { type: "text", text: prompt },
          ],
        }]);
        return json(result, 200, corsHeaders);
      }

      return json({ error: "Not found" }, 404, corsHeaders);
    } catch (err) {
      return json({ error: err.message || "Server error" }, 500, corsHeaders);
    }
  },
};

async function callClaude(apiKey, messages) {
  if (!apiKey) throw new Error("Server is missing its Anthropic API key. Check the Worker's ANTHROPIC_API_KEY secret.");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 1000, messages }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error((data && data.error && data.error.message) || "Anthropic API request failed.");
  }
  const raw = (data.content || []).map((b) => b.text || "").join("");
  const cleaned = raw.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error("Could not understand the recipe on that source.");
  }
  if (!parsed.title) {
    throw new Error("No recipe found there. Try another source or add it by hand.");
  }
  return parsed;
}

function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}
