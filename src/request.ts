export interface ApiResponse<T = unknown> {
  status: number;
  ok: boolean;
  data: T;
  raw: Response;
}

export interface RequestConfig {
  baseUrl: string;
  token?: string;
  appCheckToken?: string;
  fetch?: typeof globalThis.fetch;
}

export async function request<T = unknown>(
  config: RequestConfig,
  method: string,
  path: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  const url = `${config.baseUrl}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.token) {
    headers["Authorization"] = `Bearer ${config.token}`;
  }

  if (config.appCheckToken) {
    headers["X-Firebase-AppCheck"] = config.appCheckToken;
  }

  const init: RequestInit = { method, headers };

  if (body !== undefined && method !== "GET") {
    init.body = JSON.stringify(body);
  }

  const f = config.fetch ?? globalThis.fetch;
  const res = await f(url, init);
  const text = await res.text();

  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    data = text as T;
  }

  if (!res.ok) {
    throw new PopopoApiError(res.status, res.statusText, url, data, res);
  }

  return { status: res.status, ok: true, data, raw: res };
}

export class PopopoApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly url: string,
    public readonly body: unknown,
    public readonly response: Response,
  ) {
    super(`${status} ${statusText} - ${url}`);
    this.name = "PopopoApiError";
  }
}
