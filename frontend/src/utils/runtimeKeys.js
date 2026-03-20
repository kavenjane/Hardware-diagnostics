const STORAGE_KEY = "runtime-api-keys";

const KEY_FIELDS = [
  "groqApiKey",
  "openaiApiKey",
  "googleVisionApiKey",
  "ocrSpaceApiKey"
];

const isBrowser = typeof window !== "undefined";

export function getRuntimeKeys() {
  if (!isBrowser) return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);

    return KEY_FIELDS.reduce((acc, field) => {
      const value = parsed?.[field];
      if (typeof value === "string" && value.trim()) {
        acc[field] = value.trim();
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

export function saveRuntimeKeys(values = {}) {
  if (!isBrowser) return;

  const sanitized = KEY_FIELDS.reduce((acc, field) => {
    const value = values?.[field];
    acc[field] = typeof value === "string" ? value.trim() : "";
    return acc;
  }, {});

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
}

export function clearRuntimeKeys() {
  if (!isBrowser) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getApiHeaders() {
  const keys = getRuntimeKeys();
  const headers = {};

  if (keys.groqApiKey) headers["x-groq-api-key"] = keys.groqApiKey;
  if (keys.openaiApiKey) headers["x-openai-api-key"] = keys.openaiApiKey;
  if (keys.googleVisionApiKey) headers["x-google-vision-api-key"] = keys.googleVisionApiKey;
  if (keys.ocrSpaceApiKey) headers["x-ocr-space-api-key"] = keys.ocrSpaceApiKey;

  return headers;
}
