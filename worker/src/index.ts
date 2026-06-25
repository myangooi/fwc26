import type { Env } from "./types";
import { transformToGroupsBlob, transformToKnockoutBlob } from "./transform";
import type { FDMatch, FDStandingGroup } from "./types";

const FD_BASE = "https://api.football-data.org/v4";
const KV_GROUPS = "wc2026:groups";
const KV_KNOCKOUT = "wc2026:knockout";
const CRON_STOP = new Date("2026-07-21T00:00:00Z");

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function handleEndpoint(
  request: Request,
  env: Env,
  kvKey: string,
): Promise<Response> {
  // Cache API can be unreliable in wrangler dev — wrap in try/catch
  try {
    const cache = caches.default;
    const cached = await cache.match(request);
    if (cached) return cached;
  } catch (e) {
    console.warn('Cache read skipped:', e);
  }

  const data = await env.WC2026_KV.get(kvKey);
  if (!data) {
    return new Response(JSON.stringify({ error: "Data not available" }), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(env.CORS_ORIGIN),
      },
    });
  }

  const response = new Response(data, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=1800",
      ...corsHeaders(env.CORS_ORIGIN),
    },
  });

  try {
    const cache = caches.default;
    await cache.put(request, response.clone());
  } catch (e) {
    console.warn('Cache write skipped:', e);
  }

  return response;
}

async function purgeCacheUrls(env: Env): Promise<void> {
  if (!env.CF_API_TOKEN || !env.CF_ZONE_ID || !env.CF_WORKER_URL) return;
  await fetch(
    `https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/purge_cache`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: [`${env.CF_WORKER_URL}/groups`, `${env.CF_WORKER_URL}/knockout`],
      }),
    },
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(env.CORS_ORIGIN),
      });
    }

    if (url.pathname === "/groups")
      return handleEndpoint(request, env, KV_GROUPS);
    if (url.pathname === "/knockout")
      return handleEndpoint(request, env, KV_KNOCKOUT);

    return new Response("Not Found", {
      status: 404,
      headers: corsHeaders(env.CORS_ORIGIN),
    });
    } catch (e) {
      console.error('fetch handler error:', e instanceof Error ? e.stack : e);
      return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
    }
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    if (new Date() > CRON_STOP) return;

    const fdHeaders = { 'X-Auth-Token': env.FOOTBALL_DATA_API_KEY };

    // Fetch matches first, then check remaining rate limit before second request
    const matchesRes = await fetch(`${FD_BASE}/competitions/WC/matches`, { headers: fdHeaders });

    if (matchesRes.status === 429) {
      const resetIn = parseInt(matchesRes.headers.get('X-RequestCounter-Reset') ?? '60', 10);
      return; // Keep existing KV data untouched
    }
    if (!matchesRes.ok) {
      console.error(`football-data.org /matches error: ${matchesRes.status}`);
      return;
    }

    // Throttle: if only 1 request remaining, wait for counter reset before second call
    const available = parseInt(matchesRes.headers.get('X-RequestsAvailable') ?? '10', 10);
    if (available <= 1) {
      // Cap at 25s to stay within the Workers scheduled-handler CPU limit
      const resetIn = Math.min(parseInt(matchesRes.headers.get('X-RequestCounter-Reset') ?? '60', 10), 25);
      await new Promise<void>(resolve => setTimeout(resolve, resetIn * 1000));
    }

    const standingsRes = await fetch(`${FD_BASE}/competitions/WC/standings`, { headers: fdHeaders });

    if (standingsRes.status === 429) {
      return;
    }
    if (!standingsRes.ok) {
      console.error(`football-data.org /standings error: ${standingsRes.status}`);
      return;
    }

    const [matchesBody, standingsBody] = await Promise.all([
      matchesRes.json() as Promise<Record<string, unknown>>,
      standingsRes.json() as Promise<Record<string, unknown>>,
    ]);

    const matches = (matchesBody.matches ?? []) as FDMatch[];
    const standings = (standingsBody.standings ?? []) as FDStandingGroup[];

    await Promise.all([
      env.WC2026_KV.put(KV_GROUPS, JSON.stringify(transformToGroupsBlob(matches, standings))),
      env.WC2026_KV.put(KV_KNOCKOUT, JSON.stringify(transformToKnockoutBlob(matches))),
    ]);

    await purgeCacheUrls(env);
  },
};
