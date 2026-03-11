import { useState, useCallback } from "react";

const CALL_REASONS = [
  "Billing dispute",
  "Loyalty offer / retention",
  "Service activation",
  "Activation failure",
  "Line add / upgrade",
  "Technical support",
  "Port-in issue",
  "General inquiry",
  "Unresolvable / escalation needed",
];

const SYSTEM_PROMPT = `You are a post-call classifier for a telecom call center. Your job is to analyze a completed call transcript and classify it accurately based on what ACTUALLY happened in the call — not what the IVR system logged or what the rep entered.

You must return ONLY valid JSON in this exact format, no preamble, no markdown:
{
  "primary_reason": "<one of the provided call reasons>",
  "confidence": <0.0 to 1.0>,
  "ivr_mismatch": <true if the actual reason likely differs from what IVR would have captured>,
  "resolution_assessment": "resolved" | "unresolved" | "partial" | "unclear",
  "scripted_language_detected": <true if rep used language like "resolved for this billing cycle" or "you won't need to call back until next month" or similar window-management phrases>,
  "scripted_phrases": [<list of exact phrases detected, empty array if none>],
  "call_summary": "<2 sentence plain English summary of what the customer called about and what happened>",
  "true_reason": "<what the customer actually called about in plain English, one sentence>",
  "flags": [<list of concern flags, e.g. "callback_risk", "loyalty_churn_risk", "billing_error", "unresolved_sent_away">]
}

Call reasons to choose from: ${CALL_REASONS.join(", ")}`;

export default function TranscriptClassifier() {
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [charCount, setCharCount] = useState(0);

  const handleTranscriptChange = (e) => {
    setTranscript(e.target.value);
    setCharCount(e.target.value.length);
  };

  const classify = useCallback(async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Classify this call transcript:\n\n${transcript}`,
            },
          ],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (err) {
      setError("Classification failed. Check transcript format and try again.");
    } finally {
      setLoading(false);
    }
  }, [transcript]);

  const confidenceColor = (c) => {
    if (c >= 0.8) return "#00d4aa";
    if (c >= 0.6) return "#ffd93d";
    return "#ff6b6b";
  };

  const resolutionColor = (r) => {
    const map = {
      resolved: "#00d4aa",
      partial: "#ffd93d",
      unresolved: "#ff6b6b",
      unclear: "#a78bfa",
    };
    return map[r] || "#e0e0e0";
  };

  const flagColor = (f) => {
    if (f.includes("risk") || f.includes("unresolved")) return "#ff6b6b";
    if (f.includes("billing") || f.includes("callback")) return "#ffd93d";
    return "#a78bfa";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0d1a",
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      color: "#e0e0e0",
      padding: "32px",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "32px", borderBottom: "1px solid #2a2a4a", paddingBottom: "20px" }}>
        <div style={{ fontSize: "10px", color: "#00d4aa", letterSpacing: "4px", marginBottom: "8px" }}>
          NOVAWIRELESS // POST-CALL GOVERNANCE
        </div>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#fff", letterSpacing: "1px" }}>
          Transcript Classifier
        </h1>
        <div style={{ fontSize: "11px", color: "#888", marginTop: "6px" }}>
          Classify calls based on what actually happened — not what the IVR captured
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", maxWidth: "1200px" }}>
        {/* Input Panel */}
        <div>
          <div style={{ fontSize: "10px", color: "#00d4aa", letterSpacing: "3px", marginBottom: "12px" }}>
            CALL TRANSCRIPT
          </div>
          <textarea
            value={transcript}
            onChange={handleTranscriptChange}
            placeholder={`[Agent]: Thank you for calling NovaWireless...\n[Customer]: Hi, I'm calling about my bill...`}
            style={{
              width: "100%",
              height: "360px",
              background: "#16213e",
              border: "1px solid #2a2a4a",
              borderRadius: "4px",
              color: "#e0e0e0",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "12px",
              padding: "16px",
              resize: "vertical",
              outline: "none",
              lineHeight: "1.6",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
            <span style={{ fontSize: "10px", color: "#555" }}>{charCount.toLocaleString()} characters</span>
            <button
              onClick={classify}
              disabled={loading || !transcript.trim()}
              style={{
                background: loading ? "#2a2a4a" : "#00d4aa",
                color: loading ? "#555" : "#0d0d1a",
                border: "none",
                borderRadius: "3px",
                padding: "10px 28px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "2px",
                cursor: loading || !transcript.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {loading ? "CLASSIFYING..." : "CLASSIFY CALL →"}
            </button>
          </div>

          {error && (
            <div style={{
              marginTop: "16px",
              padding: "12px",
              background: "#2a1a1a",
              border: "1px solid #ff6b6b",
              borderRadius: "4px",
              fontSize: "11px",
              color: "#ff6b6b",
            }}>
              {error}
            </div>
          )}

          {/* What this detects */}
          <div style={{ marginTop: "24px" }}>
            <div style={{ fontSize: "10px", color: "#555", letterSpacing: "3px", marginBottom: "12px" }}>
              DETECTION SIGNALS
            </div>
            {[
              ["Primary call reason", "From transcript, not IVR"],
              ["Scripted window language", '"Resolved for this billing cycle"'],
              ["IVR mismatch", "Did customer route correctly?"],
              ["Resolution assessment", "Actually resolved vs papered over"],
              ["Churn / callback risk flags", "Governance signals"],
            ].map(([label, desc]) => (
              <div key={label} style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #1a1a2e",
                fontSize: "11px",
              }}>
                <span style={{ color: "#e0e0e0" }}>{label}</span>
                <span style={{ color: "#555", fontSize: "10px" }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Results Panel */}
        <div>
          <div style={{ fontSize: "10px", color: "#00d4aa", letterSpacing: "3px", marginBottom: "12px" }}>
            CLASSIFICATION RESULT
          </div>

          {!result && !loading && (
            <div style={{
              height: "360px",
              background: "#16213e",
              border: "1px dashed #2a2a4a",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#333",
              fontSize: "11px",
              letterSpacing: "2px",
            }}>
              AWAITING TRANSCRIPT
            </div>
          )}

          {loading && (
            <div style={{
              height: "360px",
              background: "#16213e",
              border: "1px solid #2a2a4a",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "16px",
            }}>
              <div style={{
                width: "32px", height: "32px",
                border: "2px solid #2a2a4a",
                borderTop: "2px solid #00d4aa",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }} />
              <span style={{ fontSize: "10px", color: "#555", letterSpacing: "3px" }}>ANALYZING TRANSCRIPT</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Primary reason + confidence */}
              <div style={{
                background: "#16213e",
                border: "1px solid #2a2a4a",
                borderRadius: "4px",
                padding: "16px",
              }}>
                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "8px" }}>PRIMARY REASON</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>
                  {result.primary_reason}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    height: "4px",
                    background: "#2a2a4a",
                    borderRadius: "2px",
                    flex: 1,
                  }}>
                    <div style={{
                      height: "4px",
                      width: `${result.confidence * 100}%`,
                      background: confidenceColor(result.confidence),
                      borderRadius: "2px",
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  <span style={{ fontSize: "11px", color: confidenceColor(result.confidence), minWidth: "36px" }}>
                    {Math.round(result.confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Resolution + IVR mismatch */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{
                  background: "#16213e",
                  border: `1px solid ${resolutionColor(result.resolution_assessment)}44`,
                  borderRadius: "4px",
                  padding: "14px",
                }}>
                  <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "6px" }}>RESOLUTION</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: resolutionColor(result.resolution_assessment), textTransform: "uppercase" }}>
                    {result.resolution_assessment}
                  </div>
                </div>
                <div style={{
                  background: "#16213e",
                  border: `1px solid ${result.ivr_mismatch ? "#ff6b6b44" : "#2a2a4a"}`,
                  borderRadius: "4px",
                  padding: "14px",
                }}>
                  <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "6px" }}>IVR MISMATCH</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: result.ivr_mismatch ? "#ff6b6b" : "#00d4aa" }}>
                    {result.ivr_mismatch ? "YES — MISROUTED" : "NO MISMATCH"}
                  </div>
                </div>
              </div>

              {/* Scripted language */}
              <div style={{
                background: "#16213e",
                border: `1px solid ${result.scripted_language_detected ? "#ff6b6b44" : "#2a2a4a"}`,
                borderRadius: "4px",
                padding: "14px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px" }}>SCRIPTED WINDOW LANGUAGE</div>
                  <div style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: result.scripted_language_detected ? "#ff6b6b" : "#00d4aa",
                    letterSpacing: "1px",
                  }}>
                    {result.scripted_language_detected ? "⚠ DETECTED" : "✓ CLEAN"}
                  </div>
                </div>
                {result.scripted_phrases?.length > 0 ? (
                  result.scripted_phrases.map((p, i) => (
                    <div key={i} style={{
                      fontSize: "11px",
                      color: "#ff6b6b",
                      background: "#2a1a1a",
                      padding: "6px 10px",
                      borderRadius: "3px",
                      marginBottom: "4px",
                      borderLeft: "3px solid #ff6b6b",
                    }}>
                      "{p}"
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: "11px", color: "#555" }}>No scripted phrases detected</div>
                )}
              </div>

              {/* Summary */}
              <div style={{
                background: "#16213e",
                border: "1px solid #2a2a4a",
                borderRadius: "4px",
                padding: "14px",
              }}>
                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "8px" }}>TRUE REASON</div>
                <div style={{ fontSize: "12px", color: "#00d4aa", marginBottom: "8px", lineHeight: "1.5" }}>
                  {result.true_reason}
                </div>
                <div style={{ fontSize: "11px", color: "#888", lineHeight: "1.6" }}>
                  {result.call_summary}
                </div>
              </div>

              {/* Flags */}
              {result.flags?.length > 0 && (
                <div style={{
                  background: "#16213e",
                  border: "1px solid #2a2a4a",
                  borderRadius: "4px",
                  padding: "14px",
                }}>
                  <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "10px" }}>GOVERNANCE FLAGS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {result.flags.map((f, i) => (
                      <span key={i} style={{
                        fontSize: "10px",
                        padding: "4px 10px",
                        borderRadius: "2px",
                        background: `${flagColor(f)}22`,
                        border: `1px solid ${flagColor(f)}44`,
                        color: flagColor(f),
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                      }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
