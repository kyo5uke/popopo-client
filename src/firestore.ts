// Firestore REST API経由でユーザーのプライベートデータを読む
// コイン残高とかはAPIじゃなくてFirestoreに直接入ってる

import type { CoinBalance } from "./types.ts";

const FIRESTORE_BASE = "https://firestore.googleapis.com/v1";
const PROJECT_ID = "popopo-prod";

export interface FirestoreDoc {
  name: string;
  fields: Record<string, unknown>;
  createTime?: string;
  updateTime?: string;
}

export interface FirestoreOptions {
  projectId?: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

function docUrl(collection: string, docId: string, opts?: FirestoreOptions): string {
  const base = opts?.baseUrl ?? FIRESTORE_BASE;
  const proj = opts?.projectId ?? PROJECT_ID;
  return `${base}/projects/${proj}/databases/(default)/documents/${collection}/${docId}`;
}

// Firestoreドキュメント取得
export async function getDocument(
  idToken: string,
  collection: string,
  docId: string,
  opts?: FirestoreOptions,
): Promise<FirestoreDoc> {
  const url = docUrl(collection, docId, opts);
  const fetcher = opts?.fetch ?? globalThis.fetch;
  const res = await fetcher(url, {
    headers: { "Authorization": `Bearer ${idToken}` },
  });
  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(`Firestore ${res.status}: ${JSON.stringify(data)}`);
  }
  return {
    name: data["name"] as string,
    fields: decodeFields(data["fields"]),
    createTime: data["createTime"] as string | undefined,
    updateTime: data["updateTime"] as string | undefined,
  };
}

// ユーザーのコイン残高を取得
export async function getCoinBalance(
  idToken: string,
  userId: string,
  opts?: FirestoreOptions,
): Promise<CoinBalance> {
  const doc = await getDocument(idToken, "user-privates", userId, opts);
  const fields = doc.fields as Record<string, unknown>;

  // coinBalancesの構造を解析
  const balances = fields["coinBalances"];
  let paid = 0;
  let free = 0;

  if (Array.isArray(balances)) {
    for (const item of balances) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const scope = String(rec["scope"] ?? rec["kind"] ?? rec["name"] ?? "");
      const amount = Number(rec["balance"] ?? rec["amount"] ?? rec["value"] ?? 0);
      if (scope.toLowerCase().includes("paid")) paid = amount;
      if (scope.toLowerCase().includes("free")) free = amount;
    }
  } else if (balances && typeof balances === "object") {
    for (const [k, v] of Object.entries(balances as Record<string, unknown>)) {
      const amount = typeof v === "number" ? v :
        (v && typeof v === "object") ? Number((v as Record<string, unknown>)["balance"] ?? 0) : 0;
      if (k.toLowerCase().includes("paid")) paid = amount;
      if (k.toLowerCase().includes("free")) free = amount;
    }
  }

  return { paid, free, raw: fields };
}

// コレクション内のドキュメント一覧を取得
export async function listDocuments(
  idToken: string,
  collectionPath: string,
  params: { limit?: number; orderBy?: string; pageToken?: string } = {},
  opts?: FirestoreOptions,
): Promise<{ documents: FirestoreDoc[]; nextPageToken?: string }> {
  const base = opts?.baseUrl ?? FIRESTORE_BASE;
  const proj = opts?.projectId ?? PROJECT_ID;
  const url = new URL(`${base}/projects/${proj}/databases/(default)/documents/${collectionPath}`);
  if (params.limit) url.searchParams.set("pageSize", String(params.limit));
  if (params.orderBy) url.searchParams.set("orderBy", params.orderBy);
  if (params.pageToken) url.searchParams.set("pageToken", params.pageToken);

  const fetcher = opts?.fetch ?? globalThis.fetch;
  const res = await fetcher(url.toString(), {
    headers: { "Authorization": `Bearer ${idToken}` },
  });
  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(`Firestore ${res.status}: ${JSON.stringify(data)}`);
  }

  const rawDocs = (data["documents"] ?? []) as Record<string, unknown>[];
  return {
    documents: rawDocs.map((d) => ({
      name: d["name"] as string,
      fields: decodeFields(d["fields"]),
      createTime: d["createTime"] as string | undefined,
      updateTime: d["updateTime"] as string | undefined,
    })),
    nextPageToken: data["nextPageToken"] as string | undefined,
  };
}

// スペースのメッセージ一覧を取得
export async function listSpaceMessages(
  idToken: string,
  spaceKey: string,
  params: { limit?: number; orderBy?: string; pageToken?: string } = {},
  opts?: FirestoreOptions,
): Promise<{ messages: ParsedMessage[]; nextPageToken?: string }> {
  const result = await listDocuments(idToken, `spaces/${spaceKey}/space-messages`, {
    limit: params.limit ?? 50,
    orderBy: params.orderBy ?? "created_at desc",
    pageToken: params.pageToken,
  }, opts);

  return {
    messages: result.documents.map(docToMessage),
    nextPageToken: result.nextPageToken,
  };
}

// ライブのコメント一覧を取得
export async function listLiveComments(
  idToken: string,
  spaceKey: string,
  liveId: string,
  params: { limit?: number; orderBy?: string; pageToken?: string } = {},
  opts?: FirestoreOptions,
): Promise<{ comments: ParsedComment[]; nextPageToken?: string }> {
  const result = await listDocuments(idToken, `spaces/${spaceKey}/lives/${liveId}/comments`, {
    limit: params.limit ?? 50,
    orderBy: params.orderBy ?? "created_at desc",
    pageToken: params.pageToken,
  }, opts);

  return {
    comments: result.documents.map(docToComment),
    nextPageToken: result.nextPageToken,
  };
}

export interface ParsedMessage {
  id: string;
  kind?: string;
  value?: string;
  userId?: string;
  userName?: string;
  userAlias?: string;
  userIcon?: string;
  createdAt?: number;
  raw: Record<string, unknown>;
}

export interface ParsedComment {
  id: string;
  kind?: string;
  value?: string;
  userId?: string;
  userName?: string;
  userAlias?: string;
  userIcon?: string;
  priority?: number;
  createdAt?: number;
  raw: Record<string, unknown>;
}

function docToMessage(doc: FirestoreDoc): ParsedMessage {
  const f = doc.fields as Record<string, unknown>;
  const user = (f["user"] ?? {}) as Record<string, unknown>;
  return {
    id: doc.name.split("/").pop()!,
    kind: f["kind"] as string | undefined,
    value: f["value"] as string | undefined,
    userId: user["id"] as string | undefined,
    userName: user["name"] as string | undefined,
    userAlias: user["alias"] as string | undefined,
    userIcon: user["icon"] as string | undefined,
    createdAt: f["created_at"] as number | undefined,
    raw: f,
  };
}

function docToComment(doc: FirestoreDoc): ParsedComment {
  const f = doc.fields as Record<string, unknown>;
  const user = (f["user"] ?? {}) as Record<string, unknown>;
  return {
    id: doc.name.split("/").pop()!,
    kind: f["kind"] as string | undefined,
    value: f["value"] as string | undefined,
    userId: user["id"] as string | undefined,
    userName: user["name"] as string | undefined,
    userAlias: user["alias"] as string | undefined,
    userIcon: user["icon"] as string | undefined,
    priority: f["priority"] as number | undefined,
    createdAt: f["created_at"] as number | undefined,
    raw: f,
  };
}

// Firestoreのフィールド型をJSの値にデコード
function decodeFields(fields: unknown): Record<string, unknown> {
  if (!fields || typeof fields !== "object") return {};
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields as Record<string, unknown>)) {
    result[k] = decodeValue(v);
  }
  return result;
}

function decodeValue(v: unknown): unknown {
  if (!v || typeof v !== "object") return v;
  const r = v as Record<string, unknown>;

  if ("nullValue" in r) return null;
  if ("booleanValue" in r) return r["booleanValue"];
  if ("stringValue" in r) return r["stringValue"];
  if ("integerValue" in r) return Number(r["integerValue"]);
  if ("doubleValue" in r) return Number(r["doubleValue"]);
  if ("timestampValue" in r) return r["timestampValue"];
  if ("referenceValue" in r) return r["referenceValue"];
  if ("bytesValue" in r) return r["bytesValue"];
  if ("geoPointValue" in r) return r["geoPointValue"];
  if ("arrayValue" in r) {
    const values = (r["arrayValue"] as Record<string, unknown>)?.["values"];
    return Array.isArray(values) ? values.map(decodeValue) : [];
  }
  if ("mapValue" in r) {
    return decodeFields((r["mapValue"] as Record<string, unknown>)?.["fields"]);
  }
  return r;
}
