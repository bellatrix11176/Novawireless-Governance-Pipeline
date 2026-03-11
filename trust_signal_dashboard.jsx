import { useState, useEffect, useRef } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Legend } from "recharts";

// ── Palette & tokens ──────────────────────────────────────────────────────────
const C = {
  bg:        "#080c10",
  surface:   "#0d1117",
  border:    "#1c2333",
  muted:     "#21262d",
  text:      "#e6edf3",
  dim:       "#7d8590",
  ok:        "#3fb950",
  watch:     "#e3b341",
  veto:      "#f85149",
  accent:    "#58a6ff",
  dov:       "#bc8cff",
  dar:       "#79c0ff",
  drl:       "#56d364",
  por:       "#ffa657",
  ter:       "#e3b341",
  sii:       "#f85149",
};

// ── Synthetic pipeline output (mirrors what governance_report.json + paper_signals.json produce) ──
const MOCK_PIPELINE = {
  meta: { rows_analyzed: 82305, months_loaded: 12, pipeline_version: "2.1.0" },
  overall_signals: {
    proxy_resolution_rate: 0.894,
    true_resolution_rate:  0.473,
    resolution_inflation_pp: 42.1,
    bandaid_rate: 0.371,
  },
  paper_governance_signals: {
    DAR: { full_name: "Delayed Adverse Rate",        raw: 0.0891, normalized: 0.1114 },
    DRL: { full_name: "Downstream Remediation Load", raw: 0.0812, normalized: 0.2040 },
    DOV: { full_name: "Durable Outcome Validation",  normalized: 0.4120, DOV_gate_triggered: false, DOV_gate_tau: 0.50 },
    POR: { full_name: "Proxy Overfit Ratio",         raw: 1.89,   normalized: 0.2225, K: 5 },
    TER: { full_name: "Terminal Exit Rate",          value: 0.276, baseline_churn: 0.2763, delta_vs_baseline: -0.0003 },
    SII: { full_name: "System Integrity Index",      raw: 26.21, gated: 26.21, status: "OK",
           weights: { DAR: 0.30, DRL: 0.20, DOV: 0.25, POR: 0.25 },
           thresholds: { veto: 60, watch: 30 } },
    summary: {
      SII_gated: 26.21, status: "OK",
      component_scores: { DAR: 0.1114, DRL: 0.2040, DOV: 0.4120, POR: 0.2225 },
      TER: 0.276, baseline_churn: 0.2763,
    },
  },
  scenario_health: [
    { scenario: "gamed_metric",          calls: 8821,  trust_score: 12.4, resolution_gap: 0.891, bandaid_rate: 0.711, status: "VETO"  },
    { scenario: "fraud_store_promo",     calls: 6614,  trust_score: 18.1, resolution_gap: 0.782, bandaid_rate: 0.628, status: "VETO"  },
    { scenario: "fraud_hic_exchange",    calls: 4937,  trust_score: 21.3, resolution_gap: 0.741, bandaid_rate: 0.594, status: "VETO"  },
    { scenario: "fraud_line_add",        calls: 5763,  trust_score: 22.7, resolution_gap: 0.723, bandaid_rate: 0.572, status: "VETO"  },
    { scenario: "fraud_care_promo",      calls: 4112,  trust_score: 31.5, resolution_gap: 0.681, bandaid_rate: 0.489, status: "WATCH" },
    { scenario: "activation_failed",     calls: 8230,  trust_score: 44.2, resolution_gap: 0.412, bandaid_rate: 0.183, status: "WATCH" },
    { scenario: "unresolvable_clean",    calls: 8231,  trust_score: 61.8, resolution_gap: 0.198, bandaid_rate: 0.074, status: "OK"    },
    { scenario: "line_add_legitimate",   calls: 9876,  trust_score: 81.4, resolution_gap: 0.044, bandaid_rate: 0.012, status: "OK"    },
    { scenario: "activation_clean",      calls: 9877,  trust_score: 87.2, resolution_gap: 0.021, bandaid_rate: 0.008, status: "OK"    },
    { scenario: "clean",                 calls: 16001, trust_score: 94.1, resolution_gap: 0.009, bandaid_rate: 0.003, status: "OK"    },
  ],
  monthly_trends: [
    { month: "2024-01", calls: 6680, trust_score: 71.2, resolution_gap: 0.31, bandaid_rate: 0.18, trust_velocity: null,  DAR: 0.042, DRL: 0.000, DOV: 0.12, POR: 0.00, SII: 8.4  },
    { month: "2024-02", calls: 6720, trust_score: 69.4, resolution_gap: 0.33, bandaid_rate: 0.21, trust_velocity: -1.8,  DAR: 0.051, DRL: 0.031, DOV: 0.18, POR: 0.04, SII: 12.1 },
    { month: "2024-03", calls: 6841, trust_score: 67.8, resolution_gap: 0.35, bandaid_rate: 0.24, trust_velocity: -1.6,  DAR: 0.063, DRL: 0.055, DOV: 0.22, POR: 0.08, SII: 15.8 },
    { month: "2024-04", calls: 6903, trust_score: 64.9, resolution_gap: 0.37, bandaid_rate: 0.27, trust_velocity: -2.9,  DAR: 0.071, DRL: 0.082, DOV: 0.27, POR: 0.11, SII: 18.2 },
    { month: "2024-05", calls: 6912, trust_score: 61.3, resolution_gap: 0.38, bandaid_rate: 0.29, trust_velocity: -3.6,  DAR: 0.078, DRL: 0.108, DOV: 0.31, POR: 0.14, SII: 20.9 },
    { month: "2024-06", calls: 6987, trust_score: 58.4, resolution_gap: 0.40, bandaid_rate: 0.31, trust_velocity: -2.9,  DAR: 0.082, DRL: 0.134, DOV: 0.34, POR: 0.16, SII: 22.7 },
    { month: "2024-07", calls: 7012, trust_score: 55.8, resolution_gap: 0.41, bandaid_rate: 0.33, trust_velocity: -2.6,  DAR: 0.085, DRL: 0.158, DOV: 0.37, POR: 0.18, SII: 23.9 },
    { month: "2024-08", calls: 7034, trust_score: 52.1, resolution_gap: 0.42, bandaid_rate: 0.35, trust_velocity: -3.7,  DAR: 0.088, DRL: 0.178, DOV: 0.39, POR: 0.19, SII: 24.8 },
    { month: "2024-09", calls: 7089, trust_score: 49.6, resolution_gap: 0.43, bandaid_rate: 0.36, trust_velocity: -2.5,  DAR: 0.089, DRL: 0.192, DOV: 0.40, POR: 0.20, SII: 25.4 },
    { month: "2024-10", calls: 7101, trust_score: 47.2, resolution_gap: 0.44, bandaid_rate: 0.37, trust_velocity: -2.4,  DAR: 0.090, DRL: 0.198, DOV: 0.41, POR: 0.21, SII: 25.8 },
    { month: "2024-11", calls: 7148, trust_score: 44.8, resolution_gap: 0.44, bandaid_rate: 0.38, trust_velocity: -2.4,  DAR: 0.090, DRL: 0.201, DOV: 0.41, POR: 0.22, SII: 26.0 },
    { month: "2024-12", calls: 7168, trust_score: 42.3, resolution_gap: 0.45, bandaid_rate: 0.39, trust_velocity: -2.5,  DAR: 0.089, DRL: 0.204, DOV: 0.41, POR: 0.22, SII: 26.2 },
  ],
  rep_health: {
    total_reps: 184,
    lowest_trust_reps: [
      { rep_id: "R-0441", calls: 412, trust_score: 11.2, resolution_gap: 0.94 },
      { rep_id: "R-0178", calls: 389, trust_score: 14.8, resolution_gap: 0.91 },
      { rep_id: "R-0293", calls: 441, trust_score: 16.1, resolution_gap: 0.88 },
      { rep_id: "R-0067", calls: 367, trust_score: 19.4, resolution_gap: 0.85 },
      { rep_id: "R-0512", calls: 402, trust_score: 21.7, resolution_gap: 0.83 },
    ],
    highest_trust_reps: [
      { rep_id: "R-0088", calls: 478, trust_score: 96.4, resolution_gap: 0.01 },
      { rep_id: "R-0334", calls: 501, trust_score: 95.1, resolution_gap: 0.01 },
      { rep_id: "R-0219", calls: 456, trust_score: 93.8, resolution_gap: 0.02 },
      { rep_id: "R-0147", calls: 492, trust_score: 92.3, resolution_gap: 0.02 },
      { rep_id: "R-0376", calls: 468, trust_score: 91.7, resolution_gap: 0.02 },
    ],
  },
  // Transcript-level trust signal examples — what the transcripts reveal
  transcript_signals: [
    {
      call_id: "C-82104", scenario: "gamed_metric", rep_id: "R-0441",
      trust_score: 8.2, status: "VETO",
      transcript_excerpt: "\"Everything's been taken care of on our end. You're all set!\" [resolution_flag=1, true_resolution=0, bandaid_credit applied 47s later]",
      signals_firing: ["proxy_vs_true_gap", "bandaid_credit", "rep_aware_gaming", "repeat_contact_31_60d"],
      insight: "Rep marked resolved 8s after customer described unresolved billing error. Credit applied post-call with no authorization."
    },
    {
      call_id: "C-71882", scenario: "fraud_store_promo", rep_id: "R-0178",
      trust_score: 11.4, status: "VETO",
      transcript_excerpt: "\"I'll apply a one-time courtesy credit while we investigate.\" [nrf_generated_flag=1, promo_override_post_call=1]",
      signals_firing: ["nrf_generated_flag", "promo_override_post_call", "proxy_vs_true_gap"],
      insight: "NRF-generated credit applied to fraud scenario. Proxy shows resolved. Customer churned within 60 days."
    },
    {
      call_id: "C-58341", scenario: "activation_failed", rep_id: "R-0293",
      trust_score: 29.3, status: "WATCH",
      transcript_excerpt: "\"Your account shows everything is active on our side.\" [true_resolution=0, repeat_contact_30d=1]",
      signals_firing: ["repeat_contact_30d", "proxy_vs_true_gap", "escalation_flag"],
      insight: "Activation never completed. Rep read dashboard state, not actual device state. Customer called back 3x."
    },
    {
      call_id: "C-44201", scenario: "clean", rep_id: "R-0088",
      trust_score: 98.1, status: "OK",
      transcript_excerpt: "\"Let me actually test that on my end before we close this out... confirmed working.\" [true_resolution=1, resolution_flag=1]",
      signals_firing: [],
      insight: "Rep verified resolution independently before flagging. No repeat contact. No credit applied."
    },
    {
      call_id: "C-39917", scenario: "line_add_legitimate", rep_id: "R-0334",
      trust_score: 94.7, status: "OK",
      transcript_excerpt: "\"I can see the line is active and billing correctly. You're good to go.\" [true_resolution=1, no flags]",
      signals_firing: [],
      insight: "Clean resolution. Proxy and true labels agree. Trust score reflects accurate measurement."
    },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusColor = (s) => ({ VETO: C.veto, WATCH: C.watch, OK: C.ok }[s] || C.dim);
const fmt = (n, d=1) => typeof n === "number" ? n.toFixed(d) : "—";
const pct = (n) => typeof n === "number" ? `${(n*100).toFixed(1)}%` : "—";

function Tag({ status }) {
  const color = statusColor(status);
  return (
    <span style={{
      display: "inline-block", padding: "1px 7px", borderRadius: 3,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
      color: C.bg, background: color, fontFamily: "monospace",
    }}>{status}</span>
  );
}

function StatBox({ label, value, sub, color, mono }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 6, padding: "14px 18px", flex: 1, minWidth: 120,
    }}>
      <div style={{ fontSize: 11, color: C.dim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || C.text, fontFamily: mono ? "monospace" : "inherit", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.dim, marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ children, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 3, height: 18, background: accent || C.accent, borderRadius: 2 }} />
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text }}>{children}</span>
    </div>
  );
}

// ── SII Gauge ─────────────────────────────────────────────────────────────────
function SIIGauge({ sii, status }) {
  const color = statusColor(status);
  const pctFill = Math.min(sii / 100, 1);
  const radius = 70;
  const strokeWidth = 12;
  const circ = 2 * Math.PI * radius;
  const arc = circ * 0.75; // 270° sweep
  const filled = arc * pctFill;
  const offset = circ * 0.125; // rotate start to bottom-left

  // VETO / WATCH zone arcs
  const watchStart = arc * (30/100);
  const vetoStart  = arc * (60/100);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={200} height={160} viewBox="-10 -10 200 170">
        {/* Track */}
        <circle cx={90} cy={90} r={radius} fill="none" stroke={C.muted} strokeWidth={strokeWidth}
          strokeDasharray={`${arc} ${circ - arc}`}
          strokeDashoffset={-offset}
          strokeLinecap="round" transform="rotate(-225 90 90)" />
        {/* WATCH zone */}
        <circle cx={90} cy={90} r={radius} fill="none" stroke={C.watch} strokeWidth={strokeWidth} opacity={0.25}
          strokeDasharray={`${vetoStart - watchStart} ${circ - (vetoStart - watchStart)}`}
          strokeDashoffset={-(offset + watchStart)}
          transform="rotate(-225 90 90)" />
        {/* VETO zone */}
        <circle cx={90} cy={90} r={radius} fill="none" stroke={C.veto} strokeWidth={strokeWidth} opacity={0.25}
          strokeDasharray={`${arc - vetoStart} ${circ - (arc - vetoStart)}`}
          strokeDashoffset={-(offset + vetoStart)}
          transform="rotate(-225 90 90)" />
        {/* Fill */}
        <circle cx={90} cy={90} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeDashoffset={-offset}
          strokeLinecap="round" transform="rotate(-225 90 90)"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
        {/* Labels */}
        <text x={90} y={88} textAnchor="middle" fill={color} fontSize={28} fontWeight={700} fontFamily="monospace">{fmt(sii, 1)}</text>
        <text x={90} y={108} textAnchor="middle" fill={C.dim} fontSize={11} letterSpacing="2">/ 100</text>
        <text x={17} y={148} fill={C.dim} fontSize={9} fontFamily="monospace">0</text>
        <text x={158} y={148} fill={C.dim} fontSize={9} fontFamily="monospace">100</text>
        <text x={52} y={148} fill={C.watch} fontSize={8} fontFamily="monospace">30</text>
        <text x={115} y={148} fill={C.veto} fontSize={8} fontFamily="monospace">60</text>
      </svg>
      <Tag status={status} />
      <div style={{ fontSize: 11, color: C.dim, textAlign: "center", maxWidth: 180, lineHeight: 1.5 }}>
        {status === "VETO"  && "Halt AI optimization. Re-audit measurement environment."}
        {status === "WATCH" && "Drift detected. Human review before next optimization cycle."}
        {status === "OK"    && "Measurement environment within governance bounds."}
      </div>
    </div>
  );
}

// ── Signal Bar (DAR/DRL/DOV/POR) ─────────────────────────────────────────────
function SignalBar({ label, value, color, raw, rawLabel, weight }) {
  const w = Math.min(Math.max(value, 0), 1);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: C.text, fontFamily: "monospace", fontWeight: 700 }}>{label}</span>
        <span style={{ fontSize: 11, color: C.dim, fontFamily: "monospace" }}>
          {raw !== undefined && <span style={{ marginRight: 8, color: C.dim }}>{rawLabel}: {typeof raw === "number" ? raw.toFixed(4) : raw}</span>}
          <span style={{ color }}>{fmt(value, 4)}</span>
          <span style={{ color: C.dim, marginLeft: 6 }}>w={weight}</span>
        </span>
      </div>
      <div style={{ height: 8, background: C.muted, borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${w * 100}%`, background: color,
          borderRadius: 4, transition: "width 0.6s ease",
          boxShadow: `0 0 8px ${color}60`,
        }} />
      </div>
      {/* Zone markers */}
      <div style={{ position: "relative", height: 4 }}>
        <div style={{ position: "absolute", left: "30%", top: 0, width: 1, height: 4, background: C.watch, opacity: 0.6 }} />
        <div style={{ position: "absolute", left: "60%", top: 0, width: 1, height: 4, background: C.veto, opacity: 0.6 }} />
      </div>
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px", fontSize: 12, fontFamily: "monospace" }}>
      <div style={{ color: C.dim, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: "flex", gap: 12, justifyContent: "space-between" }}>
          <span>{p.name}</span><span style={{ fontWeight: 700 }}>{typeof p.value === "number" ? p.value.toFixed(3) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Transcript Signal Card ────────────────────────────────────────────────────
function TranscriptCard({ call }) {
  const [open, setOpen] = useState(false);
  const color = statusColor(call.status);
  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        background: C.surface, border: `1px solid ${open ? color : C.border}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 6, padding: "12px 16px", cursor: "pointer",
        transition: "border-color 0.2s",
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontFamily: "monospace", fontSize: 12, color: C.dim }}>{call.call_id}</span>
          <Tag status={call.status} />
          <span style={{ fontSize: 11, color: C.dim }}>{call.scenario}</span>
          <span style={{ fontSize: 11, color: C.dim }}>{call.rep_id}</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color }}>
            {fmt(call.trust_score, 1)}
          </span>
          <span style={{ color: C.dim, fontSize: 14 }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
          {/* Transcript excerpt */}
          <div style={{
            fontFamily: "monospace", fontSize: 11, color: C.dim,
            background: C.muted, borderRadius: 4, padding: "10px 12px",
            marginBottom: 12, lineHeight: 1.7,
            borderLeft: `2px solid ${color}`,
          }}>
            {call.transcript_excerpt}
          </div>

          {/* Firing signals */}
          {call.signals_firing.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: C.dim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>Signals Firing</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {call.signals_firing.map(s => (
                  <span key={s} style={{
                    fontSize: 10, fontFamily: "monospace", padding: "2px 8px",
                    background: `${C.veto}20`, border: `1px solid ${C.veto}40`,
                    borderRadius: 3, color: C.veto,
                  }}>{s}</span>
                ))}
              </div>
            </div>
          )}
          {call.signals_firing.length === 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              <span style={{
                fontSize: 10, fontFamily: "monospace", padding: "2px 8px",
                background: `${C.ok}20`, border: `1px solid ${C.ok}40`,
                borderRadius: 3, color: C.ok,
              }}>no signals firing — clean call</span>
            </div>
          )}

          {/* Insight */}
          <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
            <span style={{ color: C.dim }}>Analysis: </span>{call.insight}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const data = MOCK_PIPELINE;
  const ps   = data.paper_governance_signals;
  const sii  = ps.SII;
  const [activeView, setActiveView] = useState("overview");

  const tabs = [
    { id: "overview",     label: "System Overview"   },
    { id: "signals",      label: "Governance Signals" },
    { id: "scenarios",    label: "Scenario Health"    },
    { id: "drift",        label: "Drift Timeline"     },
    { id: "reps",         label: "Rep Risk"           },
    { id: "transcripts",  label: "Transcript Analysis" },
  ];

  // Scenario chart data
  const scenData = [...data.scenario_health]
    .sort((a, b) => a.trust_score - b.trust_score)
    .map(s => ({ ...s, name: s.scenario.replace(/_/g, " ") }));

  // Monthly SII component data
  const monthlyData = data.monthly_trends.map(m => ({
    month: m.month.slice(5), // "MM"
    label: m.month,
    trust: m.trust_score,
    gap: +(m.resolution_gap * 100).toFixed(1),
    DAR: +(m.DAR * 100).toFixed(2),
    DRL: +(m.DRL * 100).toFixed(2),
    DOV: +(m.DOV * 100).toFixed(2),
    POR: +(m.POR * 100).toFixed(2),
    SII: +m.SII.toFixed(2),
    velocity: m.trust_velocity,
  }));

  const styles = {
    root: {
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "'IBM Plex Mono', 'Fira Code', 'Courier New', monospace",
      fontSize: 13,
    },
    header: {
      borderBottom: `1px solid ${C.border}`,
      padding: "18px 32px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      background: C.surface,
    },
    nav: {
      display: "flex", gap: 2, padding: "0 32px",
      borderBottom: `1px solid ${C.border}`,
      background: C.surface,
      overflowX: "auto",
    },
    tab: (active) => ({
      padding: "12px 18px", fontSize: 11, fontWeight: active ? 700 : 400,
      color: active ? C.text : C.dim, cursor: "pointer",
      borderBottom: active ? `2px solid ${C.accent}` : "2px solid transparent",
      letterSpacing: "0.05em", whiteSpace: "nowrap",
      background: "none", border: "none", borderBottom: active ? `2px solid ${C.accent}` : "2px solid transparent",
    }),
    body: { padding: "28px 32px" },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
    grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 },
    card: {
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 8, padding: 20,
    },
  };

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.05em" }}>
            NOVAWIRELESS <span style={{ color: C.accent }}>TRUST SIGNAL</span> OBSERVATORY
          </div>
          <div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>
            Aulabaugh (2026) · {data.meta.rows_analyzed.toLocaleString()} calls · {data.meta.months_loaded} months · pipeline v{data.meta.pipeline_version}
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: C.dim, letterSpacing: "0.07em" }}>PROXY RESOLUTION</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.watch }}>{pct(data.overall_signals.proxy_resolution_rate)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: C.dim, letterSpacing: "0.07em" }}>TRUE RESOLUTION</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.ok }}>{pct(data.overall_signals.true_resolution_rate)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: C.dim, letterSpacing: "0.07em" }}>GOODHART GAP</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.veto }}>{data.overall_signals.resolution_inflation_pp.toFixed(1)}pp</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={styles.nav}>
        {tabs.map(t => (
          <button key={t.id} style={styles.tab(activeView === t.id)} onClick={() => setActiveView(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={styles.body}>

        {/* ── OVERVIEW ── */}
        {activeView === "overview" && (
          <div>
            {/* Headline callout */}
            <div style={{
              background: `${C.watch}12`, border: `1px solid ${C.watch}40`,
              borderLeft: `4px solid ${C.watch}`,
              borderRadius: 6, padding: "14px 20px", marginBottom: 24,
              fontSize: 12, lineHeight: 1.7, color: C.text,
            }}>
              <strong style={{ color: C.watch }}>Key finding:</strong>{" "}
              Your proxy resolution flag has an odds ratio of <strong style={{ color: C.veto }}>0.99</strong> against churn (CI 0.94–1.05, p=.78) —
              statistically indistinguishable from a coin flip — and your AI is retraining on it every month.
              Terminal Exit Rate among proxy-resolved calls: <strong style={{ color: C.veto }}>27.6%</strong> ≈ baseline churn <strong style={{ color: C.dim }}>27.63%</strong>.
            </div>

            {/* Top stat row */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              <StatBox label="SII (System Integrity Index)" value={fmt(sii.gated, 1)} sub={`WATCH ≥ ${sii.thresholds.watch}   VETO ≥ ${sii.thresholds.veto}`} color={statusColor(sii.status)} mono />
              <StatBox label="Proxy Resolution Rate" value={pct(data.overall_signals.proxy_resolution_rate)} sub="what the system reports" color={C.watch} />
              <StatBox label="True Resolution Rate"  value={pct(data.overall_signals.true_resolution_rate)}  sub="verified outcomes" color={C.ok} />
              <StatBox label="Goodhart Gap"          value={`${data.overall_signals.resolution_inflation_pp.toFixed(1)}pp`} sub="inflation in proxy measurement" color={C.veto} />
              <StatBox label="Bandaid Credit Rate"   value={pct(data.overall_signals.bandaid_rate)} sub="unauthorized suppression credits" color={C.por} />
            </div>

            {/* SII + signals */}
            <div style={{ ...styles.grid2, marginBottom: 24 }}>
              <div style={styles.card}>
                <SectionHeader accent={C.sii}>System Integrity Index</SectionHeader>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <SIIGauge sii={sii.gated} status={sii.status} />
                </div>
              </div>
              <div style={styles.card}>
                <SectionHeader accent={C.accent}>Signal Components</SectionHeader>
                <div style={{ marginTop: 8 }}>
                  <SignalBar label="DAR — Delayed Adverse Rate"        value={ps.summary.component_scores.DAR} color={C.dar} raw={ps.DAR.raw}  rawLabel="raw" weight="0.30" />
                  <SignalBar label="DRL — Downstream Remediation Load" value={ps.summary.component_scores.DRL} color={C.drl} raw={ps.DRL.raw}  rawLabel="JS"  weight="0.20" />
                  <SignalBar label="DOV — Durable Outcome Validation"  value={ps.summary.component_scores.DOV} color={C.dov} weight="0.25" />
                  <SignalBar label="POR — Proxy Overfit Ratio"         value={ps.summary.component_scores.POR} color={C.por} raw={ps.POR.raw}  rawLabel="raw" weight="0.25" />
                </div>
                <div style={{ marginTop: 20, padding: "12px 14px", background: C.muted, borderRadius: 6 }}>
                  <div style={{ fontSize: 10, color: C.dim, marginBottom: 8, letterSpacing: "0.07em" }}>TER — TERMINAL EXIT RATE (diagnostic)</div>
                  <div style={{ display: "flex", gap: 24 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: C.ter }}>{pct(ps.TER.value)}</div>
                      <div style={{ fontSize: 10, color: C.dim }}>proxy-resolved churn</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: C.dim }}>{pct(ps.TER.baseline_churn)}</div>
                      <div style={{ fontSize: 10, color: C.dim }}>baseline churn</div>
                    </div>
                    <div style={{ fontSize: 11, color: C.dim, flex: 1, lineHeight: 1.6 }}>
                      Δ = {ps.TER.delta_vs_baseline > 0 ? "+" : ""}{pct(ps.TER.delta_vs_baseline)} — proxy resolution carries <strong style={{ color: C.veto }}>no retention signal</strong>.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick scenario status */}
            <div style={styles.card}>
              <SectionHeader accent={C.watch}>Scenario Status Summary</SectionHeader>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {data.scenario_health.map(s => (
                  <div key={s.scenario} style={{
                    padding: "8px 12px", borderRadius: 5,
                    border: `1px solid ${statusColor(s.status)}40`,
                    background: `${statusColor(s.status)}10`,
                    minWidth: 140,
                  }}>
                    <div style={{ fontSize: 10, color: C.dim, marginBottom: 3 }}>{s.scenario.replace(/_/g, " ")}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, color: statusColor(s.status) }}>{fmt(s.trust_score, 1)}</span>
                      <Tag status={s.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── GOVERNANCE SIGNALS ── */}
        {activeView === "signals" && (
          <div>
            <div style={{ ...styles.grid2, marginBottom: 24 }}>
              <div style={styles.card}>
                <SectionHeader accent={C.sii}>SII Gauge</SectionHeader>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <SIIGauge sii={sii.gated} status={sii.status} />
                </div>
                <div style={{ marginTop: 16, fontSize: 11, color: C.dim, lineHeight: 1.8 }}>
                  <div>SII raw: <span style={{ color: C.text }}>{fmt(sii.raw, 4)}</span></div>
                  <div>SII gated: <span style={{ color: C.text }}>{fmt(sii.gated, 4)}</span></div>
                  <div>DOV gate τ = {ps.DOV.DOV_gate_tau} → {ps.DOV.DOV_gate_triggered ? <span style={{ color: C.veto }}>TRIGGERED</span> : <span style={{ color: C.ok }}>not triggered</span>}</div>
                  <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: 10, color: C.dim, background: C.muted, padding: "8px 10px", borderRadius: 4 }}>
                    SII = 100×(0.30·DAR + 0.20·DRL + 0.25·DOV + 0.25·POR)
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <SectionHeader accent={C.accent}>Signal Detail</SectionHeader>
                {[
                  { key: "DAR", color: C.dar, raw: ps.DAR.raw, norm: ps.DAR.normalized, formula: "F / D  (repeat contacts 31-60d / resolved)", bounds: `L=${ps.DAR.bounds.L}  H=${ps.DAR.bounds.H}` },
                  { key: "DRL", color: C.drl, raw: ps.DRL.raw, norm: ps.DRL.normalized, formula: "JS(p ∥ q)  current vs baseline scenario mix", bounds: `L=${ps.DRL.bounds.L}  H=${ps.DRL.bounds.H}` },
                  { key: "DOV", color: C.dov, norm: ps.DOV.normalized, formula: "clamp((A_base − A_cur) / (A_base + ε), 0, 1)", bounds: `gate τ = ${ps.DOV.DOV_gate_tau}` },
                  { key: "POR", color: C.por, raw: ps.POR.raw, norm: ps.POR.normalized, formula: "clamp(ΔP/(ΔT+ε), 0, K) → norm", bounds: `K = ${ps.POR.K}` },
                ].map(sig => (
                  <div key={sig.key} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: sig.color }}>{sig.key}</span>
                      <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                        {sig.raw !== undefined && <span style={{ color: C.dim }}>raw: <span style={{ color: C.text }}>{fmt(sig.raw, 4)}</span></span>}
                        <span style={{ color: C.dim }}>norm: <span style={{ color: sig.color, fontWeight: 700 }}>{fmt(sig.norm, 4)}</span></span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: C.muted, borderRadius: 3, marginBottom: 6, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${sig.norm * 100}%`, background: sig.color, borderRadius: 3, boxShadow: `0 0 6px ${sig.color}80` }} />
                    </div>
                    <div style={{ fontSize: 10, color: C.dim, fontFamily: "monospace" }}>{sig.formula}</div>
                    <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{sig.bounds}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* TER detail */}
            <div style={styles.card}>
              <SectionHeader accent={C.ter}>TER — Terminal Exit Rate (Diagnostic)</SectionHeader>
              <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: C.ter }}>{pct(ps.TER.value)}</div>
                  <div style={{ fontSize: 11, color: C.dim }}>churn among proxy-resolved calls</div>
                </div>
                <div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: C.dim }}>{pct(ps.TER.baseline_churn)}</div>
                  <div style={{ fontSize: 11, color: C.dim }}>baseline population churn</div>
                </div>
                <div style={{ flex: 1, fontSize: 12, color: C.text, lineHeight: 1.8, paddingTop: 4 }}>
                  <div style={{ color: C.veto, fontWeight: 700, marginBottom: 6 }}>Resolution flag predicts nothing.</div>
                  TER ≈ baseline churn (Δ = {pct(Math.abs(ps.TER.delta_vs_baseline))}). A call marked "resolved" by your proxy
                  is no more likely to retain than an unresolved one. The AI is optimizing on a signal with odds ratio 0.99 (p=.78).
                  <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: 10, padding: "6px 10px", background: C.muted, borderRadius: 4, color: C.dim }}>
                    TER = churn rate among resolution_flag=1 calls
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SCENARIO HEALTH ── */}
        {activeView === "scenarios" && (
          <div>
            <div style={styles.card}>
              <SectionHeader accent={C.accent}>Trust Score by Scenario</SectionHeader>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={scenData} layout="vertical" margin={{ left: 20, right: 40, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: C.dim, fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={160} tick={{ fill: C.dim, fontSize: 10 }} />
                  <Tooltip content={<ChartTip />} />
                  <ReferenceLine x={50} stroke={C.veto}  strokeDasharray="4 3" label={{ value: "VETO", fill: C.veto,  fontSize: 9, position: "top" }} />
                  <ReferenceLine x={65} stroke={C.watch} strokeDasharray="4 3" label={{ value: "WATCH", fill: C.watch, fontSize: 9, position: "top" }} />
                  <Bar dataKey="trust_score" name="Trust Score" radius={[0, 3, 3, 0]}>
                    {scenData.map((entry) => (
                      <Cell key={entry.scenario} fill={statusColor(entry.status)} opacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ ...styles.grid2, marginTop: 20 }}>
              <div style={styles.card}>
                <SectionHeader accent={C.veto}>Resolution Gap by Scenario</SectionHeader>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={scenData} layout="vertical" margin={{ left: 20, right: 30, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                    <XAxis type="number" domain={[0, 1]} tickFormatter={v => `${(v*100).toFixed(0)}%`} tick={{ fill: C.dim, fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fill: C.dim, fontSize: 9 }} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="resolution_gap" name="Gap (proxy - true)" radius={[0, 3, 3, 0]} fill={C.veto} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={styles.card}>
                <SectionHeader accent={C.por}>Bandaid Rate by Scenario</SectionHeader>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={scenData} layout="vertical" margin={{ left: 20, right: 30, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                    <XAxis type="number" domain={[0, 1]} tickFormatter={v => `${(v*100).toFixed(0)}%`} tick={{ fill: C.dim, fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fill: C.dim, fontSize: 9 }} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="bandaid_rate" name="Bandaid Rate" radius={[0, 3, 3, 0]} fill={C.por} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Scenario table */}
            <div style={{ ...styles.card, marginTop: 20 }}>
              <SectionHeader accent={C.accent}>Full Scenario Breakdown</SectionHeader>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["Scenario","Calls","Trust Score","Gap","Bandaid Rate","Status"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: C.dim, fontWeight: 700, letterSpacing: "0.06em", fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.scenario_health.map((s, i) => (
                    <tr key={s.scenario} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : `${C.muted}40` }}>
                      <td style={{ padding: "9px 12px", fontFamily: "monospace", color: C.text }}>{s.scenario}</td>
                      <td style={{ padding: "9px 12px", color: C.dim }}>{s.calls.toLocaleString()}</td>
                      <td style={{ padding: "9px 12px", fontWeight: 700, color: statusColor(s.status) }}>{fmt(s.trust_score, 1)}</td>
                      <td style={{ padding: "9px 12px", color: C.veto }}>{pct(s.resolution_gap)}</td>
                      <td style={{ padding: "9px 12px", color: C.por }}>{pct(s.bandaid_rate)}</td>
                      <td style={{ padding: "9px 12px" }}><Tag status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DRIFT TIMELINE ── */}
        {activeView === "drift" && (
          <div>
            <div style={{ ...styles.card, marginBottom: 20 }}>
              <SectionHeader accent={C.accent}>Trust Score Decay & Drift Velocity</SectionHeader>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyData} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="month" tick={{ fill: C.dim, fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: C.dim, fontSize: 10 }} />
                  <Tooltip content={<ChartTip />} />
                  <ReferenceLine y={65} stroke={C.watch} strokeDasharray="4 3" label={{ value: "WATCH", fill: C.watch, fontSize: 9 }} />
                  <ReferenceLine y={50} stroke={C.veto}  strokeDasharray="4 3" label={{ value: "VETO",  fill: C.veto,  fontSize: 9 }} />
                  <Line type="monotone" dataKey="trust" name="Trust Score" stroke={C.accent} strokeWidth={2.5} dot={{ fill: C.accent, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ ...styles.card, marginBottom: 20 }}>
              <SectionHeader accent={C.sii}>SII Component Signals Over Time (×100 for visibility)</SectionHeader>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthlyData} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="month" tick={{ fill: C.dim, fontSize: 10 }} />
                  <YAxis tick={{ fill: C.dim, fontSize: 10 }} />
                  <Tooltip content={<ChartTip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: C.dim }} />
                  <Line type="monotone" dataKey="DAR" name="DAR×100" stroke={C.dar} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="DRL" name="DRL×100" stroke={C.drl} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="DOV" name="DOV×100" stroke={C.dov} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="POR" name="POR×100" stroke={C.por} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ ...styles.card, marginBottom: 20 }}>
              <SectionHeader accent={C.sii}>SII Trajectory</SectionHeader>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyData} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="month" tick={{ fill: C.dim, fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: C.dim, fontSize: 10 }} />
                  <Tooltip content={<ChartTip />} />
                  <ReferenceLine y={30} stroke={C.watch} strokeDasharray="4 3" label={{ value: "WATCH ≥30", fill: C.watch, fontSize: 9 }} />
                  <ReferenceLine y={60} stroke={C.veto}  strokeDasharray="4 3" label={{ value: "VETO ≥60",  fill: C.veto,  fontSize: 9 }} />
                  <Line type="monotone" dataKey="SII" name="SII" stroke={C.sii} strokeWidth={2.5} dot={{ fill: C.sii, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.card}>
              <SectionHeader accent={C.veto}>Resolution Gap & Bandaid Rate Trend</SectionHeader>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyData} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="month" tick={{ fill: C.dim, fontSize: 10 }} />
                  <YAxis tick={{ fill: C.dim, fontSize: 10 }} />
                  <Tooltip content={<ChartTip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="gap" name="Gap (pp)" stroke={C.veto} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── REP RISK ── */}
        {activeView === "reps" && (
          <div style={styles.grid2}>
            <div style={styles.card}>
              <SectionHeader accent={C.veto}>Highest Risk Reps</SectionHeader>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["Rep ID","Calls","Trust Score","Gap"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: C.dim, fontSize: 10, letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rep_health.lowest_trust_reps.map((r, i) => (
                    <tr key={r.rep_id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : `${C.muted}40` }}>
                      <td style={{ padding: "9px 10px", fontFamily: "monospace", color: C.veto, fontWeight: 700 }}>{r.rep_id}</td>
                      <td style={{ padding: "9px 10px", color: C.dim }}>{r.calls.toLocaleString()}</td>
                      <td style={{ padding: "9px 10px", fontWeight: 700, color: C.veto }}>{fmt(r.trust_score, 1)}</td>
                      <td style={{ padding: "9px 10px", color: C.veto }}>{pct(r.resolution_gap)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 14, fontSize: 11, color: C.dim, lineHeight: 1.6 }}>
                These reps have resolution gaps above 83pp — proxy marking calls resolved while true outcomes remain unresolved at near-total rates.
              </div>
            </div>
            <div style={styles.card}>
              <SectionHeader accent={C.ok}>Highest Trust Reps</SectionHeader>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["Rep ID","Calls","Trust Score","Gap"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: C.dim, fontSize: 10, letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rep_health.highest_trust_reps.map((r, i) => (
                    <tr key={r.rep_id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : `${C.muted}40` }}>
                      <td style={{ padding: "9px 10px", fontFamily: "monospace", color: C.ok, fontWeight: 700 }}>{r.rep_id}</td>
                      <td style={{ padding: "9px 10px", color: C.dim }}>{r.calls.toLocaleString()}</td>
                      <td style={{ padding: "9px 10px", fontWeight: 700, color: C.ok }}>{fmt(r.trust_score, 1)}</td>
                      <td style={{ padding: "9px 10px", color: C.ok }}>{pct(r.resolution_gap)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 14, fontSize: 11, color: C.dim, lineHeight: 1.6 }}>
                These reps independently verify resolution before flagging. Proxy and true labels agree. No bandaid credits. No repeat contacts.
              </div>
            </div>
            <div style={{ ...styles.card, gridColumn: "1 / -1" }}>
              <SectionHeader accent={C.accent}>Rep Distribution Summary</SectionHeader>
              <div style={{ display: "flex", gap: 32 }}>
                <StatBox label="Total Reps" value={data.rep_health.total_reps} />
                <StatBox label="VETO-level Reps" value={data.rep_health.lowest_trust_reps.length} color={C.veto} sub="trust score < 50" />
                <StatBox label="Clean Reps" value={data.rep_health.highest_trust_reps.length} color={C.ok} sub="trust score > 90" />
              </div>
            </div>
          </div>
        )}

        {/* ── TRANSCRIPT ANALYSIS ── */}
        {activeView === "transcripts" && (
          <div>
            <div style={{
              background: `${C.accent}10`, border: `1px solid ${C.accent}30`,
              borderRadius: 6, padding: "14px 20px", marginBottom: 20,
              fontSize: 12, lineHeight: 1.7, color: C.dim,
            }}>
              Each call gets a trust score derived from what actually happened vs. what the proxy label says happened.
              Expand any call to see the transcript excerpt, which signals fired, and why the score is what it is.
              <strong style={{ color: C.text }}> Red = measurement is broken. Green = measurement is working.</strong>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {data.transcript_signals.length} calls — {data.transcript_signals.filter(c => c.status === "VETO").length} VETO · {data.transcript_signals.filter(c => c.status === "WATCH").length} WATCH · {data.transcript_signals.filter(c => c.status === "OK").length} OK
              </div>
              {data.transcript_signals.map(call => (
                <TranscriptCard key={call.call_id} call={call} />
              ))}
            </div>

            <div style={styles.card}>
              <SectionHeader accent={C.accent}>What the Transcripts Reveal</SectionHeader>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 12 }}>
                <div style={{ padding: "14px 16px", background: `${C.veto}10`, border: `1px solid ${C.veto}30`, borderRadius: 6 }}>
                  <div style={{ color: C.veto, fontWeight: 700, marginBottom: 8 }}>Where it's breaking</div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: C.dim, lineHeight: 1.9 }}>
                    <li>Reps marking resolved before verifying outcome</li>
                    <li>Bandaid credits applied post-call without authorization</li>
                    <li>NRF-generated credits suppressing repeat contacts</li>
                    <li>Proxy-true divergence concentrated in fraud/gaming scenarios</li>
                    <li>Repeat contacts within 31-60d after "resolved" flag</li>
                  </ul>
                </div>
                <div style={{ padding: "14px 16px", background: `${C.ok}10`, border: `1px solid ${C.ok}30`, borderRadius: 6 }}>
                  <div style={{ color: C.ok, fontWeight: 700, marginBottom: 8 }}>Where it's working</div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: C.dim, lineHeight: 1.9 }}>
                    <li>Clean and activation_clean scenarios align proxy ≈ true</li>
                    <li>High-trust reps independently verify before flagging</li>
                    <li>Legitimate line_add calls have minimal gap and no bandaid</li>
                    <li>No repeat contact on calls where true_resolution=1</li>
                    <li>Trust score predictive: high scorers have near-zero churn delta</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
