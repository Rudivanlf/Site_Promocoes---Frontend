interface AuthPayload {
  email: string;
  password: string;
}

interface ApiObject {
  [key: string]: unknown;
}

export interface AuthResult {
  userEmail: string;
  token?: string;
}

interface RequestAttemptOptions {
  paths: string[];
  methods: string[];
  fallbackError: string;
  operationName: string;
}

const API_BASE_URL = (import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const REGISTER_PATH = import.meta.env.VITE_AUTH_REGISTER_PATH || "/api/usuarios/";
const LOGIN_PATH = import.meta.env.VITE_AUTH_LOGIN_PATH || "/api/usuarios/login/";
const REGISTER_PATHS = parseCsv(
  import.meta.env.VITE_AUTH_REGISTER_PATHS,
  [REGISTER_PATH, "/api/usuarios/cadastro/", "/api/usuarios/register/"]
);
const LOGIN_PATHS = parseCsv(
  import.meta.env.VITE_AUTH_LOGIN_PATHS,
  [LOGIN_PATH, "/api/login/", "/api/token/"]
);
const REGISTER_METHODS = parseCsv(import.meta.env.VITE_AUTH_REGISTER_METHODS, ["POST"]);
const LOGIN_METHODS = parseCsv(import.meta.env.VITE_AUTH_LOGIN_METHODS, ["POST"]);
const AUTH_EMAIL_FIELD = import.meta.env.VITE_AUTH_EMAIL_FIELD || "email";
const AUTH_PASSWORD_FIELD = import.meta.env.VITE_AUTH_PASSWORD_FIELD || "password";

function parseCsv(rawValue: string | undefined, fallback: string[]): string[] {
  const source = rawValue || fallback.join(",");
  const unique = new Set(
    source
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );

  return [...unique];
}

function asObject(value: unknown): ApiObject | null {
  return typeof value === "object" && value !== null ? (value as ApiObject) : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function getNestedObject(payload: ApiObject): ApiObject | null {
  const nested = payload.data ?? payload.result;
  return asObject(nested);
}

function getToken(payload: ApiObject): string | undefined {
  const directToken = readString(payload.token) || readString(payload.accessToken) || readString(payload.jwt);
  if (directToken) {
    return directToken;
  }

  const nested = getNestedObject(payload);
  if (!nested) {
    return undefined;
  }

  return readString(nested.token) || readString(nested.accessToken) || readString(nested.jwt);
}

function getUserEmail(payload: ApiObject, fallbackEmail: string): string {
  const user = asObject(payload.user);
  const nested = getNestedObject(payload);
  const nestedUser = nested ? asObject(nested.user) : null;

  const email =
    readString(payload.email) ||
    readString(user?.email) ||
    readString(nested?.email) ||
    readString(nestedUser?.email) ||
    fallbackEmail;

  return email;
}

function getErrorMessage(data: unknown, fallbackMessage: string): string {
  if (typeof data === "string" && data.trim()) {
    const text = data.trim();

    // Django debug 404 pages return HTML; convert this to a concise actionable message.
    if (/<html|<!doctype html/i.test(text)) {
      const endpointMatch = text.match(/Page not found at\s+([^<]+)/i);
      const endpoint = endpointMatch?.[1]?.trim();
      if (endpoint) {
        return `Endpoint nao encontrado no backend: ${endpoint}. Ajuste VITE_AUTH_REGISTER_PATH/VITE_AUTH_LOGIN_PATH.`;
      }

      return "Endpoint de autenticacao nao encontrado no backend. Verifique as rotas de cadastro/login.";
    }

    return text;
  }

  const objectData = asObject(data);
  if (!objectData) {
    return fallbackMessage;
  }

  const message = readString(objectData.message) || readString(objectData.error);
  if (message) {
    return message;
  }

  const nested = getNestedObject(objectData);
  const nestedMessage = nested && (readString(nested.message) || readString(nested.error));

  return nestedMessage || fallbackMessage;
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function buildAuthBody(payload: AuthPayload): ApiObject {
  return {
    [AUTH_EMAIL_FIELD]: payload.email,
    [AUTH_PASSWORD_FIELD]: payload.password
  };
}

async function executeAuthRequest(path: string, method: string, payload: AuthPayload): Promise<Response> {
  return fetch(buildUrl(path), {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildAuthBody(payload))
  });
}

function extractAuthResult(responseData: unknown, payload: AuthPayload): AuthResult {
  const objectData = asObject(responseData);
  if (!objectData) {
    return { userEmail: payload.email };
  }

  return {
    userEmail: getUserEmail(objectData, payload.email),
    token: getToken(objectData)
  };
}

async function authRequest(payload: AuthPayload, options: RequestAttemptOptions): Promise<AuthResult> {
  const attempts: string[] = [];
  let lastError: Error | null = null;

  for (const path of options.paths) {
    for (const method of options.methods) {
      const routeTag = `${method.toUpperCase()} ${path}`;
      attempts.push(routeTag);

      const response = await executeAuthRequest(path, method, payload);

      const isJson = response.headers.get("content-type")?.includes("application/json");
      const responseData = isJson ? await response.json() : await response.text();

      if (response.ok) {
        return extractAuthResult(responseData, payload);
      }

      const backendMessage = getErrorMessage(responseData, options.fallbackError);

      // Continue trying known alternatives when endpoint/method does not match backend route design.
      if (response.status === 404 || response.status === 405) {
        const allowHeader = response.headers.get("allow");
        const allowHint = allowHeader ? ` Metodos permitidos: ${allowHeader}.` : "";
        lastError = new Error(`${backendMessage}${allowHint}`);
        continue;
      }

      throw new Error(backendMessage);
    }
  }

  if (lastError) {
    throw new Error(
      `${options.fallbackError} Nenhuma rota aceitou a requisicao de ${options.operationName}. Tentativas: ${attempts.join(" | ")}.`
    );
  }

  throw new Error(options.fallbackError);
}

export function registerUser(payload: AuthPayload): Promise<AuthResult> {
  return authRequest(payload, {
    paths: REGISTER_PATHS,
    methods: REGISTER_METHODS,
    fallbackError: "Nao foi possivel concluir o cadastro.",
    operationName: "cadastro"
  });
}

export function loginUser(payload: AuthPayload): Promise<AuthResult> {
  return authRequest(payload, {
    paths: LOGIN_PATHS,
    methods: LOGIN_METHODS,
    fallbackError: "Email ou senha invalidos.",
    operationName: "login"
  });
}
