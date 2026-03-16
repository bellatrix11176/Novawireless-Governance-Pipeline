# NovaWireless Governance Pipeline

**Reference implementation of governance signals from:**

---

⚠️ Resource Notice
This pipeline is designed to be run iteratively on small datasets. Do not run against large datasets in a single pass. Process one month at a time to avoid memory and CPU overload. Adjust chunk sizes based on your available system resources.

---

> Aulabaugh, G. (2026). *When KPIs Lie: Governance Signals for AI-Optimized Call Centers.* PixelKraze, LLC.

This repository contains the base pipeline implementing the five governance signals and System Integrity Index (SII) defined in Aulabaugh (2026). It is the canonical reference for reproducing the paper's results against the NovaWireless synthetic dataset.

> **Looking for the lab-enhanced version?** See [`NovaWireless-Governance-Pipeline-Aligned`](https://github.com/bellatrix11176/NovaWireless-Governance-Pipeline-Aligned), which adds five post-publication improvements: rep-level DAR, scripted language detection, credit burden ratio, updated rep drift scoring, and scenario-level DOV.

---

## What This Pipeline Does

AI-optimized call centers can achieve high FCR (First Call Resolution) scores while failing customers — because the metric being optimized is a proxy, not the outcome itself. This is Goodhart's Law in production.

This pipeline detects that dynamic. It ingests call-level data and computes five governance signals that measure different failure modes in AI-optimized systems:

| Signal | Name | What It Detects |
|--------|------|-----------------|
| **DAR** | Detection Avoidance Rate | Repeat contacts among calls marked resolved (31–60 day window) |
| **DRL** | Distribution Runaway Likelihood | Scenario mix drift from baseline via Jensen-Shannon divergence |
| **DOV** | Durable Outcome Validation | Proxy label error rate — calls marked resolved that weren't |
| **POR** | Proxy-Outcome Ratio | Magnitude of proxy-true divergence relative to baseline |
| **TER** | Target Escape Rate | Churn among proxy-resolved calls (diagnostic only) |
| **SII** | System Integrity Index | Composite score: `100 × (0.30×DAR + 0.20×DRL + 0.25×DOV + 0.25×POR)` |

### SII Alert Thresholds

| SII | Status | Action |
|-----|--------|--------|
| ≥ 60 | **VETO** | Halt AI optimization, re-audit resolution labels |
| ≥ 30 | **WATCH** | Human review required |
| < 30 | **OK** | Within acceptable parameters |

---

## Repository Structure

```
NovaWireless-Governance-Pipeline/
├── src/
│   └── novawireless_trust_signals_pipeline.py
├── data/
│   └── calls_sanitized_YYYY-MM.csv     # 12 files, Jan–Dec 2025
├── output/
│   ├── data/                           # 9 output CSVs
│   ├── figures/                        # 12 PNGs
│   └── reports/                        # 6 JSON/TXT report files
├── docs/
│   ├── NovaWireless_APA_Paper.pdf
│   └── NovaWireless_Executive_Summary.pdf
├── README.md
└── LICENSE
```

---

## Quickstart

**Requirements:** Python 3.8+, pandas, numpy, scipy, matplotlib, seaborn

```bash
git clone https://github.com/bellatrix11176/NovaWireless-Governance-Pipeline.git
cd NovaWireless-Governance-Pipeline
pip install -r requirements.txt

# Run with default settings
python src/novawireless_trust_signals_pipeline.py

# Run with quarantine duplicate policy
python src/novawireless_trust_signals_pipeline.py --dupe_policy quarantine_extras_keep_latest

# Set minimum calls threshold for rep ranking
python src/novawireless_trust_signals_pipeline.py --min_calls_for_rank 30
```

---

## Input Data Format

The pipeline expects monthly CSV files in `data/` named `calls_sanitized_YYYY-MM.csv`.

### Required Columns

| Column | Description |
|--------|-------------|
| `call_id` | Unique call identifier |
| `call_date` | Date of call |
| `scenario` | Call scenario label |
| `call_type` | Type of call |
| `rep_id` | Representative identifier |
| `customer_id` | Customer identifier |
| `true_resolution` | Ground truth resolution outcome |
| `resolution_flag` | Proxy resolution label (what the system recorded) |
| `credit_applied` | Whether a credit was applied |
| `credit_type` | Type of credit |
| `credit_authorized` | Whether credit was authorized |

### Known Scenarios

```
clean, gamed_metric, loyalty_offer_missed, activation_clean, activation_failed,
line_add_legitimate, unresolvable_clean, fraud_store_promo, fraud_line_add,
fraud_hic_exchange, fraud_care_promo
```

---

## Output Files

### Reports (`output/reports/`)

| File | Contents |
|------|----------|
| `governance_report.json` | Full governance signal values and metadata |
| `paper_signals.json` | Signal values in paper-canonical format |
| `threshold_alerts.json` | Machine-readable alert list |
| `threshold_alerts.txt` | Human-readable alert summary |
| `summary_report.txt` | Plain-text run summary |
| `integrity_summary.json` | SII and component breakdown |

### Figures (`output/figures/`)

12 PNG figures covering trust score distribution, proxy vs. true resolution by scenario, scenario DOV, drift heatmap, credit type analysis, scripted language by scenario, monthly trust trend, monthly gap trend, churn by trust decile, rep trust landscape, rep DAR ranking, and rep signal correlations.

---

## Paper Configuration

Signal thresholds and weights are defined in `PAPER_CONFIG` and match Aulabaugh (2026) exactly:

```python
PAPER_CONFIG = {
    'DAR_L': 0.05, 'DAR_H': 0.40,
    'DRL_L': 0.02, 'DRL_H': 0.30,
    'POR_K': 5.0,  'DOV_tau': 0.50,
    'SII_veto': 60.0, 'SII_watch': 30.0,
    'EPSILON': 1e-9,
    'SII_weights': {'DAR': 0.30, 'DRL': 0.20, 'DOV': 0.25, 'POR': 0.25},
}
```

---

## Results on NovaWireless Dataset (133,517 calls, Jan–Dec 2025)

| Metric | Value |
|--------|-------|
| Proxy resolution rate | 84.1% |
| True resolution rate | 51.3% |
| Proxy-true gap | **32.8pp** |
| SII | **21.7 (OK)** |
| Scenario-level alerts | 5 total (3 VETO, 2 WATCH) |

The aggregate SII is within acceptable range, but scenario-level analysis surfaces critical failures: `loyalty_offer_missed` (VETO) and `gamed_metric` (WATCH). This is the core finding — system-wide metrics can mask localized gaming.

**Churn decile finding:** Trust-churn correlation (r = −0.281) is a compositional artifact, not causal. Churn is flat across all deciles; the proxy metric carries no retention signal.

See `docs/NovaWireless_APA_Paper.pdf` for full results, methodology, and cross-system validation against a fraud + tenure misinformation system.

---

## Citation

```
Aulabaugh, G. (2026). When KPIs Lie: Governance Signals for AI-Optimized
Call Centers. PixelKraze, LLC.
```

---

## License

MIT License. See `LICENSE` for details.

---

## Related

- [`NovaWireless-Governance-Pipeline-Aligned`](https://github.com/bellatrix11176/NovaWireless-Governance-Pipeline-Aligned) — Lab-enhanced version with five post-publication improvements
- [`pixelkraze-research`](https://github.com/bellatrix11176/pixelkraze-research) — Research repository and theoretical home for this work
