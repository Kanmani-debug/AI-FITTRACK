const { GoogleGenAI } = require("@google/genai");

/**
 * "gemini-flash-latest" is a Google-maintained alias that always points at
 * the current recommended stable Flash model, so this fallback doesn't rot
 * the way a pinned version string (e.g. "gemini-1.5-flash") eventually does.
 * Set GEMINI_MODEL in .env to pin a specific version if you need
 * reproducible behaviour instead.
 */
const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Custom error type so controllers can tell "Gemini itself failed" apart
 * from other kinds of errors, and pick an appropriate HTTP status code.
 */
class GeminiServiceError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = "GeminiServiceError";
    this.statusCode = statusCode;
  }
}

const PLACEHOLDER_KEYS = new Set(["your_gemini_api_key", "your-gemini-api-key", "changeme"]);

const isPlaceholderKey = (key) => {
  if (!key) return true;
  const trimmed = String(key).trim();
  if (trimmed === "") return true;
  return PLACEHOLDER_KEYS.has(trimmed.toLowerCase());
};

let cachedClient = null;
let cachedApiKey = null;

const getModelName = () => process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

const getTimeoutMs = () => {
  const raw = Number(process.env.GEMINI_TIMEOUT_MS);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_TIMEOUT_MS;
  return raw;
};

/**
 * Lazily creates (and caches) the Gemini client. Recreates it if the API
 * key changes, which matters in dev when nodemon reloads env vars.
 */
const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (isPlaceholderKey(apiKey)) {
    throw new GeminiServiceError(
      "Gemini API key is not configured on the server. Set GEMINI_API_KEY in the .env file.",
      500
    );
  }

  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedClient = new GoogleGenAI({ apiKey });
    cachedApiKey = apiKey;
  }
  return cachedClient;
};

/**
 * Strips markdown code fences (```json ... ```) that Gemini sometimes wraps
 * JSON responses in, so the text can be parsed safely.
 */
const stripCodeFences = (text) => {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
};

/**
 * Turns whatever the SDK throws (an ApiError with a numeric `status`, a
 * DOMException-style AbortError, a Node network error, or anything else)
 * into a GeminiServiceError with an appropriate, distinct HTTP status code -
 * so a timeout, an invalid key, a bad model name and a rate limit never look
 * the same to the client.
 */
const classifyError = (err) => {
  if (err instanceof GeminiServiceError) return err;

  if (err?.name === "AbortError") {
    return new GeminiServiceError("Gemini request timed out. Please try again.", 504);
  }

  const status = err?.status ?? err?.response?.status ?? err?.error?.code;

  if (status === 400) {
    return new GeminiServiceError(
      "Gemini rejected the request as invalid (bad parameters or unsupported model).",
      502
    );
  }
  if (status === 401 || status === 403) {
    return new GeminiServiceError("Gemini rejected the API key (invalid or unauthorized).", 500);
  }
  if (status === 404) {
    return new GeminiServiceError(
      `Gemini model "${getModelName()}" was not found or is not supported. Check GEMINI_MODEL.`,
      500
    );
  }
  if (status === 429) {
    return new GeminiServiceError("Gemini rate limit exceeded. Please try again shortly.", 429);
  }
  if (typeof status === "number" && status >= 500) {
    return new GeminiServiceError("Gemini's servers returned an error. Please try again shortly.", 502);
  }
  if (err?.code === "ENOTFOUND" || err?.code === "ECONNREFUSED" || err?.code === "EAI_AGAIN" || err?.cause) {
    return new GeminiServiceError(
      "Could not reach the Gemini API. Check the server's network/internet connection.",
      502
    );
  }

  return new GeminiServiceError(`Gemini request failed: ${err?.message || "unknown error"}`, 502);
};

/**
 * Makes a single generateContent call with a real, cancellable timeout:
 * an AbortController signal is threaded into the SDK call itself (via
 * config.abortSignal), so when the timer fires the in-flight HTTP request
 * to Gemini is actually aborted rather than merely "raced" and ignored.
 */
const callGemini = async ({ model, contents, config = {} }) => {
  const client = getClient();
  const timeoutMs = getTimeoutMs();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  console.log("[Gemini] Request started");
  console.log(`[Gemini] Model: ${model}`);

  try {
    const result = await client.models.generateContent({
      model,
      contents,
      config: { ...config, abortSignal: controller.signal },
    });
    console.log("[Gemini] Response received");
    return result;
  } catch (err) {
    const safeMessage = err?.message ? String(err.message).slice(0, 300) : "unknown error";
    console.error(`[Gemini] Request failed: ${safeMessage}`);
    throw classifyError(err);
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Sends a prompt to Gemini and returns the parsed JSON object it produced.
 * Wraps every failure mode (missing key, invalid key, invalid model,
 * network error, timeout, rate limit, empty response, malformed JSON) into
 * a GeminiServiceError so the rest of the app never crashes because Gemini
 * misbehaved.
 *
 * @param {string} systemInstruction - safety/behaviour instructions for Gemini
 * @param {string} userPrompt - the actual request, asking for a JSON reply
 * @returns {Promise<object>} parsed JSON response from Gemini
 */
const generateStructuredContent = async (systemInstruction, userPrompt) => {
  const modelName = getModelName();

  const result = await callGemini({
    model: modelName,
    contents: userPrompt,
    config: {
      systemInstruction,
      temperature: 0.7,
      responseMimeType: "application/json",
    },
  });

  let text;
  try {
    text = result?.text;
  } catch (err) {
    throw new GeminiServiceError("Gemini returned a response that could not be read.", 502);
  }

  if (!text || String(text).trim() === "") {
    throw new GeminiServiceError("Gemini returned an empty response.", 502);
  }

  const cleaned = stripCodeFences(String(text));

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new GeminiServiceError("Gemini returned a malformed response that could not be parsed.", 502);
  }
};

/**
 * Checks configuration and, if a key is present, makes one cheap live call
 * to Gemini to confirm the model/key/network actually work end to end.
 * Used by GET /api/ai/health. Never throws - always resolves to a status
 * object, and never includes the API key.
 */
const checkGeminiHealth = async () => {
  const model = getModelName();
  const apiKey = process.env.GEMINI_API_KEY;

  if (isPlaceholderKey(apiKey)) {
    return { configured: false, model, status: "missing_api_key" };
  }

  try {
    await callGemini({
      model,
      contents: "Reply with only the word: pong",
      config: { maxOutputTokens: 5 },
    });
    return { configured: true, model, status: "available" };
  } catch (err) {
    const classified = classifyError(err);
    return { configured: true, model, status: "unavailable", detail: classified.message };
  }
};

module.exports = { generateStructuredContent, checkGeminiHealth, GeminiServiceError };
