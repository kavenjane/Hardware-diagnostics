import { useState } from "react";
import { clearRuntimeKeys, getRuntimeKeys, saveRuntimeKeys } from "../utils/runtimeKeys";

export default function Settings() {
  const current = getRuntimeKeys();
  const [form, setForm] = useState({
    groqApiKey: current.groqApiKey || "",
    openaiApiKey: current.openaiApiKey || "",
    googleVisionApiKey: current.googleVisionApiKey || "",
    ocrSpaceApiKey: current.ocrSpaceApiKey || ""
  });
  const [status, setStatus] = useState("");

  const onChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const onSave = () => {
    saveRuntimeKeys(form);
    setStatus("Saved. New API calls will use these keys.");
  };

  const onClear = () => {
    clearRuntimeKeys();
    setForm({ groqApiKey: "", openaiApiKey: "", googleVisionApiKey: "", ocrSpaceApiKey: "" });
    setStatus("Cleared runtime keys from this browser.");
  };

  const inputStyle = {
    width: "100%",
    background: "#141F38",
    color: "#E8EAED",
    border: "1px solid #1F2A44",
    borderRadius: 8,
    padding: "10px 12px",
    fontFamily: "inherit",
    fontSize: 13
  };

  return (
    <div className="container" style={{ maxWidth: 900, marginTop: 30 }}>
      <div className="card" style={{ marginBottom: 20 }}>
        <p className="label">PRODUCTION API KEY SETTINGS</p>
        <h1 style={{ marginTop: 8, marginBottom: 12 }}>Runtime API Keys</h1>
        <p className="muted" style={{ margin: 0 }}>
          Add keys directly in this website when env vars are not set. Keys are stored only in your browser local storage.
        </p>
      </div>

      <div className="card" style={{ display: "grid", gap: 12 }}>
        <label>
          <p className="label" style={{ marginBottom: 6 }}>GROQ API KEY (AI Summary + Chat)</p>
          <input type="password" value={form.groqApiKey} onChange={onChange("groqApiKey")} style={inputStyle} />
        </label>

        <label>
          <p className="label" style={{ marginBottom: 6 }}>OPENAI API KEY (Fix Suggestions)</p>
          <input type="password" value={form.openaiApiKey} onChange={onChange("openaiApiKey")} style={inputStyle} />
        </label>

        <label>
          <p className="label" style={{ marginBottom: 6 }}>GOOGLE VISION API KEY (OCR)</p>
          <input type="password" value={form.googleVisionApiKey} onChange={onChange("googleVisionApiKey")} style={inputStyle} />
        </label>

        <label>
          <p className="label" style={{ marginBottom: 6 }}>OCR SPACE API KEY (OCR fallback)</p>
          <input type="password" value={form.ocrSpaceApiKey} onChange={onChange("ocrSpaceApiKey")} style={inputStyle} />
        </label>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
          <button className="btn btn-primary" onClick={onSave}>Save Keys</button>
          <button className="btn btn-secondary" onClick={onClear}>Clear Keys</button>
        </div>

        {status && <p className="muted" style={{ margin: 0 }}>{status}</p>}
      </div>
    </div>
  );
}
