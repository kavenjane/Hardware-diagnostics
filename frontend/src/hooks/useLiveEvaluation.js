import { useEffect, useRef, useState } from "react";

const WS_URL = "ws://localhost:3000";
const FALLBACK_URL = "http://localhost:3000/api/diagnostics";

export default function useLiveEvaluation() {
  const [evaluation, setEvaluation] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchFallback = () => {
      fetch(FALLBACK_URL)
        .then((res) => {
          if (!res.ok) throw new Error("No diagnostic report available");
          return res.json();
        })
        .then((data) => {
          if (!isMounted) return;
          setEvaluation(data);
          setError(null);
        })
        .catch((err) => {
          if (!isMounted) return;
          setError(err.message);
        });
    };

    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket(WS_URL);

        wsRef.current.onopen = () => {
          if (!isMounted) return;
          setConnectionStatus("connected");
        };

        wsRef.current.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const message = JSON.parse(event.data);
            if (message.type === "evaluation" && message.data) {
              setEvaluation(message.data);
              setMetrics(message.metrics || null);
              setLastUpdate(new Date());
              setError(null);
            }
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        wsRef.current.onerror = (wsError) => {
          console.error("WebSocket error:", wsError);
          if (!isMounted) return;
          setConnectionStatus("error");
          fetchFallback();
        };

        wsRef.current.onclose = () => {
          if (!isMounted) return;
          setConnectionStatus("disconnected");
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };
      } catch (err) {
        console.error("WebSocket connection error:", err);
        if (!isMounted) return;
        setConnectionStatus("error");
        fetchFallback();
      }
    };

    fetchFallback();
    connectWebSocket();

    return () => {
      isMounted = false;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    evaluation,
    metrics,
    connectionStatus,
    lastUpdate,
    error,
    isConnected: connectionStatus === "connected"
  };
}
