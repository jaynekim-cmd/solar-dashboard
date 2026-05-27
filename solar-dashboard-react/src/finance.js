// ── State electricity rates ────────────────────────────
// Source: ElectricChoice.com (EIA residential rates, May 2026)
export const STATE_RATES = {
  "Alabama": 0.1679,
  "Alaska": 0.2657,
  "Arizona": 0.1562,
  "Arkansas": 0.1332,
  "California": 0.3375,
  "Colorado": 0.1633,
  "Connecticut": 0.2784,
  "Delaware": 0.1839,
  "District of Columbia": 0.2403,
  "Florida": 0.1577,
  "Georgia": 0.1460,
  "Hawaii": 0.4200,
  "Idaho": 0.1251,
  "Illinois": 0.1882,
  "Indiana": 0.1742,
  "Iowa": 0.1354,
  "Kansas": 0.1523,
  "Kentucky": 0.1368,
  "Louisiana": 0.1244,
  "Maine": 0.2955,
  "Maryland": 0.2240,
  "Massachusetts": 0.3151,
  "Michigan": 0.2055,
  "Minnesota": 0.1644,
  "Mississippi": 0.1453,
  "Missouri": 0.1301,
  "Montana": 0.1433,
  "Nebraska": 0.1319,
  "Nevada": 0.1383,
  "New Hampshire": 0.2739,
  "New Jersey": 0.2265,
  "New Mexico": 0.1500,
  "New York": 0.2707,
  "North Carolina": 0.1512,
  "North Dakota": 0.1287,
  "Ohio": 0.1793,
  "Oklahoma": 0.1448,
  "Oregon": 0.1623,
  "Pennsylvania": 0.2058,
  "Rhode Island": 0.3130,
  "South Carolina": 0.1571,
  "South Dakota": 0.1415,
  "Tennessee": 0.1312,
  "Texas": 0.1618,
  "Utah": 0.1375,
  "Vermont": 0.2489,
  "Virginia": 0.1643,
  "Washington": 0.1412,
  "West Virginia": 0.1626,
  "Wisconsin": 0.1845,
  "Wyoming": 0.1518
};

// ── Model assumptions ──────────────────────────────────
const COST_PER_W = 2.50;   // $2.50 per watt installed cost
const GEN_PER_KW = 1400;   // kWh generated per kW per year
const ELEC_ESC   = 0.025;  // electricity price rises 2.5% per year
const OM_PER_KW  = 15;     // $15 per kW per year O&M cost
const ITC_RATE   = 0.30;   // 30% tax credit applied in year 0

// ── Calculate 25-year cash flows ───────────────────────
export function calcCashFlows(systemSizeKw, stateName) {
  const elecRate  = STATE_RATES[stateName];
  const upfront   = systemSizeKw * 1000 * COST_PER_W;
  const annualGen = systemSizeKw * GEN_PER_KW;
  const omCost    = systemSizeKw * OM_PER_KW;
  const itcCredit = upfront * ITC_RATE;

  // Year 0: upfront cost offset by ITC credit
  const cashflows = [(-upfront) + itcCredit];

  // Years 1-25: electricity savings minus O&M
  for (let y = 1; y <= 25; y++) {
    const revenue = annualGen * elecRate * Math.pow(1 + ELEC_ESC, y - 1);
    cashflows.push(revenue - omCost);
  }

  return { cashflows, upfront, annualGen, itcCredit, omCost };
}

// ── IRR solver (Newton-Raphson) ────────────────────────
export function calcIRR(cashflows) {
  let rate = 0.1;
  for (let i = 0; i < 300; i++) {
    let npv = 0, dnpv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const d  = Math.pow(1 + rate, t);
      npv  +=  cashflows[t] / d;
      dnpv -= t * cashflows[t] / (d * (1 + rate));
    }
    if (Math.abs(dnpv) < 1e-12) break;
    const next = rate - npv / dnpv;
    if (Math.abs(next - rate) < 1e-9) { rate = next; break; }
    rate = next;
  }
  return isFinite(rate) && rate > -1 ? rate : null;
}

// ── Payback period ─────────────────────────────────────
export function calcPayback(cashflows) {
  let cumulative = 0;
  for (let t = 0; t < cashflows.length; t++) {
    const prev = cumulative;
    cumulative += cashflows[t];
    if (prev < 0 && cumulative >= 0) {
      return (t - 1) + Math.abs(prev) / cashflows[t];
    }
  }
  return null;
}

// ── Dollar formatter ───────────────────────────────────
export function fmtDollar(n) {
  const abs = Math.round(Math.abs(n)).toLocaleString('en-US');
  return (n < 0 ? '-$' : '$') + abs;
}