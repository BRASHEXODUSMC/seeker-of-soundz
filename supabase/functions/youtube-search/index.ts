// Seeker Of SoundZ v4.21.2 — YouTube search proxy
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const apiKey = Deno.env.get("YOUTUBE_DATA_API_KEY");
    if (!apiKey) return json({ error: "YOUTUBE_DATA_API_KEY is not configured." }, 503);

    const body = await request.json().catch(() => ({}));
    const query = String(body?.query ?? "").trim();
    const requested = Number(body?.maxResults ?? 12);
    const maxResults = Math.max(1, Math.min(20, Number.isFinite(requested) ? requested : 12));

    if (!query) return json({ error: "A search query is required." }, 400);

    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("safeSearch", "moderate");
    url.searchParams.set("maxResults", String(maxResults));
    url.searchParams.set("q", query);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        payload?.error?.message ??
        `YouTube search failed with status ${response.status}.`;
      return json({ error: message }, response.status);
    }

    const items = Array.isArray(payload?.items)
      ? payload.items
          .map((item: any) => ({
            videoId: String(item?.id?.videoId ?? ""),
            title: String(item?.snippet?.title ?? ""),
            description: String(item?.snippet?.description ?? ""),
            channelTitle: String(item?.snippet?.channelTitle ?? ""),
            publishedAt: String(item?.snippet?.publishedAt ?? ""),
            thumbnail:
              item?.snippet?.thumbnails?.medium?.url ??
              item?.snippet?.thumbnails?.high?.url ??
              item?.snippet?.thumbnails?.default?.url ??
              "",
          }))
          .filter((item: any) => item.videoId)
      : [];

    return json({ items });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected search error." }, 500);
  }
});
