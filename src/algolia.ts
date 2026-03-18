// Algolia検索クライアント
// POPOPOはAlgoliaでユーザー/商品/ライブの検索をしている

const APP_ID = "59S66KMOYI";
const SEARCH_KEY = "d5999d3f32c467d3798f165d3fedc2e1";
const BASE_URL = `https://${APP_ID}-dsn.algolia.net`;

export interface AlgoliaConfig {
  appId?: string;
  searchKey?: string;
  fetch?: typeof globalThis.fetch;
}

export interface SearchParams {
  query?: string;
  hitsPerPage?: number;
  page?: number;
  filters?: string;
  facetFilters?: string[];
  [key: string]: unknown;
}

export interface SearchResult<T = Record<string, unknown>> {
  hits: T[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  query: string;
}

export interface AlgoliaUser {
  objectID: string;
  name?: string;
  alias?: string;
  look?: {
    id?: string;
    kind?: string;
    name?: string;
    icon?: string;
  };
  [key: string]: unknown;
}

export interface AlgoliaItem {
  objectID: string;
  item_distribution_id?: string;
  name?: string;
  description?: string;
  price?: number;
  sale_price?: number;
  on_sale?: boolean;
  sale_discount_rate?: number;
  model_number?: string;
  is_charge_only?: boolean;
  is_searchable?: boolean;
  [key: string]: unknown;
}

export interface AlgoliaLive {
  objectID: string;
  spaceKey?: string;
  userId?: string;
  genreId?: string;
  tags?: string[];
  canEnter?: boolean;
  currentCount?: number;
  [key: string]: unknown;
}

async function search<T>(
  index: string,
  params: SearchParams = {},
  cfg?: AlgoliaConfig,
): Promise<SearchResult<T>> {
  const appId = cfg?.appId ?? APP_ID;
  const key = cfg?.searchKey ?? SEARCH_KEY;
  const fetcher = cfg?.fetch ?? globalThis.fetch;

  const searchParams = new URLSearchParams();
  if (params.query !== undefined) searchParams.set("query", params.query);
  if (params.hitsPerPage !== undefined) searchParams.set("hitsPerPage", String(params.hitsPerPage));
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.filters) searchParams.set("filters", params.filters);
  if (params.facetFilters) searchParams.set("facetFilters", JSON.stringify(params.facetFilters));

  const res = await fetcher(`https://${appId}-dsn.algolia.net/1/indexes/*/queries`, {
    method: "POST",
    headers: {
      "X-Algolia-Application-Id": appId,
      "X-Algolia-API-Key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [{ indexName: index, params: searchParams.toString() }],
    }),
  });

  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(`Algolia ${res.status}: ${JSON.stringify(data)}`);
  }

  const results = (data["results"] as Record<string, unknown>[])?.[0];
  if (!results) throw new Error("Algoliaのレスポンスが空です");

  return {
    hits: (results["hits"] ?? []) as T[],
    nbHits: results["nbHits"] as number,
    page: results["page"] as number,
    nbPages: results["nbPages"] as number,
    hitsPerPage: results["hitsPerPage"] as number,
    query: results["query"] as string,
  };
}

// ユーザー検索
export function searchUsers(params: SearchParams = {}, cfg?: AlgoliaConfig): Promise<SearchResult<AlgoliaUser>> {
  return search<AlgoliaUser>("users", params, cfg);
}

// ショップ商品検索
export function searchItems(params: SearchParams = {}, cfg?: AlgoliaConfig): Promise<SearchResult<AlgoliaItem>> {
  return search<AlgoliaItem>("items", params, cfg);
}

// ライブ検索
export function searchLives(params: SearchParams = {}, cfg?: AlgoliaConfig): Promise<SearchResult<AlgoliaLive>> {
  return search<AlgoliaLive>("lives", params, cfg);
}

// 全件取得ジェネレーター
export async function* paginateAll<T>(
  index: string,
  params: SearchParams = {},
  cfg?: AlgoliaConfig,
): AsyncGenerator<T> {
  let page = 0;
  const perPage = params.hitsPerPage ?? 100;
  while (true) {
    const result = await search<T>(index, { ...params, page, hitsPerPage: perPage }, cfg);
    yield* result.hits;
    page++;
    if (page >= result.nbPages) break;
  }
}
