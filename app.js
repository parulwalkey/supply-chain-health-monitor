const LEAD_TIME_BENCHMARK_DAYS = 16;
let rows = [];
let currentContext = null;

const $ = (id) => document.getElementById(id);
const round = (value, digits = 1) => Number(Number(value).toFixed(digits));
const num = (value) => Number(value) || 0;

function aggregatedSupplierRisk(avgDefectRatePct) {
  if (avgDefectRatePct >= 4) return 'High Risk';
  if (avgDefectRatePct >= 2.5) return 'Medium Risk';
  return 'Low Risk';
}

function inventoryStatus(row) {
  const stock = num(row.Stock_levels);
  const orderQty = num(row.Order_quantities);
  if (stock < orderQty) return 'Understocked';
  if (stock > orderQty * 2) return 'Overstocked';
  return 'Healthy';
}

function buildSupplierContext(supplierName) {
  const supplierRows = rows.filter((row) => row.Supplier_name === supplierName);
  const totalSkus = supplierRows.length;
  const avgDefectRate = round(supplierRows.reduce((s, r) => s + num(r.Defect_rates), 0) / totalSkus, 2);
  const passCount = supplierRows.reduce((s, r) => s + num(r.Inspection_Pass_Flag), 0);
  const passRate = round((passCount / totalSkus) * 100, 1);
  const avgLeadTimeDeviation = round(supplierRows.reduce((s, r) => s + num(r.Lead_Time_Deviation), 0) / totalSkus, 2);
  const delayedShipments = supplierRows.filter((r) => r.Lead_Time_Flag === 'Above Avg').length;
  const highRiskSkus = supplierRows.filter((r) => r.Defect_Risk_Category === 'High Risk').length;
  const highRiskSkuRate = round((highRiskSkus / totalSkus) * 100, 1);
  const inventory = { Understocked: 0, Healthy: 0, Overstocked: 0 };
  supplierRows.forEach((row) => inventory[inventoryStatus(row)]++);

  const leadTimeInterpretation = avgLeadTimeDeviation === 0
    ? `In line with the overall ${LEAD_TIME_BENCHMARK_DAYS}-day SKU average`
    : `${Math.abs(avgLeadTimeDeviation)} days ${avgLeadTimeDeviation < 0 ? 'faster' : 'slower'} than the overall SKU average`;

  return {
    Supplier_name: supplierName,
    Aggregated_Supplier_Risk: {
      Risk_Tier: aggregatedSupplierRisk(avgDefectRate),
      Risk_Basis: 'Supplier Avg_Defect_Rate_Pct',
      Avg_Defect_Rate_Pct: avgDefectRate,
      Aggregation_Note: 'Copilot-level supplier risk derived by applying the existing SKU defect-rate thresholds to supplier average defect rate.',
      Thresholds: {
        High_Risk: 'Avg_Defect_Rate_Pct >= 4.0%',
        Medium_Risk: 'Avg_Defect_Rate_Pct >= 2.5% and < 4.0%',
        Low_Risk: 'Avg_Defect_Rate_Pct < 2.5%'
      }
    },
    Quality: {
      Pass_Rate_Pct: passRate,
      High_Risk_SKUs: highRiskSkus,
      Total_SKUs: totalSkus,
      High_Risk_SKU_Rate_Pct: highRiskSkuRate,
      SKU_Risk_Definition: 'Original Defect_Risk_Category calculated per SKU using Defect_rates.'
    },
    Delivery: {
      Avg_Lead_Time_Deviation: avgLeadTimeDeviation,
      Lead_Time_Benchmark_Days: LEAD_TIME_BENCHMARK_DAYS,
      Lead_Time_Interpretation: leadTimeInterpretation,
      Delayed_Shipments: delayedShipments,
      Delayed_Shipments_Definition: "Count of SKUs where Lead_Time_Flag = 'Above Avg'; above the portfolio average, not necessarily contractually late."
    },
    Inventory: {
      Understocked_SKUs: inventory.Understocked,
      Healthy_SKUs: inventory.Healthy,
      Overstocked_SKUs: inventory.Overstocked,
      Stock_Status_Rule: 'Understocked if Stock_levels < Order_quantities; Overstocked if Stock_levels > Order_quantities × 2; otherwise Healthy.'
    }
  };
}

function metric(label, value, helper = '') {
  return `<div class="metric"><span class="metric-label">${label}</span><strong>${value}</strong>${helper ? `<small>${helper}</small>` : ''}</div>`;
}

function riskClass(risk) {
  return risk === 'High Risk' ? 'high' : risk === 'Medium Risk' ? 'medium' : 'low';
}

function renderContext() {
  currentContext = buildSupplierContext($('supplierSelect').value);
  const c = currentContext;
  const risk = c.Aggregated_Supplier_Risk.Risk_Tier;
  $('riskTier').textContent = risk;
  $('riskTier').className = `risk ${riskClass(risk)}`;

  $('qualityMetrics').innerHTML = [
    metric('Avg defect rate', `${c.Aggregated_Supplier_Risk.Avg_Defect_Rate_Pct}%`),
    metric('Inspection pass rate', `${c.Quality.Pass_Rate_Pct}%`),
    metric('High-risk SKUs', `${c.Quality.High_Risk_SKUs} / ${c.Quality.Total_SKUs}`, `${c.Quality.High_Risk_SKU_Rate_Pct}% of supplier SKUs`)
  ].join('');

  $('deliveryMetrics').innerHTML = [
    metric('Lead-time deviation', `${c.Delivery.Avg_Lead_Time_Deviation} days`, c.Delivery.Lead_Time_Interpretation),
    metric('Above-average lead-time SKUs', c.Delivery.Delayed_Shipments, 'SQL field: Delayed_Shipments'),
    metric('Portfolio benchmark', `${c.Delivery.Lead_Time_Benchmark_Days} days`)
  ].join('');

  $('inventoryMetrics').innerHTML = [
    metric('Understocked SKUs', c.Inventory.Understocked_SKUs),
    metric('Healthy SKUs', c.Inventory.Healthy_SKUs),
    metric('Overstocked SKUs', c.Inventory.Overstocked_SKUs)
  ].join('');

  $('briefArea').className = 'placeholder';
  $('briefArea').innerHTML = 'The model receives only the trusted context shown above. It cannot change the deterministic risk tier.';
  $('errorBox').classList.add('hidden');
}

function renderBrief(brief) {
  const drivers = brief.top_risk_drivers.map((item) => `<div class="evidence-card"><strong>${item.driver}</strong><span>${item.evidence}</span></div>`).join('');
  const healthy = brief.healthy_signals.length
    ? brief.healthy_signals.map((item) => `<div class="evidence-card"><strong>${item.signal}</strong><span>${item.evidence}</span></div>`).join('')
    : '<p class="muted">No material healthy signals identified from the supplied context.</p>';
  const limitations = brief.data_limitations.length
    ? `<div class="limitations"><h3>Data limitations</h3><ul>${brief.data_limitations.map((x) => `<li>${x}</li>`).join('')}</ul></div>`
    : '';

  $('briefArea').className = 'brief';
  $('briefArea').innerHTML = `
    <div class="brief-summary"><span class="risk ${riskClass(brief.risk_tier)}">${brief.risk_tier}</span><p>${brief.summary}</p></div>
    <div class="brief-columns"><div><h3>Top risk drivers</h3>${drivers}</div><div><h3>Healthy signals</h3>${healthy}</div></div>
    <div class="actions"><h3>Recommended investigation / mitigation actions</h3><ol>${brief.recommended_actions.map((x) => `<li>${x}</li>`).join('')}</ol></div>
    ${limitations}
    <div class="human-review"><strong>Human review required</strong><span>AI recommendations are advisory. Supplier changes, sourcing decisions, and purchase actions remain human-controlled.</span></div>`;
}

async function generateBrief() {
  const button = $('generateButton');
  button.disabled = true;
  button.textContent = 'Generating…';
  $('errorBox').classList.add('hidden');
  try {
    const response = await fetch('/.netlify/functions/ai-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: currentContext })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'AI brief failed.');
    renderBrief(payload);
  } catch (error) {
    $('errorBox').textContent = error.message;
    $('errorBox').classList.remove('hidden');
  } finally {
    button.disabled = false;
    button.textContent = 'Generate AI Risk Brief';
  }
}

async function init() {
  const response = await fetch('./data/supply_chain_v1.json');
  rows = await response.json();
  const suppliers = [...new Set(rows.map((r) => r.Supplier_name))].sort();
  $('supplierSelect').innerHTML = suppliers.map((s) => `<option>${s}</option>`).join('');
  $('supplierSelect').addEventListener('change', renderContext);
  $('generateButton').addEventListener('click', generateBrief);
  renderContext();
}

init().catch(() => {
  $('errorBox').textContent = 'Could not load supply-chain data.';
  $('errorBox').classList.remove('hidden');
});
