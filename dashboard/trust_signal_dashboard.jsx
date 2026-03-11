import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
         ResponsiveContainer, Cell, ReferenceLine, Legend } from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// Palette
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg: "#080c10", surface: "#0d1117", border: "#1c2333", muted: "#21262d",
  text: "#e6edf3", dim: "#7d8590",
  ok: "#3fb950", watch: "#e3b341", veto: "#f85149", accent: "#58a6ff",
  dov: "#bc8cff", dar: "#79c0ff", drl: "#56d364", por: "#ffa657", ter: "#e3b341",
};

// ─────────────────────────────────────────────────────────────────────────────
// Two sample datasets
// ─────────────────────────────────────────────────────────────────────────────
const DATASETS = {
  degraded: {
    _label: "Degraded State",
    meta: { rows_analyzed: 82305, months_loaded: 12, pipeline_version: "2.1.0" },
    overall_signals: {
      proxy_resolution_rate: 0.894, true_resolution_rate: 0.473,
      resolution_inflation_pp: 42.1, bandaid_rate: 0.371,
    },
    paper_governance_signals: {
      DAR: { full_name: "Delayed Adverse Rate",        raw: 0.0891, normalized: 0.1114, bounds: { L: 0.05, H: 0.40 } },
      DRL: { full_name: "Downstream Remediation Load", raw: 0.0812, normalized: 0.2040, bounds: { L: 0.02, H: 0.30 } },
      DOV: { full_name: "Durable Outcome Validation",  normalized: 0.4120, DOV_gate_triggered: false, DOV_gate_tau: 0.50 },
      POR: { full_name: "Proxy Overfit Ratio",         raw: 1.89,   normalized: 0.2225, K: 5 },
      TER: { full_name: "Terminal Exit Rate",          value: 0.276, baseline_churn: 0.2763, delta_vs_baseline: -0.0003 },
      SII: { full_name: "System Integrity Index",      raw: 26.21, gated: 26.21, status: "OK",
             weights: { DAR: 0.30, DRL: 0.20, DOV: 0.25, POR: 0.25 },
             thresholds: { veto: 60, watch: 30 } },
      summary: { SII_gated: 26.21, status: "OK",
        component_scores: { DAR: 0.1114, DRL: 0.2040, DOV: 0.4120, POR: 0.2225 },
        TER: 0.276, baseline_churn: 0.2763 },
    },
    scenario_health: [
      { scenario: "gamed_metric",        calls: 8821,  trust_score: 12.4, resolution_gap: 0.891, bandaid_rate: 0.711, status: "VETO"  },
      { scenario: "fraud_store_promo",   calls: 6614,  trust_score: 18.1, resolution_gap: 0.782, bandaid_rate: 0.628, status: "VETO"  },
      { scenario: "fraud_hic_exchange",  calls: 4937,  trust_score: 21.3, resolution_gap: 0.741, bandaid_rate: 0.594, status: "VETO"  },
      { scenario: "fraud_line_add",      calls: 5763,  trust_score: 22.7, resolution_gap: 0.723, bandaid_rate: 0.572, status: "VETO"  },
      { scenario: "fraud_care_promo",    calls: 4112,  trust_score: 31.5, resolution_gap: 0.681, bandaid_rate: 0.489, status: "WATCH" },
      { scenario: "activation_failed",   calls: 8230,  trust_score: 44.2, resolution_gap: 0.412, bandaid_rate: 0.183, status: "WATCH" },
      { scenario: "unresolvable_clean",  calls: 8231,  trust_score: 61.8, resolution_gap: 0.198, bandaid_rate: 0.074, status: "OK"    },
      { scenario: "line_add_legitimate", calls: 9876,  trust_score: 81.4, resolution_gap: 0.044, bandaid_rate: 0.012, status: "OK"    },
      { scenario: "activation_clean",    calls: 9877,  trust_score: 87.2, resolution_gap: 0.021, bandaid_rate: 0.008, status: "OK"    },
      { scenario: "clean",               calls: 16001, trust_score: 94.1, resolution_gap: 0.009, bandaid_rate: 0.003, status: "OK"    },
    ],
    monthly_trends: [
      { month:"2024-01", calls:6680, trust_score:71.2, resolution_gap:0.31, bandaid_rate:0.18, trust_velocity:null, DAR:0.042,DRL:0.000,DOV:0.12,POR:0.00,SII:8.4  },
      { month:"2024-02", calls:6720, trust_score:69.4, resolution_gap:0.33, bandaid_rate:0.21, trust_velocity:-1.8, DAR:0.051,DRL:0.031,DOV:0.18,POR:0.04,SII:12.1 },
      { month:"2024-03", calls:6841, trust_score:67.8, resolution_gap:0.35, bandaid_rate:0.24, trust_velocity:-1.6, DAR:0.063,DRL:0.055,DOV:0.22,POR:0.08,SII:15.8 },
      { month:"2024-04", calls:6903, trust_score:64.9, resolution_gap:0.37, bandaid_rate:0.27, trust_velocity:-2.9, DAR:0.071,DRL:0.082,DOV:0.27,POR:0.11,SII:18.2 },
      { month:"2024-05", calls:6912, trust_score:61.3, resolution_gap:0.38, bandaid_rate:0.29, trust_velocity:-3.6, DAR:0.078,DRL:0.108,DOV:0.31,POR:0.14,SII:20.9 },
      { month:"2024-06", calls:6987, trust_score:58.4, resolution_gap:0.40, bandaid_rate:0.31, trust_velocity:-2.9, DAR:0.082,DRL:0.134,DOV:0.34,POR:0.16,SII:22.7 },
      { month:"2024-07", calls:7012, trust_score:55.8, resolution_gap:0.41, bandaid_rate:0.33, trust_velocity:-2.6, DAR:0.085,DRL:0.158,DOV:0.37,POR:0.18,SII:23.9 },
      { month:"2024-08", calls:7034, trust_score:52.1, resolution_gap:0.42, bandaid_rate:0.35, trust_velocity:-3.7, DAR:0.088,DRL:0.178,DOV:0.39,POR:0.19,SII:24.8 },
      { month:"2024-09", calls:7089, trust_score:49.6, resolution_gap:0.43, bandaid_rate:0.36, trust_velocity:-2.5, DAR:0.089,DRL:0.192,DOV:0.40,POR:0.20,SII:25.4 },
      { month:"2024-10", calls:7101, trust_score:47.2, resolution_gap:0.44, bandaid_rate:0.37, trust_velocity:-2.4, DAR:0.090,DRL:0.198,DOV:0.41,POR:0.21,SII:25.8 },
      { month:"2024-11", calls:7148, trust_score:44.8, resolution_gap:0.44, bandaid_rate:0.38, trust_velocity:-2.4, DAR:0.090,DRL:0.201,DOV:0.41,POR:0.22,SII:26.0 },
      { month:"2024-12", calls:7168, trust_score:42.3, resolution_gap:0.45, bandaid_rate:0.39, trust_velocity:-2.5, DAR:0.089,DRL:0.204,DOV:0.41,POR:0.22,SII:26.2 },
    ],
    rep_health: {
      total_reps: 184,
      lowest_trust_reps: [
        { rep_id:"R-0441", calls:412, trust_score:11.2, resolution_gap:0.94 },
        { rep_id:"R-0178", calls:389, trust_score:14.8, resolution_gap:0.91 },
        { rep_id:"R-0293", calls:441, trust_score:16.1, resolution_gap:0.88 },
        { rep_id:"R-0067", calls:367, trust_score:19.4, resolution_gap:0.85 },
        { rep_id:"R-0512", calls:402, trust_score:21.7, resolution_gap:0.83 },
      ],
      highest_trust_reps: [
        { rep_id:"R-0088", calls:478, trust_score:96.4, resolution_gap:0.01 },
        { rep_id:"R-0334", calls:501, trust_score:95.1, resolution_gap:0.01 },
        { rep_id:"R-0219", calls:456, trust_score:93.8, resolution_gap:0.02 },
        { rep_id:"R-0147", calls:492, trust_score:92.3, resolution_gap:0.02 },
        { rep_id:"R-0376", calls:468, trust_score:91.7, resolution_gap:0.02 },
      ],
    },
    transcript_signals: [
      { call_id:"C-82104", scenario:"gamed_metric",       rep_id:"R-0441", trust_score:8.2,  status:"VETO",
        transcript_excerpt:"\"Everything's been taken care of on our end. You're all set!\" [resolution_flag=1, true_resolution=0, bandaid_credit applied 47s later]",
        signals_firing:["proxy_vs_true_gap","bandaid_credit","rep_aware_gaming","repeat_contact_31_60d"],
        insight:"Rep marked resolved 8s after customer described unresolved billing error. Credit applied post-call without authorization." },
      { call_id:"C-71882", scenario:"fraud_store_promo",  rep_id:"R-0178", trust_score:11.4, status:"VETO",
        transcript_excerpt:"\"I'll apply a one-time courtesy credit while we investigate.\" [nrf_generated_flag=1, promo_override_post_call=1]",
        signals_firing:["nrf_generated_flag","promo_override_post_call","proxy_vs_true_gap"],
        insight:"NRF-generated credit applied to fraud scenario. Proxy shows resolved. Customer churned within 60 days." },
      { call_id:"C-58341", scenario:"activation_failed",  rep_id:"R-0293", trust_score:29.3, status:"WATCH",
        transcript_excerpt:"\"Your account shows everything is active on our side.\" [true_resolution=0, repeat_contact_30d=1]",
        signals_firing:["repeat_contact_30d","proxy_vs_true_gap","escalation_flag"],
        insight:"Activation never completed. Rep read dashboard state, not actual device state. Customer called back 3x." },
      { call_id:"C-44201", scenario:"clean",              rep_id:"R-0088", trust_score:98.1, status:"OK",
        transcript_excerpt:"\"Let me actually test that on my end before we close this out... confirmed working.\" [true_resolution=1, resolution_flag=1]",
        signals_firing:[],
        insight:"Rep verified resolution independently before flagging. No repeat contact. No credit applied." },
      { call_id:"C-39917", scenario:"line_add_legitimate",rep_id:"R-0334", trust_score:94.7, status:"OK",
        transcript_excerpt:"\"I can see the line is active and billing correctly. You're good to go.\" [true_resolution=1, no flags]",
        signals_firing:[],
        insight:"Clean resolution. Proxy and true labels agree. Trust score reflects accurate measurement." },
    ],
  },

  healthy: {
    _label: "Healthy State",
    meta: { rows_analyzed: 81940, months_loaded: 12, pipeline_version: "2.1.0" },
    overall_signals: {
      proxy_resolution_rate: 0.791, true_resolution_rate: 0.764,
      resolution_inflation_pp: 2.7, bandaid_rate: 0.031,
    },
    paper_governance_signals: {
      DAR: { full_name: "Delayed Adverse Rate",        raw: 0.0341, normalized: 0.0568, bounds: { L: 0.05, H: 0.40 } },
      DRL: { full_name: "Downstream Remediation Load", raw: 0.0094, normalized: 0.0000, bounds: { L: 0.02, H: 0.30 } },
      DOV: { full_name: "Durable Outcome Validation",  normalized: 0.0310, DOV_gate_triggered: false, DOV_gate_tau: 0.50 },
      POR: { full_name: "Proxy Overfit Ratio",         raw: 1.04,   normalized: 0.0100, K: 5 },
      TER: { full_name: "Terminal Exit Rate",          value: 0.198, baseline_churn: 0.2610, delta_vs_baseline: -0.063 },
      SII: { full_name: "System Integrity Index",      raw: 3.21, gated: 3.21, status: "OK",
             weights: { DAR: 0.30, DRL: 0.20, DOV: 0.25, POR: 0.25 },
             thresholds: { veto: 60, watch: 30 } },
      summary: { SII_gated: 3.21, status: "OK",
        component_scores: { DAR: 0.0568, DRL: 0.0000, DOV: 0.0310, POR: 0.0100 },
        TER: 0.198, baseline_churn: 0.261 },
    },
    scenario_health: [
      { scenario: "gamed_metric",        calls: 1102,  trust_score: 58.3, resolution_gap: 0.121, bandaid_rate: 0.048, status: "OK"    },
      { scenario: "fraud_store_promo",   calls: 2841,  trust_score: 62.1, resolution_gap: 0.089, bandaid_rate: 0.031, status: "OK"    },
      { scenario: "fraud_hic_exchange",  calls: 2104,  trust_score: 66.4, resolution_gap: 0.072, bandaid_rate: 0.024, status: "OK"    },
      { scenario: "fraud_line_add",      calls: 2398,  trust_score: 68.8, resolution_gap: 0.061, bandaid_rate: 0.019, status: "OK"    },
      { scenario: "fraud_care_promo",    calls: 1876,  trust_score: 71.2, resolution_gap: 0.054, bandaid_rate: 0.016, status: "OK"    },
      { scenario: "activation_failed",   calls: 7812,  trust_score: 74.6, resolution_gap: 0.041, bandaid_rate: 0.028, status: "OK"    },
      { scenario: "unresolvable_clean",  calls: 8104,  trust_score: 82.3, resolution_gap: 0.022, bandaid_rate: 0.011, status: "OK"    },
      { scenario: "line_add_legitimate", calls: 9901,  trust_score: 89.7, resolution_gap: 0.011, bandaid_rate: 0.006, status: "OK"    },
      { scenario: "activation_clean",    calls: 9988,  trust_score: 93.4, resolution_gap: 0.006, bandaid_rate: 0.003, status: "OK"    },
      { scenario: "clean",               calls: 35814, trust_score: 96.8, resolution_gap: 0.003, bandaid_rate: 0.001, status: "OK"    },
    ],
    monthly_trends: [
      { month:"2024-01", calls:6680, trust_score:87.4, resolution_gap:0.032, bandaid_rate:0.028, trust_velocity:null, DAR:0.038,DRL:0.000,DOV:0.04,POR:0.01,SII:2.8 },
      { month:"2024-02", calls:6712, trust_score:88.1, resolution_gap:0.030, bandaid_rate:0.027, trust_velocity:+0.7, DAR:0.036,DRL:0.000,DOV:0.04,POR:0.01,SII:2.7 },
      { month:"2024-03", calls:6798, trust_score:87.8, resolution_gap:0.031, bandaid_rate:0.029, trust_velocity:-0.3, DAR:0.037,DRL:0.002,DOV:0.04,POR:0.01,SII:2.8 },
      { month:"2024-04", calls:6841, trust_score:88.6, resolution_gap:0.029, bandaid_rate:0.026, trust_velocity:+0.8, DAR:0.035,DRL:0.001,DOV:0.03,POR:0.01,SII:2.6 },
      { month:"2024-05", calls:6820, trust_score:87.2, resolution_gap:0.033, bandaid_rate:0.031, trust_velocity:-1.4, DAR:0.039,DRL:0.003,DOV:0.04,POR:0.01,SII:3.0 },
      { month:"2024-06", calls:6901, trust_score:88.9, resolution_gap:0.028, bandaid_rate:0.025, trust_velocity:+1.7, DAR:0.034,DRL:0.002,DOV:0.03,POR:0.01,SII:2.5 },
      { month:"2024-07", calls:6934, trust_score:89.3, resolution_gap:0.027, bandaid_rate:0.024, trust_velocity:+0.4, DAR:0.033,DRL:0.002,DOV:0.03,POR:0.01,SII:2.5 },
      { month:"2024-08", calls:6878, trust_score:88.7, resolution_gap:0.028, bandaid_rate:0.026, trust_velocity:-0.6, DAR:0.034,DRL:0.003,DOV:0.03,POR:0.01,SII:2.6 },
      { month:"2024-09", calls:6912, trust_score:89.1, resolution_gap:0.028, bandaid_rate:0.025, trust_velocity:+0.4, DAR:0.033,DRL:0.004,DOV:0.03,POR:0.01,SII:2.6 },
      { month:"2024-10", calls:6923, trust_score:88.4, resolution_gap:0.029, bandaid_rate:0.027, trust_velocity:-0.7, DAR:0.035,DRL:0.005,DOV:0.03,POR:0.01,SII:2.7 },
      { month:"2024-11", calls:6948, trust_score:88.8, resolution_gap:0.028, bandaid_rate:0.026, trust_velocity:+0.4, DAR:0.034,DRL:0.006,DOV:0.03,POR:0.01,SII:2.7 },
      { month:"2024-12", calls:6989, trust_score:89.2, resolution_gap:0.027, bandaid_rate:0.025, trust_velocity:+0.4, DAR:0.034,DRL:0.009,DOV:0.03,POR:0.01,SII:3.2 },
    ],
    rep_health: {
      total_reps: 184,
      lowest_trust_reps: [
        { rep_id:"R-0441", calls:412, trust_score:58.3, resolution_gap:0.14 },
        { rep_id:"R-0178", calls:389, trust_score:61.2, resolution_gap:0.11 },
        { rep_id:"R-0293", calls:441, trust_score:63.7, resolution_gap:0.09 },
        { rep_id:"R-0067", calls:367, trust_score:64.1, resolution_gap:0.09 },
        { rep_id:"R-0512", calls:402, trust_score:65.8, resolution_gap:0.08 },
      ],
      highest_trust_reps: [
        { rep_id:"R-0088", calls:478, trust_score:97.2, resolution_gap:0.01 },
        { rep_id:"R-0334", calls:501, trust_score:96.8, resolution_gap:0.01 },
        { rep_id:"R-0219", calls:456, trust_score:95.9, resolution_gap:0.01 },
        { rep_id:"R-0147", calls:492, trust_score:94.7, resolution_gap:0.01 },
        { rep_id:"R-0376", calls:468, trust_score:94.1, resolution_gap:0.02 },
      ],
    },
    transcript_signals: [
      { call_id:"C-14201", scenario:"clean",              rep_id:"R-0088", trust_score:97.4, status:"OK",
        transcript_excerpt:"\"I've confirmed the account update is live and verified the charge is correct. You're all set.\" [true_resolution=1, no flags]",
        signals_firing:[],
        insight:"Independent verification before close. Proxy and true agree. No repeat contact within 60 days." },
      { call_id:"C-22918", scenario:"activation_clean",   rep_id:"R-0334", trust_score:95.1, status:"OK",
        transcript_excerpt:"\"The device is showing active in our system and on your end — great.\" [true_resolution=1]",
        signals_firing:[],
        insight:"Activation confirmed both sides. Trust score reflects measurement accuracy." },
      { call_id:"C-31042", scenario:"fraud_store_promo",  rep_id:"R-0219", trust_score:71.3, status:"OK",
        transcript_excerpt:"\"I'm flagging this for the fraud team. I won't mark this resolved until we hear back.\" [resolution_flag=0, escalation routed]",
        signals_firing:["escalation_flag"],
        insight:"Rep correctly declined to mark resolved on ambiguous fraud scenario. Escalation flag expected here — this is the right behavior, not a failure." },
      { call_id:"C-41887", scenario:"gamed_metric",       rep_id:"R-0441", trust_score:58.3, status:"OK",
        transcript_excerpt:"\"I've applied a small credit and noted the account.\" [credit_type=courtesy, true_resolution=0]",
        signals_firing:["proxy_vs_true_gap"],
        insight:"Proxy-true divergence present but limited. Courtesy credit applied with authorization. Lowest-trust rep in this dataset — worth monitoring, not yet action-required." },
      { call_id:"C-51203", scenario:"activation_failed",  rep_id:"R-0293", trust_score:63.7, status:"OK",
        transcript_excerpt:"\"I can see the activation is still pending. I'm going to escalate this rather than close it out.\" [resolution_flag=0, escalation_flag=1]",
        signals_firing:["escalation_flag"],
        insight:"Rep identified true non-resolution and escalated rather than gaming the flag. Escalation_flag here is a health signal." },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Derive honest insights from actual signal values — no hardcoded narratives
// ─────────────────────────────────────────────────────────────────────────────
function deriveInsights(data) {
  const ps  = data.paper_governance_signals;
  const cs  = ps.summary.component_scores;
  const os  = data.overall_signals;
  const sh  = data.scenario_health;
  const mt  = data.monthly_trends;
  const sii = ps.SII;
  const ter = ps.TER;

  const vetoScen  = sh.filter(s => s.status === "VETO");
  const watchScen = sh.filter(s => s.status === "WATCH");
  const okScen    = sh.filter(s => s.status === "OK");
  const topOkScen = okScen.filter(s => s.trust_score > 85);

  const velocities  = mt.map(m => m.trust_velocity).filter(v => v != null);
  const avgVel      = velocities.length ? velocities.reduce((a,b)=>a+b,0)/velocities.length : 0;
  const lastSII     = mt[mt.length-1]?.SII ?? sii.gated;
  const firstSII    = mt[0]?.SII ?? sii.gated;
  const siiTrend    = lastSII - firstSII;
  const terSignal   = Math.abs(ter.delta_vs_baseline) > 0.03;
  const drlRising   = mt.length > 3 && mt[mt.length-1].DRL > mt[0].DRL * 1.5;
  const gap         = os.resolution_inflation_pp;

  const strengths = [], concerns = [], watching = [];

  // Proxy-true alignment
  if (gap < 5)
    strengths.push(`Proxy and true resolution are closely aligned (gap ${gap.toFixed(1)}pp). Measurement environment is reliable.`);
  else if (gap < 15)
    watching.push(`Resolution gap is ${gap.toFixed(1)}pp — within manageable range but worth tracking monthly.`);
  else
    concerns.push(`Resolution gap is ${gap.toFixed(1)}pp. The proxy label overstates true resolution — AI trained on this will overfit a noisy signal.`);

  // Bandaid rate
  if (os.bandaid_rate < 0.05)
    strengths.push(`Bandaid credit rate is ${(os.bandaid_rate*100).toFixed(1)}% — very low. Unauthorized credit suppression is not a material factor.`);
  else if (os.bandaid_rate < 0.15)
    watching.push(`Bandaid credit rate is ${(os.bandaid_rate*100).toFixed(1)}%. Elevated but not yet systemic — monitor for rep-level concentration.`);
  else
    concerns.push(`Bandaid credit rate is ${(os.bandaid_rate*100).toFixed(1)}%. Reps are applying unauthorized credits to suppress repeat contacts and protect metrics.`);

  // Scenario health
  if (vetoScen.length === 0 && watchScen.length === 0)
    strengths.push(`All ${sh.length} scenario types are within governance bounds. No scenario-level VETO or WATCH conditions present.`);
  else if (vetoScen.length === 0)
    watching.push(`${watchScen.length} scenario(s) in WATCH: ${watchScen.map(s=>s.scenario).join(", ")}. No VETO conditions active.`);
  else
    concerns.push(`${vetoScen.length} scenario(s) at VETO: ${vetoScen.map(s=>s.scenario).join(", ")}. Measurement here is unreliable for AI training.`);

  if (topOkScen.length > 0)
    strengths.push(`${topOkScen.length} scenario(s) with trust score above 85 (${topOkScen.map(s=>s.scenario).join(", ")}) — producing reliable measurement.`);

  // Trust velocity
  if (avgVel > -0.5)
    strengths.push(`Trust score is stable (avg velocity ${avgVel>0?"+":""}${avgVel.toFixed(2)} pts/month). No systematic degradation detected.`);
  else if (avgVel > -2.0)
    watching.push(`Trust score declining at ${avgVel.toFixed(2)} pts/month on average. Gradual, but extrapolates to material degradation within the year.`);
  else
    concerns.push(`Trust score declining at ${avgVel.toFixed(2)} pts/month. At this velocity the environment will hit WATCH thresholds within months.`);

  // SII
  if (sii.gated < 15)
    strengths.push(`SII is ${sii.gated.toFixed(1)} — well below the WATCH threshold of ${sii.thresholds.watch}. Governance signals indicate a valid measurement environment.`);
  else if (sii.gated < sii.thresholds.watch)
    watching.push(`SII is ${sii.gated.toFixed(1)}, approaching WATCH threshold of ${sii.thresholds.watch}. Trended ${siiTrend>0?"up":"down"} ${Math.abs(siiTrend).toFixed(1)} pts over the period.`);

  if (siiTrend > 5)
    concerns.push(`SII rose ${siiTrend.toFixed(1)} pts over 12 months (${firstSII.toFixed(1)} → ${lastSII.toFixed(1)}). The measurement environment is actively degrading.`);
  else if (siiTrend < -2)
    strengths.push(`SII improved ${Math.abs(siiTrend).toFixed(1)} pts over the period — governance conditions are getting better, not worse.`);

  // DOV
  if (cs.DOV < 0.05)
    strengths.push(`DOV is ${cs.DOV.toFixed(4)} — essentially no decay in how well the proxy predicts true outcomes over time.`);
  else if (cs.DOV > 0.30)
    concerns.push(`DOV is ${cs.DOV.toFixed(4)}. The proxy label is becoming a worse predictor of true outcomes. This is Goodhart's Law operating.`);
  else
    watching.push(`DOV is ${cs.DOV.toFixed(4)} — some proxy accuracy decay present, not yet at gate threshold (τ=0.50).`);

  // DRL
  if (cs.DRL < 0.05)
    strengths.push(`DRL is ${cs.DRL.toFixed(4)} — scenario mix is stable. Gaming scenarios have not displaced clean call volume.`);
  else if (drlRising)
    concerns.push(`DRL rose from ${mt[0].DRL.toFixed(4)} to ${mt[mt.length-1].DRL.toFixed(4)} over the period. Scenario mix is drifting — fraud/gaming call types are growing.`);

  // TER
  if (terSignal && ter.delta_vs_baseline < -0.03)
    strengths.push(`TER (${(ter.value*100).toFixed(1)}%) is ${Math.abs(ter.delta_vs_baseline*100).toFixed(1)}pp below baseline churn (${(ter.baseline_churn*100).toFixed(1)}%). The resolution flag carries a real retention signal here.`);
  else if (Math.abs(ter.delta_vs_baseline) <= 0.03)
    concerns.push(`TER (${(ter.value*100).toFixed(1)}%) ≈ baseline churn (${(ter.baseline_churn*100).toFixed(1)}%). The resolution flag carries no retention signal. AI optimizing on this is optimizing on noise.`);

  return { strengths, concerns, watching };
}

// ─────────────────────────────────────────────────────────────────────────────
// UI primitives
// ─────────────────────────────────────────────────────────────────────────────
const statusColor = s => ({ VETO: C.veto, WATCH: C.watch, OK: C.ok }[s] || C.dim);
const fmt  = (n,d=1) => typeof n==="number" ? n.toFixed(d) : "—";
const pct  = n => typeof n==="number" ? `${(n*100).toFixed(1)}%` : "—";
const gapColor = v => v > 0.10 ? C.veto : v > 0.04 ? C.watch : C.ok;
const bColor   = v => v > 0.15 ? C.veto : v > 0.05 ? C.watch : C.ok;

function Tag({ status }) {
  return <span style={{ display:"inline-block", padding:"1px 7px", borderRadius:3,
    fontSize:10, fontWeight:700, letterSpacing:"0.08em", color:C.bg,
    background:statusColor(status), fontFamily:"monospace" }}>{status}</span>;
}

function StatBox({ label, value, sub, color }) {
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:6,
      padding:"14px 18px", flex:1, minWidth:120 }}>
      <div style={{ fontSize:11, color:C.dim, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:700, color:color||C.text, fontFamily:"monospace", lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:C.dim, marginTop:5 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ children, accent }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
      <div style={{ width:3, height:18, background:accent||C.accent, borderRadius:2 }} />
      <span style={{ fontSize:12, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:C.text }}>{children}</span>
    </div>
  );
}

function SIIGauge({ sii, status }) {
  const color = statusColor(status);
  const r = 70, sw = 12, circ = 2*Math.PI*r, arc = circ*0.75;
  const filled = arc * Math.min(sii/100, 1);
  const off = circ * 0.125;
  const ws = arc*0.30, vs = arc*0.60;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
      <svg width={200} height={160} viewBox="-10 -10 200 170">
        <circle cx={90} cy={90} r={r} fill="none" stroke={C.muted} strokeWidth={sw}
          strokeDasharray={`${arc} ${circ-arc}`} strokeDashoffset={-off} strokeLinecap="round" transform="rotate(-225 90 90)" />
        <circle cx={90} cy={90} r={r} fill="none" stroke={C.watch} strokeWidth={sw} opacity={0.25}
          strokeDasharray={`${vs-ws} ${circ-(vs-ws)}`} strokeDashoffset={-(off+ws)} transform="rotate(-225 90 90)" />
        <circle cx={90} cy={90} r={r} fill="none" stroke={C.veto} strokeWidth={sw} opacity={0.25}
          strokeDasharray={`${arc-vs} ${circ-(arc-vs)}`} strokeDashoffset={-(off+vs)} transform="rotate(-225 90 90)" />
        <circle cx={90} cy={90} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={`${filled} ${circ-filled}`} strokeDashoffset={-off} strokeLinecap="round"
          transform="rotate(-225 90 90)" style={{ filter:`drop-shadow(0 0 6px ${color})` }} />
        <text x={90} y={88} textAnchor="middle" fill={color} fontSize={28} fontWeight={700} fontFamily="monospace">{fmt(sii,1)}</text>
        <text x={90} y={108} textAnchor="middle" fill={C.dim} fontSize={11} letterSpacing="2">/ 100</text>
        <text x={17} y={148} fill={C.dim} fontSize={9} fontFamily="monospace">0</text>
        <text x={158} y={148} fill={C.dim} fontSize={9} fontFamily="monospace">100</text>
        <text x={52} y={148} fill={C.watch} fontSize={8} fontFamily="monospace">30</text>
        <text x={115} y={148} fill={C.veto} fontSize={8} fontFamily="monospace">60</text>
      </svg>
      <Tag status={status} />
      <div style={{ fontSize:11, color:C.dim, textAlign:"center", maxWidth:180, lineHeight:1.5 }}>
        {status==="VETO"  && "Halt AI optimization. Re-audit measurement environment."}
        {status==="WATCH" && "Drift detected. Human review before next optimization cycle."}
        {status==="OK"    && "Measurement environment within governance bounds."}
      </div>
    </div>
  );
}

function SignalBar({ label, value, color, raw, rawLabel, weight }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:11, color:C.text, fontFamily:"monospace", fontWeight:700 }}>{label}</span>
        <span style={{ fontSize:11, color:C.dim, fontFamily:"monospace" }}>
          {raw!==undefined && <span style={{ marginRight:8 }}>{rawLabel}: {fmt(raw,4)}</span>}
          <span style={{ color }}>{fmt(value,4)}</span>
          <span style={{ color:C.dim, marginLeft:6 }}>w={weight}</span>
        </span>
      </div>
      <div style={{ height:8, background:C.muted, borderRadius:4, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${Math.min(value,1)*100}%`, background:color,
          borderRadius:4, boxShadow:`0 0 8px ${color}60`, transition:"width 0.6s ease" }} />
      </div>
      <div style={{ position:"relative", height:4 }}>
        <div style={{ position:"absolute", left:"30%", top:0, width:1, height:4, background:C.watch, opacity:0.6 }} />
        <div style={{ position:"absolute", left:"60%", top:0, width:1, height:4, background:C.veto,  opacity:0.6 }} />
      </div>
    </div>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:6,
      padding:"10px 14px", fontSize:12, fontFamily:"monospace" }}>
      <div style={{ color:C.dim, marginBottom:6 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color, display:"flex", gap:12, justifyContent:"space-between" }}>
          <span>{p.name}</span>
          <span style={{ fontWeight:700 }}>{typeof p.value==="number" ? p.value.toFixed(3) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

function TranscriptCard({ call }) {
  const [open, setOpen] = useState(false);
  const color = statusColor(call.status);
  return (
    <div onClick={() => setOpen(o=>!o)} style={{
      background:C.surface, border:`1px solid ${open?color:C.border}`,
      borderLeft:`3px solid ${color}`, borderRadius:6, padding:"12px 16px",
      cursor:"pointer", marginBottom:8,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontFamily:"monospace", fontSize:12, color:C.dim }}>{call.call_id}</span>
          <Tag status={call.status} />
          <span style={{ fontSize:11, color:C.dim }}>{call.scenario}</span>
          <span style={{ fontSize:11, color:C.dim }}>{call.rep_id}</span>
        </div>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontFamily:"monospace", fontSize:14, fontWeight:700, color }}>{fmt(call.trust_score,1)}</span>
          <span style={{ color:C.dim }}>{open?"▲":"▼"}</span>
        </div>
      </div>
      {open && (
        <div style={{ marginTop:14, borderTop:`1px solid ${C.border}`, paddingTop:12 }}>
          <div style={{ fontFamily:"monospace", fontSize:11, color:C.dim, background:C.muted,
            borderRadius:4, padding:"10px 12px", marginBottom:12, lineHeight:1.7,
            borderLeft:`2px solid ${color}` }}>{call.transcript_excerpt}</div>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, color:C.dim, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:6 }}>Signals Firing</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {call.signals_firing.length===0
                ? <span style={{ fontSize:10, fontFamily:"monospace", padding:"2px 8px",
                    background:`${C.ok}20`, border:`1px solid ${C.ok}40`, borderRadius:3, color:C.ok }}>
                    no adverse signals — clean measurement
                  </span>
                : call.signals_firing.map(s => (
                  <span key={s} style={{ fontSize:10, fontFamily:"monospace", padding:"2px 8px",
                    background:`${C.veto}20`, border:`1px solid ${C.veto}40`, borderRadius:3, color:C.veto }}>{s}</span>
                ))
              }
            </div>
          </div>
          <div style={{ fontSize:12, color:C.text, lineHeight:1.6 }}>
            <span style={{ color:C.dim }}>Analysis: </span>{call.insight}
          </div>
        </div>
      )}
    </div>
  );
}

// Three-column honest findings panel — fully derived from signal values
function InsightPanel({ insights }) {
  const { strengths, concerns, watching } = insights;
  const cols = [
    { key:"strengths", label:"What's Working",   icon:"✓", color:C.ok,    items:strengths, empty:"No material strengths identified in current data." },
    { key:"concerns",  label:"What's Broken",    icon:"✗", color:C.veto,  items:concerns,  empty:"No governance concerns above threshold." },
    { key:"watching",  label:"Worth Watching",   icon:"◎", color:C.watch, items:watching,  empty:"No early-warning signals active." },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
      {cols.map(({ key, label, icon, color, items, empty }) => (
        <div key={key} style={{ padding:"14px 16px", background:`${color}0d`,
          border:`1px solid ${color}30`, borderRadius:6 }}>
          <div style={{ color, fontWeight:700, marginBottom:10, fontSize:12, letterSpacing:"0.06em",
            textTransform:"uppercase", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:16 }}>{icon}</span>
            {label}
            <span style={{ marginLeft:"auto", fontSize:16, fontWeight:700 }}>{items.length}</span>
          </div>
          {items.length===0
            ? <div style={{ fontSize:11, color:C.dim, fontStyle:"italic" }}>{empty}</div>
            : <ul style={{ margin:0, paddingLeft:16, color:C.dim, lineHeight:1.9, fontSize:11 }}>
                {items.map((item,i) => <li key={i}>{item}</li>)}
              </ul>
          }
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [datasetKey, setDatasetKey] = useState("degraded");
  const [activeView, setActiveView] = useState("overview");

  const data     = DATASETS[datasetKey];
  const ps       = data.paper_governance_signals;
  const sii      = ps.SII;
  const os       = data.overall_signals;
  const insights = deriveInsights(data);

  const scenData    = [...data.scenario_health]
    .sort((a,b)=>a.trust_score-b.trust_score)
    .map(s=>({...s, name:s.scenario.replace(/_/g," ")}));
  const monthlyData = data.monthly_trends.map(m=>({
    month:m.month.slice(5), trust:m.trust_score,
    gap:+(m.resolution_gap*100).toFixed(1),
    DAR:+(m.DAR*100).toFixed(2), DRL:+(m.DRL*100).toFixed(2),
    DOV:+(m.DOV*100).toFixed(2), POR:+(m.POR*100).toFixed(2),
    SII:+m.SII.toFixed(2),
  }));

  const bannerColor = insights.concerns.length>0 ? C.veto : insights.watching.length>0 ? C.watch : C.ok;
  const card = { background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:20 };

  const tabs = [
    { id:"overview",    label:"System Overview"     },
    { id:"signals",     label:"Governance Signals"  },
    { id:"scenarios",   label:"Scenario Health"     },
    { id:"drift",       label:"Drift Timeline"      },
    { id:"reps",        label:"Rep Risk"            },
    { id:"transcripts", label:"Transcript Analysis" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text,
      fontFamily:"'IBM Plex Mono','Fira Code','Courier New',monospace", fontSize:13 }}>

      {/* ── Header ── */}
      <div style={{ borderBottom:`1px solid ${C.border}`, padding:"18px 32px",
        display:"flex", justifyContent:"space-between", alignItems:"center", background:C.surface, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, letterSpacing:"0.05em" }}>
            NOVAWIRELESS <span style={{ color:C.accent }}>TRUST SIGNAL</span> OBSERVATORY
          </div>
          <div style={{ fontSize:10, color:C.dim, marginTop:3 }}>
            Aulabaugh (2026) · {data.meta.rows_analyzed.toLocaleString()} calls · {data.meta.months_loaded} months · pipeline v{data.meta.pipeline_version}
          </div>
        </div>

        {/* Dataset toggle */}
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <span style={{ fontSize:10, color:C.dim, letterSpacing:"0.06em" }}>DATASET:</span>
          {Object.entries(DATASETS).map(([key, ds]) => {
            const sc = ds.paper_governance_signals.SII.status;
            const active = datasetKey===key;
            return (
              <button key={key} onClick={()=>{ setDatasetKey(key); setActiveView("overview"); }} style={{
                padding:"6px 14px", borderRadius:4, fontSize:11, fontWeight:700, cursor:"pointer",
                background: active ? statusColor(sc) : C.muted,
                color: active ? C.bg : C.dim,
                border:`1px solid ${active ? statusColor(sc) : C.border}`,
                letterSpacing:"0.04em",
              }}>{ds._label}</button>
            );
          })}
        </div>

        <div style={{ display:"flex", gap:20 }}>
          {[
            { label:"PROXY RESOLUTION", value:pct(os.proxy_resolution_rate), color:C.watch },
            { label:"TRUE RESOLUTION",  value:pct(os.true_resolution_rate),  color:C.ok   },
            { label:"GOODHART GAP",     value:`${os.resolution_inflation_pp.toFixed(1)}pp`,
              color: os.resolution_inflation_pp>10 ? C.veto : os.resolution_inflation_pp>4 ? C.watch : C.ok },
          ].map(item => (
            <div key={item.label} style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:C.dim, letterSpacing:"0.07em" }}>{item.label}</div>
              <div style={{ fontSize:20, fontWeight:700, color:item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Nav ── */}
      <div style={{ display:"flex", gap:2, padding:"0 32px", borderBottom:`1px solid ${C.border}`,
        background:C.surface, overflowX:"auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setActiveView(t.id)} style={{
            padding:"12px 18px", fontSize:11, fontWeight:activeView===t.id?700:400,
            color:activeView===t.id?C.text:C.dim, cursor:"pointer",
            background:"none", border:"none",
            borderBottom:activeView===t.id?`2px solid ${C.accent}`:"2px solid transparent",
            letterSpacing:"0.05em", whiteSpace:"nowrap",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Body ── */}
      <div style={{ padding:"28px 32px" }}>

        {/* ── OVERVIEW ── */}
        {activeView==="overview" && (
          <div>
            {/* Derived state banner */}
            <div style={{
              background:`${bannerColor}10`, border:`1px solid ${bannerColor}40`,
              borderLeft:`4px solid ${bannerColor}`,
              borderRadius:6, padding:"14px 20px", marginBottom:24,
              fontSize:12, lineHeight:1.8, color:C.text,
            }}>
              <strong style={{ color:bannerColor }}>
                {insights.concerns.length>0
                  ? `${insights.concerns.length} governance concern${insights.concerns.length>1?"s":""} active — `
                  : insights.watching.length>0
                  ? "Measurement environment stable — early-warning signals present. "
                  : "Measurement environment healthy. "}
              </strong>
              {insights.concerns.length>0 && insights.concerns[0]}
              {insights.concerns.length===0 && insights.watching.length>0 && insights.watching[0]}
              {insights.concerns.length===0 && insights.watching.length===0 && insights.strengths[0]}
            </div>

            {/* Stat row */}
            <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
              <StatBox label="System Integrity Index" value={fmt(sii.gated,1)}
                sub={`WATCH≥${sii.thresholds.watch}  VETO≥${sii.thresholds.veto}`}
                color={statusColor(sii.status)} />
              <StatBox label="Proxy Resolution" value={pct(os.proxy_resolution_rate)} sub="what the system reports" color={C.watch} />
              <StatBox label="True Resolution"  value={pct(os.true_resolution_rate)}  sub="verified outcomes" color={C.ok} />
              <StatBox label="Goodhart Gap"     value={`${os.resolution_inflation_pp.toFixed(1)}pp`} sub="proxy minus true"
                color={os.resolution_inflation_pp>10?C.veto:os.resolution_inflation_pp>4?C.watch:C.ok} />
              <StatBox label="Bandaid Rate"     value={pct(os.bandaid_rate)} sub="unauthorized credits"
                color={os.bandaid_rate>0.15?C.veto:os.bandaid_rate>0.05?C.watch:C.ok} />
            </div>

            {/* SII + signal bars */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:24 }}>
              <div style={card}>
                <SectionHeader accent={statusColor(sii.status)}>System Integrity Index</SectionHeader>
                <div style={{ display:"flex", justifyContent:"center" }}>
                  <SIIGauge sii={sii.gated} status={sii.status} />
                </div>
              </div>
              <div style={card}>
                <SectionHeader accent={C.accent}>Signal Components</SectionHeader>
                <div style={{ marginTop:8 }}>
                  <SignalBar label="DAR — Delayed Adverse Rate"        value={ps.summary.component_scores.DAR} color={C.dar} raw={ps.DAR.raw}  rawLabel="raw" weight="0.30" />
                  <SignalBar label="DRL — Downstream Remediation Load" value={ps.summary.component_scores.DRL} color={C.drl} raw={ps.DRL.raw}  rawLabel="JS"  weight="0.20" />
                  <SignalBar label="DOV — Durable Outcome Validation"  value={ps.summary.component_scores.DOV} color={C.dov} weight="0.25" />
                  <SignalBar label="POR — Proxy Overfit Ratio"         value={ps.summary.component_scores.POR} color={C.por} raw={ps.POR.raw}  rawLabel="raw" weight="0.25" />
                </div>
                {/* TER */}
                <div style={{ marginTop:20, padding:"12px 14px", background:C.muted, borderRadius:6 }}>
                  <div style={{ fontSize:10, color:C.dim, marginBottom:8, letterSpacing:"0.07em" }}>TER — TERMINAL EXIT RATE (diagnostic)</div>
                  <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
                    <div>
                      <div style={{ fontSize:20, fontWeight:700,
                        color:Math.abs(ps.TER.delta_vs_baseline)>0.03&&ps.TER.delta_vs_baseline<0?C.ok:C.ter }}>
                        {pct(ps.TER.value)}
                      </div>
                      <div style={{ fontSize:10, color:C.dim }}>proxy-resolved churn</div>
                    </div>
                    <div>
                      <div style={{ fontSize:20, fontWeight:700, color:C.dim }}>{pct(ps.TER.baseline_churn)}</div>
                      <div style={{ fontSize:10, color:C.dim }}>baseline churn</div>
                    </div>
                    <div style={{ fontSize:11, color:C.dim, flex:1, lineHeight:1.6 }}>
                      {Math.abs(ps.TER.delta_vs_baseline)<=0.03
                        ? <><strong style={{ color:C.veto }}>No separation from baseline.</strong> Proxy flag carries no retention signal.</>
                        : ps.TER.delta_vs_baseline<0
                        ? <><strong style={{ color:C.ok }}>Δ = {(ps.TER.delta_vs_baseline*100).toFixed(1)}pp vs baseline.</strong> Resolved calls retain at a meaningfully higher rate.</>
                        : <><strong style={{ color:C.veto }}>Inverted signal.</strong> "Resolved" calls churn faster than unresolved ones.</>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Honest findings */}
            <div style={{ ...card, marginBottom:24 }}>
              <SectionHeader accent={C.accent}>Honest Findings — Derived from Current Data</SectionHeader>
              <InsightPanel insights={insights} />
            </div>

            {/* Scenario strip */}
            <div style={card}>
              <SectionHeader accent={C.accent}>Scenario Status</SectionHeader>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {data.scenario_health.map(s => (
                  <div key={s.scenario} style={{ padding:"8px 12px", borderRadius:5, minWidth:140,
                    border:`1px solid ${statusColor(s.status)}40`, background:`${statusColor(s.status)}10` }}>
                    <div style={{ fontSize:10, color:C.dim, marginBottom:3 }}>{s.scenario.replace(/_/g," ")}</div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontWeight:700, color:statusColor(s.status) }}>{fmt(s.trust_score,1)}</span>
                      <Tag status={s.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── GOVERNANCE SIGNALS ── */}
        {activeView==="signals" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
              <div style={card}>
                <SectionHeader accent={statusColor(sii.status)}>SII Gauge</SectionHeader>
                <div style={{ display:"flex", justifyContent:"center" }}>
                  <SIIGauge sii={sii.gated} status={sii.status} />
                </div>
                <div style={{ marginTop:16, fontSize:11, color:C.dim, lineHeight:1.8 }}>
                  <div>SII raw: <span style={{ color:C.text }}>{fmt(sii.raw,4)}</span></div>
                  <div>SII gated: <span style={{ color:C.text }}>{fmt(sii.gated,4)}</span></div>
                  <div>DOV gate τ={ps.DOV.DOV_gate_tau} → {ps.DOV.DOV_gate_triggered
                    ? <span style={{ color:C.veto }}>TRIGGERED — SII forced to 100</span>
                    : <span style={{ color:C.ok }}>not triggered (DOV={fmt(ps.summary.component_scores.DOV,4)})</span>}
                  </div>
                  <div style={{ marginTop:8, fontFamily:"monospace", fontSize:10, color:C.dim,
                    background:C.muted, padding:"8px 10px", borderRadius:4 }}>
                    SII = 100×(0.30·DAR + 0.20·DRL + 0.25·DOV + 0.25·POR)
                  </div>
                </div>
              </div>
              <div style={card}>
                <SectionHeader accent={C.accent}>Signal Detail</SectionHeader>
                {[
                  { key:"DAR", color:C.dar, raw:ps.DAR.raw, norm:ps.DAR.normalized,
                    formula:"F / D  (repeat contacts 31-60d / resolved calls)",
                    bounds:`L=${ps.DAR.bounds.L}  H=${ps.DAR.bounds.H}` },
                  { key:"DRL", color:C.drl, raw:ps.DRL.raw, norm:ps.DRL.normalized,
                    formula:"JS(p ∥ q)  current vs baseline scenario mix",
                    bounds:`L=${ps.DRL.bounds.L}  H=${ps.DRL.bounds.H}` },
                  { key:"DOV", color:C.dov, norm:ps.DOV.normalized,
                    formula:"clamp((A_base − A_cur) / (A_base + ε), 0, 1)",
                    bounds:`gate τ = ${ps.DOV.DOV_gate_tau}` },
                  { key:"POR", color:C.por, raw:ps.POR.raw, norm:ps.POR.normalized,
                    formula:"clamp(ΔP/(ΔT+ε), 0, K) → norm",
                    bounds:`K = ${ps.POR.K}` },
                ].map(sig => (
                  <div key={sig.key} style={{ marginBottom:18, paddingBottom:18, borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <span style={{ fontWeight:700, color:sig.color }}>{sig.key}</span>
                      <div style={{ display:"flex", gap:16, fontSize:12 }}>
                        {sig.raw!==undefined && <span style={{ color:C.dim }}>raw: <span style={{ color:C.text }}>{fmt(sig.raw,4)}</span></span>}
                        <span style={{ color:C.dim }}>norm: <span style={{ color:sig.color, fontWeight:700 }}>{fmt(sig.norm,4)}</span></span>
                      </div>
                    </div>
                    <div style={{ height:6, background:C.muted, borderRadius:3, marginBottom:6, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${sig.norm*100}%`, background:sig.color,
                        borderRadius:3, boxShadow:`0 0 6px ${sig.color}80` }} />
                    </div>
                    <div style={{ fontSize:10, color:C.dim, fontFamily:"monospace" }}>{sig.formula}</div>
                    <div style={{ fontSize:10, color:C.dim, marginTop:2 }}>{sig.bounds}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={card}>
              <SectionHeader accent={C.ter}>TER — Terminal Exit Rate</SectionHeader>
              <div style={{ display:"flex", gap:40, flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontSize:36, fontWeight:700,
                    color:Math.abs(ps.TER.delta_vs_baseline)>0.03&&ps.TER.delta_vs_baseline<0?C.ok:C.ter }}>
                    {pct(ps.TER.value)}
                  </div>
                  <div style={{ fontSize:11, color:C.dim }}>proxy-resolved churn</div>
                </div>
                <div>
                  <div style={{ fontSize:36, fontWeight:700, color:C.dim }}>{pct(ps.TER.baseline_churn)}</div>
                  <div style={{ fontSize:11, color:C.dim }}>baseline churn</div>
                </div>
                <div style={{ flex:1, minWidth:200, fontSize:12, color:C.text, lineHeight:1.8, paddingTop:4 }}>
                  {Math.abs(ps.TER.delta_vs_baseline)<=0.03
                    ? <><div style={{ color:C.veto, fontWeight:700, marginBottom:6 }}>Resolution flag predicts nothing.</div>
                        TER ≈ baseline churn (Δ={pct(Math.abs(ps.TER.delta_vs_baseline))}). A call marked resolved is no more likely to retain.</>
                    : ps.TER.delta_vs_baseline<0
                    ? <><div style={{ color:C.ok, fontWeight:700, marginBottom:6 }}>Resolution flag carries a real signal.</div>
                        TER is {pct(Math.abs(ps.TER.delta_vs_baseline))} below baseline. Resolved calls retain at a meaningfully higher rate.</>
                    : <><div style={{ color:C.veto, fontWeight:700, marginBottom:6 }}>Inverted signal.</div>
                        TER is above baseline — "resolved" calls churn faster than average.</>
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SCENARIO HEALTH ── */}
        {activeView==="scenarios" && (
          <div>
            <div style={card}>
              <SectionHeader accent={C.accent}>Trust Score by Scenario</SectionHeader>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={scenData} layout="vertical" margin={{ left:20, right:40, top:4, bottom:4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                  <XAxis type="number" domain={[0,100]} tick={{ fill:C.dim, fontSize:10 }} />
                  <YAxis type="category" dataKey="name" width={160} tick={{ fill:C.dim, fontSize:10 }} />
                  <Tooltip content={<ChartTip />} />
                  <ReferenceLine x={50} stroke={C.veto}  strokeDasharray="4 3" label={{ value:"VETO",  fill:C.veto,  fontSize:9, position:"top" }} />
                  <ReferenceLine x={65} stroke={C.watch} strokeDasharray="4 3" label={{ value:"WATCH", fill:C.watch, fontSize:9, position:"top" }} />
                  <Bar dataKey="trust_score" name="Trust Score" radius={[0,3,3,0]}>
                    {scenData.map(e => <Cell key={e.scenario} fill={statusColor(e.status)} opacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginTop:20 }}>
              {[
                { key:"resolution_gap", label:"Resolution Gap by Scenario", color:C.veto, fmt:v=>`${(v*100).toFixed(0)}%`, name:"Gap (proxy−true)" },
                { key:"bandaid_rate",   label:"Bandaid Rate by Scenario",   color:C.por,  fmt:v=>`${(v*100).toFixed(0)}%`, name:"Bandaid Rate" },
              ].map(cfg => (
                <div key={cfg.key} style={card}>
                  <SectionHeader accent={cfg.color}>{cfg.label}</SectionHeader>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={scenData} layout="vertical" margin={{ left:20, right:30, top:4, bottom:4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                      <XAxis type="number" domain={[0,1]} tickFormatter={v=>`${(v*100).toFixed(0)}%`} tick={{ fill:C.dim, fontSize:10 }} />
                      <YAxis type="category" dataKey="name" width={150} tick={{ fill:C.dim, fontSize:9 }} />
                      <Tooltip content={<ChartTip />} />
                      <Bar dataKey={cfg.key} name={cfg.name} radius={[0,3,3,0]}>
                        {scenData.map(e => <Cell key={e.scenario} fill={statusColor(e.status)} opacity={0.8} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
            <div style={{ ...card, marginTop:20 }}>
              <SectionHeader accent={C.accent}>Full Scenario Breakdown</SectionHeader>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                    {["Scenario","Calls","Trust Score","Gap","Bandaid Rate","Status"].map(h => (
                      <th key={h} style={{ padding:"8px 12px", textAlign:"left", color:C.dim, fontWeight:700, letterSpacing:"0.06em", fontSize:10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.scenario_health.map((s,i) => (
                    <tr key={s.scenario} style={{ borderBottom:`1px solid ${C.border}`, background:i%2===0?"transparent":`${C.muted}40` }}>
                      <td style={{ padding:"9px 12px", fontFamily:"monospace" }}>{s.scenario}</td>
                      <td style={{ padding:"9px 12px", color:C.dim }}>{s.calls.toLocaleString()}</td>
                      <td style={{ padding:"9px 12px", fontWeight:700, color:statusColor(s.status) }}>{fmt(s.trust_score,1)}</td>
                      <td style={{ padding:"9px 12px", color:gapColor(s.resolution_gap) }}>{pct(s.resolution_gap)}</td>
                      <td style={{ padding:"9px 12px", color:bColor(s.bandaid_rate) }}>{pct(s.bandaid_rate)}</td>
                      <td style={{ padding:"9px 12px" }}><Tag status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DRIFT TIMELINE ── */}
        {activeView==="drift" && (
          <div>
            {[
              { title:"Trust Score Over Time", keys:[{ k:"trust", n:"Trust Score", c:C.accent, sw:2.5, dot:true }],
                domain:[0,100], refs:[{ y:65, c:C.watch, l:"WATCH" },{ y:50, c:C.veto, l:"VETO" }], h:260 },
              { title:"SII Trajectory", keys:[{ k:"SII", n:"SII", c:statusColor(sii.status), sw:2.5, dot:true }],
                domain:[0,100], refs:[{ y:30, c:C.watch, l:"WATCH≥30" },{ y:60, c:C.veto, l:"VETO≥60" }], h:200 },
              { title:"Signal Components ×100", keys:[
                  { k:"DAR", n:"DAR×100", c:C.dar }, { k:"DRL", n:"DRL×100", c:C.drl },
                  { k:"DOV", n:"DOV×100", c:C.dov }, { k:"POR", n:"POR×100", c:C.por }
                ], domain:undefined, refs:[], h:220, legend:true },
              { title:"Resolution Gap Trend", keys:[{ k:"gap", n:"Gap (pp)", c:C.veto }],
                domain:undefined, refs:[], h:200 },
            ].map((cfg,i) => (
              <div key={i} style={{ ...card, marginBottom:20 }}>
                <SectionHeader accent={cfg.keys[0].c}>{cfg.title}</SectionHeader>
                <ResponsiveContainer width="100%" height={cfg.h}>
                  <LineChart data={monthlyData} margin={{ left:0, right:20, top:10, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="month" tick={{ fill:C.dim, fontSize:10 }} />
                    <YAxis domain={cfg.domain} tick={{ fill:C.dim, fontSize:10 }} />
                    <Tooltip content={<ChartTip />} />
                    {cfg.legend && <Legend wrapperStyle={{ fontSize:11 }} />}
                    {(cfg.refs||[]).map(ref => (
                      <ReferenceLine key={ref.y} y={ref.y} stroke={ref.c} strokeDasharray="4 3"
                        label={{ value:ref.l, fill:ref.c, fontSize:9 }} />
                    ))}
                    {cfg.keys.map(k => (
                      <Line key={k.k} type="monotone" dataKey={k.k} name={k.n} stroke={k.c}
                        strokeWidth={k.sw||2} dot={k.dot ? { fill:k.c, r:4 } : false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )}

        {/* ── REP RISK ── */}
        {activeView==="reps" && (() => {
          const lowestScore = data.rep_health.lowest_trust_reps[0]?.trust_score ?? 100;
          const allOk       = lowestScore >= 65;
          const vetoCount   = data.rep_health.lowest_trust_reps.filter(r=>r.trust_score<50).length;
          const watchCount  = data.rep_health.lowest_trust_reps.filter(r=>r.trust_score>=50&&r.trust_score<65).length;
          const bc          = allOk ? C.ok : vetoCount>0 ? C.veto : C.watch;
          return (
            <div>
              <div style={{ background:`${bc}0d`, border:`1px solid ${bc}30`, borderLeft:`4px solid ${bc}`,
                borderRadius:6, padding:"14px 20px", marginBottom:20, fontSize:12, lineHeight:1.7, color:C.text }}>
                <strong style={{ color:bc }}>
                  {allOk ? "Rep performance is within bounds." : vetoCount>0 ? `${vetoCount} rep(s) below VETO threshold (50).` : `${watchCount} rep(s) in WATCH range (50–65).`}
                </strong>
                {"  "}
                {allOk
                  ? `Lowest-scoring rep is ${fmt(lowestScore,1)} — above the WATCH threshold of 65. No individual rep is producing measurement that compromises AI training.`
                  : vetoCount>0
                  ? "These reps' calls should be excluded from AI training data until the signal is clean."
                  : "Monitor these reps for continued drift before the next optimization cycle."}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
                {[
                  { title: allOk ? "Lowest Trust Reps (all within bounds)" : "Highest Risk Reps",
                    reps: data.rep_health.lowest_trust_reps,
                    accent: allOk ? C.watch : C.veto,
                    note: allOk
                      ? "All reps in this dataset are operating within governance bounds. The gap column shows minor proxy-true divergence — expected at this scale."
                      : "These reps' resolution gaps indicate systematic proxy inflation. Calls from VETO-level reps are unreliable training data." },
                  { title: "Highest Trust Reps",
                    reps: data.rep_health.highest_trust_reps,
                    accent: C.ok,
                    note: "These reps verify resolution independently before flagging. Their call patterns represent the measurement standard the rest of the system should match." },
                ].map(col => (
                  <div key={col.title} style={card}>
                    <SectionHeader accent={col.accent}>{col.title}</SectionHeader>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                      <thead>
                        <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                          {["Rep ID","Calls","Trust Score","Gap"].map(h => (
                            <th key={h} style={{ padding:"8px 10px", textAlign:"left", color:C.dim, fontSize:10, letterSpacing:"0.06em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {col.reps.map((r,i) => {
                          const rc = r.trust_score<50?C.veto:r.trust_score<65?C.watch:C.ok;
                          return (
                            <tr key={r.rep_id} style={{ borderBottom:`1px solid ${C.border}`, background:i%2===0?"transparent":`${C.muted}40` }}>
                              <td style={{ padding:"9px 10px", fontFamily:"monospace", color:rc, fontWeight:700 }}>{r.rep_id}</td>
                              <td style={{ padding:"9px 10px", color:C.dim }}>{r.calls.toLocaleString()}</td>
                              <td style={{ padding:"9px 10px", fontWeight:700, color:rc }}>{fmt(r.trust_score,1)}</td>
                              <td style={{ padding:"9px 10px", color:gapColor(r.resolution_gap) }}>{pct(r.resolution_gap)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div style={{ marginTop:14, fontSize:11, color:C.dim, lineHeight:1.6 }}>{col.note}</div>
                  </div>
                ))}
              </div>
              <div style={card}>
                <SectionHeader accent={C.accent}>Rep Distribution</SectionHeader>
                <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                  <StatBox label="Total Reps"    value={data.rep_health.total_reps} />
                  <StatBox label="VETO-Level"    value={vetoCount}  sub="trust < 50" color={vetoCount>0  ? C.veto  : C.ok} />
                  <StatBox label="WATCH-Level"   value={watchCount} sub="trust 50–65" color={watchCount>0 ? C.watch : C.ok} />
                  <StatBox label="Exemplary (>90)" value={data.rep_health.highest_trust_reps.filter(r=>r.trust_score>90).length} sub="trust > 90" color={C.ok} />
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── TRANSCRIPT ANALYSIS ── */}
        {activeView==="transcripts" && (
          <div>
            <div style={{ background:`${C.accent}10`, border:`1px solid ${C.accent}30`,
              borderRadius:6, padding:"14px 20px", marginBottom:20, fontSize:12, lineHeight:1.7, color:C.dim }}>
              Each call shows what the transcript reveals about measurement quality — whether signals fired, why,
              and what they mean. <strong style={{ color:C.text }}>Good calls and bad calls both tell the story honestly.</strong>
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:C.dim, marginBottom:10, letterSpacing:"0.06em", textTransform:"uppercase" }}>
                {data.transcript_signals.length} calls —{" "}
                <span style={{ color:C.veto }}>{data.transcript_signals.filter(c=>c.status==="VETO").length} VETO</span> ·{" "}
                <span style={{ color:C.watch }}>{data.transcript_signals.filter(c=>c.status==="WATCH").length} WATCH</span> ·{" "}
                <span style={{ color:C.ok }}>{data.transcript_signals.filter(c=>c.status==="OK").length} OK</span>
              </div>
              {data.transcript_signals.map(call => <TranscriptCard key={call.call_id} call={call} />)}
            </div>
            <div style={card}>
              <SectionHeader accent={C.accent}>What the Transcripts Reveal</SectionHeader>
              <InsightPanel insights={insights} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
