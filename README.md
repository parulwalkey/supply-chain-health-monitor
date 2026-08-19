# 🤖 Supplier Intelligence Copilot

An AI-assisted supplier risk decision-support prototype that combines **deterministic supply chain analytics** with **LLM-based synthesis and recommendations** — built as a natural evolution of the Supply Chain Health Monitor dashboard.

🔗 **[View Live Demo](https://supplier-intelligence-copilot.netlify.app)**  
📊 **[Original Analytics Project](https://public.tableau.com/views/InventorySupplyChainHealthMonitoringStory/Story1)**  
💻 **[GitHub — Supply Chain Health Monitor](https://github.com/parulwalkey/supply-chain-health-monitor)**

---

## 📌 Why I Built This

My original Supply Chain Health Monitor used SQL and Tableau to surface supplier performance, inventory health, defect rates, and lead-time patterns across 100 SKUs and 5 suppliers.

That dashboard answered:

> **What is happening?**

But an analyst still had to manually interpret multiple metrics to answer:

> **Which supplier needs attention, why does it need attention, and what should I investigate next?**

That gap between seeing data and knowing what to do with it is where most supply chain decisions slow down. I built the **Supplier Intelligence Copilot** to explore how a small, well-designed AI layer could reduce that interpretation burden — without replacing the trusted business logic or human judgment that procurement decisions depend on.

---

## 🛠️ Tools & Technologies

| Category | Tools |
|---|---|
| **Data & Analytics** | SQL · Excel · Cleaned Supply Chain Dataset · Tableau |
| **Web Prototype** | HTML · CSS · JavaScript · Netlify |
| **AI Layer** | OpenAI API · Netlify Serverless Functions |
| **AI Design** | Context Engineering · Structured JSON Output · Guardrails · Human-in-the-Loop |

---

## 🧠 Product Approach

The system separates responsibilities clearly between what machines are good at and what humans are good at.

### What deterministic logic handles (trusted facts):
- Supplier defect rate aggregation
- Supplier risk classification (Low / Medium / High)
- Inspection pass rate
- High-risk SKU count and rate
- Lead-time deviation from portfolio benchmark
- Inventory status per SKU (Understocked / Healthy / Overstocked)

### What the AI layer handles (interpretation and synthesis):
- Explaining the supplier's risk in plain language
- Identifying the most important risk drivers from multiple signals
- Surfacing healthy signals alongside red flags
- Connecting conclusions to specific evidence
- Recommending investigation or mitigation actions
- Flagging missing information honestly

### What stays human (consequential decisions):
The system does **not** autonomously execute procurement decisions. Human review is required for:

- Removing or terminating suppliers
- Changing sourcing volume or allocation
- Issuing purchase orders
- Modifying or renegotiating contracts

---

## ⚙️ How It Works

```
Supply Chain Dataset
        ↓
Deterministic Analytics
        ↓
Supplier-Level Metrics
        ↓
Supplier Risk Classification
        ↓
Trusted Supplier Context (structured JSON)
        ↓
LLM Interpretation Layer
        ↓
Structured Risk Brief
        ↓
Human Review & Decision
```

The LLM is **not the source of truth.** The cleaned supply chain dataset and deterministic calculations are the source of truth. The model receives facts. It synthesizes and explains them. Humans decide what to do.

---

## 📐 Risk Scoring Logic

### SKU-Level Quality Risk (from original dataset)

```
Defect Rate >= 4.0%              → High Risk
Defect Rate >= 2.5% and < 4.0%  → Medium Risk
Defect Rate < 2.5%              → Low Risk
```

### Supplier-Level Risk (Copilot extension)

The same thresholds are applied to each supplier's **aggregated average defect rate** to produce a supplier-level risk tier. This aggregation is an intentional extension created for the Copilot and is kept separate from the original SKU-level classification to preserve data integrity.

| Supplier | Avg Defect Rate | Risk Tier |
|---|---|---|
| Supplier 1 | 1.80% | Low Risk |
| Supplier 2 | 2.36% | Medium Risk |
| Supplier 3 | 2.47% | Medium Risk |
| Supplier 4 | 2.34% | Medium Risk |
| Supplier 5 | 2.67% | Medium Risk |

The LLM is instructed to **repeat the deterministic risk tier exactly** rather than calculate its own risk classification.

---

## 📦 Inventory Logic

Inventory status is determined using the same rules as the original analytics project:

```
Stock Levels < Order Quantity           → Understocked
Stock Levels > Order Quantity × 2      → Overstocked
Otherwise                               → Healthy
```

The model receives pre-calculated inventory counts rather than inferring health from raw numbers.

---

## 🔗 Trusted Supplier Context

Before the model is called, the application builds a structured context object containing only the information relevant to the supplier-risk decision. This context-engineering layer limits irrelevant information and gives the model a defined evidence boundary.

**Example — Supplier 5:**

```json
{
  "Supplier_name": "Supplier 5",
  "Aggregated_Supplier_Risk": {
    "Risk_Tier": "Medium Risk",
    "Avg_Defect_Rate_Pct": 2.67
  },
  "Quality": {
    "Pass_Rate_Pct": 16.7,
    "High_Risk_SKUs": 5,
    "Total_SKUs": 18,
    "High_Risk_SKU_Rate_Pct": 27.8
  },
  "Delivery": {
    "Avg_Lead_Time_Deviation": -1.28,
    "Lead_Time_Benchmark_Days": 16
  },
  "Inventory": {
    "Understocked_SKUs": 11,
    "Healthy_SKUs": 4,
    "Overstocked_SKUs": 3
  }
}
```

> **Note on lead-time deviation sign:** A negative value means the supplier delivers **faster than the portfolio average** (16 days benchmark), not slower. A positive value means delayed. The model is explicitly instructed on this sign convention to prevent misinterpretation.

---

## 📋 Structured AI Output

The AI response follows a predefined structure so the application can render it reliably regardless of what the model says:

```json
{
  "risk_tier": "Medium Risk",
  "summary": "...",
  "top_risk_drivers": [
    { "driver": "...", "evidence": "..." }
  ],
  "healthy_signals": [
    { "signal": "...", "evidence": "..." }
  ],
  "recommended_actions": ["..."],
  "data_limitations": [],
  "human_review_required": true
}
```

Structured output makes the AI response predictable enough to render as a decision-ready brief rather than unstructured text.

---

## 🛡️ Guardrails

The Copilot is instructed to:

- Use **only** information contained in the trusted supplier context
- Never invent contracts, costs, demand forecasts, SLAs, purchase orders, or supplier history
- Never override the deterministic risk tier with its own classification
- Distinguish positive and negative operational signals rather than presenting a one-sided view
- Cite specific evidence for major risk drivers
- State missing information honestly rather than guessing
- Keep all recommendations advisory
- Require human review before consequential decisions

---

## 🔍 Example — Supplier 5 Analysis

For Supplier 5, the deterministic system identifies:

| Signal | Value |
|---|---|
| Supplier Risk Tier | Medium Risk |
| Average Defect Rate | 2.67% |
| Inspection Pass Rate | 16.7% |
| High-Risk SKUs | 5 of 18 (27.8%) |
| Avg Lead-Time Deviation | -1.28 days (faster than average) |
| Understocked SKUs | 11 |
| Healthy SKUs | 4 |
| Overstocked SKUs | 3 |

The Copilot synthesizes these signals into a decision-ready explanation — surfacing both the quality concerns and the positive delivery signal — while preserving the original deterministic risk classification throughout.

---

## 🔄 Workflow Comparison

### Original Analytics Workflow

```
Supply Chain Data  →  SQL Analysis  →  Tableau Dashboard
        ↓
Analyst Reviews Multiple Metrics
        ↓
Analyst Interprets Risk Manually
        ↓
Decision
```

### AI-Assisted Workflow

```
Supply Chain Data  →  Deterministic Analytics  →  Supplier Context
        ↓
AI Risk Brief (Evidence + Recommended Investigation)
        ↓
Human Review
        ↓
Decision
```

The AI layer does not replace the analytical foundation. It reduces the time an analyst spends moving from data to interpretation.

---

## 💡 Product Principles

This prototype follows principles I wanted to stress-test while learning AI product design:

1. **Do not use AI where deterministic logic is more reliable.** Risk tiers are calculated, not generated.
2. **Treat the LLM as an interpretation layer, not the source of truth.** Data provides facts. AI explains them.
3. **Give the model only the context required for the task.** Irrelevant information increases noise.
4. **Require evidence for important conclusions.** Unsupported AI claims are harder to act on.
5. **Design explicitly for missing information and failure.** The model should say what it does not know.
6. **Keep consequential business decisions human-controlled.** AI recommends. Humans decide.
7. **Evaluate the complete decision workflow, not just whether the model generates convincing text.**

---

## 🚀 Future Roadmap

### V1 — Current Prototype
Deterministic supplier analytics combined with AI-generated supplier risk briefs.

### V2 — Tool-Using Assistant
Allow the model to retrieve approved information dynamically through structured tools:

```
get_supplier_metrics()
get_inventory_status()
get_high_risk_skus()
```

### V3 — Retrieval-Augmented Generation
Add trusted enterprise documents as retrieval sources:
- Supplier contracts and SLAs
- Quality inspection reports
- Corrective action reports
- Procurement policies
- Historical supplier scorecards

### V4 — Agentic Supplier Investigation
A user types: *"Investigate Supplier 5."*

The system dynamically determines which approved tools to call, gathers evidence across multiple data sources, analyzes the supplier, and prepares a structured investigation brief — with human approval required before any consequential action is taken.

### V5 — Enterprise Integration
- ERP and procurement API connectivity
- Role-based authentication and authorization
- Approval workflows
- Audit logging and decision traceability
- Monitoring and evaluation pipelines

---

## ⚠️ Limitations

This is a portfolio prototype, not a production procurement system. Current limitations are documented deliberately because they would materially influence how the system should be redesigned for enterprise deployment:

- Static prototype dataset (100 SKUs, 5 suppliers)
- No live ERP or procurement system integration
- No supplier contract or historical document retrieval
- No enterprise authentication or authorization layer
- AI recommendations have not been evaluated at production scale
- Supplier risk logic is intentionally simplified for demonstration

---

## 💭 What I Learned

Building this project changed how I think about AI products.

The most important question turned out not to be:

> **"Where can I add an LLM?"**

It was:

> **"Which part of the user's decision workflow still creates friction, and what is the smallest AI layer that genuinely improves it without replacing the trusted logic underneath?"**

That question led to a system where data provides facts, deterministic logic establishes risk, AI explains and synthesizes, and humans make the final call. That separation of responsibilities is what makes the output trustworthy enough to act on.

---

## 👩‍💼 About This Project

Built as part of a supply chain and AI product management portfolio, demonstrating the ability to translate operational domain knowledge into a functional AI-assisted product prototype.

**Skills demonstrated:**
- Supply chain domain expertise applied to AI product design
- Context engineering and structured LLM output design
- Deterministic vs. probabilistic responsibility separation
- Human-in-the-loop system architecture
- AI guardrail design and failure mode planning
- End-to-end product thinking from problem definition to working prototype

---

*Built with SQL · Tableau · HTML/CSS/JS · OpenAI API · Netlify*
