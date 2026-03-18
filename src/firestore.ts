// Firestore REST API経由でユーザーのプライベートデータを読む
// コイン残高とかはAPIじゃなくてFirestoreに直接入ってる

const FIRESTORE_BASE = "https://firestore.googleapis.com/v1";
const PROJECT_ID = "popopo-prod";

export interface FirestoreDoc {
  name: string;
  fields: Record<string, unknown>;
  createTime?: string;
  updateTime?: string;
}

export interface CoinBalance {
  paid: number;
  free: number;
  raw: Record<string, unknown>;
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
