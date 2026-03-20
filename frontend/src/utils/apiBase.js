const getHost = () => {
  if (typeof window !== "undefined" && window.location?.hostname) {
    return window.location.hostname;
  }
  return "localhost";
};

const isLocalDevHost = (host) => {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    host.endsWith(".local")
  );
};

const host = getHost();

export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (isLocalDevHost(host) ? `http://${host}:3000` : "");

export const buildApiUrl = (path) => `${API_BASE}${path}`;

export const getWebSocketUrl = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (isLocalDevHost(host)) return `ws://${host}:3000`;
  return null;
};
