/**
 * Encaminha erros ao Hub (S2S). O segredo fica só no servidor.
 * Env: HUB_ERRORS_API, HUB_ERRORS_SLUG, HUB_ERRORS_SECRET
 */
export type HubErrorPayload = {
  source: 'frontend' | 'backend';
  message: string;
  stack?: string | null;
  method?: string | null;
  path?: string | null;
  statusCode?: number | null;
  userEmail?: string | null;
  userName?: string | null;
  userId?: string | null;
  environment?: string | null;
  metadata?: Record<string, unknown> | null;
};

function hubConfig() {
  const api = process.env.HUB_ERRORS_API?.replace(/\/$/, '');
  const slug = process.env.HUB_ERRORS_SLUG?.trim();
  const secret = process.env.HUB_ERRORS_SECRET?.trim();
  if (!api || !slug || !secret) return null;
  return { api, slug, secret };
}

export function hubErrorsConfigured() {
  return Boolean(hubConfig());
}

async function hubFetch(path: string, init: RequestInit) {
  const cfg = hubConfig();
  if (!cfg) return null;
  const url = `${cfg.api}/public/errors/${encodeURIComponent(cfg.slug)}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-error-secret': cfg.secret,
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    throw new Error(`Hub errors ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : { ok: true };
}

export async function forwardErrorToHub(payload: HubErrorPayload) {
  try {
    return await hubFetch('', {
      method: 'POST',
      body: JSON.stringify({
        source: payload.source,
        message: String(payload.message ?? '').slice(0, 4000),
        stack: payload.stack ? String(payload.stack).slice(0, 20000) : undefined,
        method: payload.method,
        path: payload.path,
        statusCode: payload.statusCode,
        userEmail: payload.userEmail,
        userName: payload.userName,
        userId: payload.userId,
        environment: payload.environment ?? process.env.NODE_ENV,
        metadata: payload.metadata ?? undefined,
      }),
    });
  } catch {
    return null;
  }
}

export async function listErrorsFromHub(limit = 200) {
  return hubFetch(`?limit=${Math.min(Math.max(limit, 1), 500)}`, {
    method: 'GET',
  });
}

export async function clearErrorsOnHub() {
  return hubFetch('', { method: 'DELETE' });
}

export async function exportErrorsFromHub(): Promise<string | null> {
  const cfg = hubConfig();
  if (!cfg) return null;
  const url = `${cfg.api}/public/errors/${encodeURIComponent(cfg.slug)}/export`;
  const res = await fetch(url, {
    headers: { 'x-error-secret': cfg.secret },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  return res.text();
}
