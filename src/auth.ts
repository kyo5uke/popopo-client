const FIREBASE_API_KEY = "AIzaSyAmY4T-_U3IGS_TvD5ERQsr2HQsHUmaapc";
const IDENTITY_TOOLKIT = "https://www.googleapis.com/identitytoolkit/v3/relyingparty";
const SECURE_TOKEN = "https://securetoken.googleapis.com/v1";

export interface AuthSession {
  idToken: string;
  refreshToken: string;
  localId: string;
  expiresIn: number;
  email?: string;
}

export interface AuthOptions {
  apiKey?: string;
  fetch?: typeof globalThis.fetch;
}

function key(opts?: AuthOptions): string {
  return opts?.apiKey ?? FIREBASE_API_KEY;
}

function f(opts?: AuthOptions): typeof globalThis.fetch {
  return opts?.fetch ?? globalThis.fetch;
}

export async function signInAnonymously(opts?: AuthOptions): Promise<AuthSession> {
  const res = await f(opts)(`${IDENTITY_TOOLKIT}/signupNewUser?key=${key(opts)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  return parseAuthResponse(res);
}

export async function signInWithEmail(
  email: string,
  password: string,
  opts?: AuthOptions,
): Promise<AuthSession> {
  const res = await f(opts)(`${IDENTITY_TOOLKIT}/verifyPassword?key=${key(opts)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  return parseAuthResponse(res);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  opts?: AuthOptions,
): Promise<AuthSession> {
  const res = await f(opts)(`${IDENTITY_TOOLKIT}/signupNewUser?key=${key(opts)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  return parseAuthResponse(res);
}

export async function refreshToken(
  token: string,
  opts?: AuthOptions,
): Promise<AuthSession> {
  const res = await f(opts)(`${SECURE_TOKEN}/token?key=${key(opts)}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(token)}`,
  });
  const data = await res.json() as Record<string, unknown>;

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${JSON.stringify(data)}`);
  }

  return {
    idToken: data["id_token"] as string,
    refreshToken: data["refresh_token"] as string,
    localId: data["user_id"] as string,
    expiresIn: Number(data["expires_in"]),
  };
}

async function parseAuthResponse(res: Response): Promise<AuthSession> {
  const data = await res.json() as Record<string, unknown>;

  if (!res.ok) {
    throw new Error(`Auth failed: ${res.status} ${JSON.stringify(data)}`);
  }

  return {
    idToken: data["idToken"] as string,
    refreshToken: data["refreshToken"] as string,
    localId: data["localId"] as string,
    expiresIn: Number(data["expiresIn"]),
    email: data["email"] as string | undefined,
  };
}
