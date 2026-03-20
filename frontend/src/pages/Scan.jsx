import { useMemo, useState } from "react";
import { buildApiUrl } from "../utils/apiBase";
import { getApiHeaders } from "../utils/runtimeKeys";

function toBase64DataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

export default function Scan() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [error, setError] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const previewUrl = useMemo(() => {
    if (!selectedFile) return "";
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  const onFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setError("");
    setOcrText("");
    setSuggestions("");
  };

  const runOcr = async () => {
    if (!selectedFile) {
      setError("Please choose an image first.");
      return;
    }

    setOcrLoading(true);
    setError("");
    setSuggestions("");

    try {
      const imageBase64 = await toBase64DataUrl(selectedFile);
      const res = await fetch(buildApiUrl("/api/ocr"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getApiHeaders() },
        body: JSON.stringify({ imageBase64, fileName: selectedFile.name })
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "OCR failed");
      }

      setOcrText(payload?.text || "");
    } catch (ocrError) {
      setError(ocrError.message || "OCR failed");
    } finally {
      setOcrLoading(false);
    }
  };

  const getFixSuggestions = async () => {
    if (!ocrText.trim()) {
      setError("Run OCR first to extract text.");
      return;
    }

    setSuggestionsLoading(true);
    setError("");

    try {
      const res = await fetch(buildApiUrl("/api/fix-suggestions"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getApiHeaders() },
        body: JSON.stringify({ text: ocrText })
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "Suggestion request failed");
      }

      setSuggestions(payload?.suggestions || "");
    } catch (suggestionError) {
      setError(suggestionError.message || "Suggestion request failed");
    } finally {
      setSuggestionsLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 980, marginTop: 30 }}>
      <div className="card" style={{ marginBottom: 20 }}>
        <p className="label">PWA SCANNING</p>
        <h1 style={{ marginTop: 8, marginBottom: 12 }}>Scan Device Label / QR / Model Sticker</h1>
        <p className="muted" style={{ margin: 0 }}>
          Use your camera or gallery image to extract text, then get installation and fix guidance.
        </p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <div className="card">
          <p className="label" style={{ marginBottom: 12 }}>1) CAPTURE OR UPLOAD IMAGE</p>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileChange}
            style={{ marginBottom: 12 }}
          />
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Scan preview"
              style={{ width: "100%", borderRadius: 8, border: "1px solid #1F2A44", objectFit: "cover", maxHeight: 280 }}
            />
          )}
          <button className="btn btn-primary" onClick={runOcr} disabled={ocrLoading || !selectedFile} style={{ marginTop: 12 }}>
            {ocrLoading ? "Extracting..." : "Extract Text (OCR)"}
          </button>
        </div>

        <div className="card">
          <p className="label" style={{ marginBottom: 12 }}>2) EXTRACTED TEXT</p>
          <textarea
            value={ocrText}
            onChange={(event) => setOcrText(event.target.value)}
            placeholder="OCR text will appear here"
            style={{
              width: "100%",
              minHeight: 180,
              background: "#0B1220",
              border: "1px solid #1F2A44",
              color: "#E8EAED",
              borderRadius: 8,
              padding: 12,
              resize: "vertical"
            }}
          />
          <button
            className="btn btn-secondary"
            onClick={getFixSuggestions}
            disabled={suggestionsLoading || !ocrText.trim()}
            style={{ marginTop: 12 }}
          >
            {suggestionsLoading ? "Generating..." : "Get Fix Suggestions"}
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginTop: 16, borderLeft: "4px solid #EF4444" }}>
          <p style={{ margin: 0, color: "#F87171", fontWeight: 600 }}>Error: {error}</p>
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <p className="label" style={{ marginBottom: 12 }}>3) FIX / INSTALLATION GUIDANCE</p>
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            color: "#9AA0A6",
            fontFamily: "inherit",
            lineHeight: 1.6
          }}
        >
          {suggestions || "Suggestions will appear here after OCR is extracted."}
        </pre>
      </div>
    </div>
  );
}
