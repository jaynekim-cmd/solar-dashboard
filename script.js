// Electricity rates by state 
// (residential ¢/kWh, source: ElectricChoice.com, EIA May 2026)
const STATE_RATES = {
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

// ── Model constants (from the brief) ──────────────────────
const COST_PER_W  = 2.50;  // $2.50 per watt installed cost
const GEN_PER_KW  = 1400;  // kWh generated per kW per year
const ELEC_ESC    = 0.025; // electricity price rises 2.5% per year
const OM_PER_KW   = 15;    // $15 per kW per year for operations & maintenance
const ITC_RATE    = 0.30;  // 30% tax credit applied in year 0

// ── Calculate 25-year cash flows ──────────────────────────
function calcCashFlows(systemSizeKw, stateName) {
  const elecRate  = STATE_RATES[stateName];
  const upfront   = systemSizeKw * 1000 * COST_PER_W;  // kW → W, then × $/W
  const annualGen = systemSizeKw * GEN_PER_KW;          // kWh per year
  const omCost    = systemSizeKw * OM_PER_KW;           // flat O&M per year
  const itcCredit = upfront * ITC_RATE;                 // 30% back in year 0

  // Year 0: pay upfront, receive ITC credit
  const cashflows = [(-upfront) + itcCredit];

  // Years 1-25: revenue from electricity savings minus O&M
  for (let y = 1; y <= 25; y++) {
    const revenue = annualGen * elecRate * Math.pow(1 + ELEC_ESC, y - 1);
    const net     = revenue - omCost;
    cashflows.push(net);
  }

  return { cashflows, upfront, annualGen, itcCredit, omCost };

}

// ── IRR solver (Newton-Raphson method) ────────────────────
function calcIRR(cashflows) {
  let rate = 0.1; // start with a 10% guess
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

// ── Payback period ────────────────────────────────────────
function calcPayback(cashflows) {
  let cumulative = 0;
  for (let t = 0; t < cashflows.length; t++) {
    const prev = cumulative;
    cumulative += cashflows[t];
    // interpolate the exact fractional year it crosses zero
    if (prev < 0 && cumulative >= 0) {
      return (t - 1) + Math.abs(prev) / cashflows[t];
    }
  }
  return null; // never pays back within 25 years
}

// ── Populate state dropdown from STATE_RATES ──────────────
const stateEl = document.getElementById('state');
const sizeEl  = document.getElementById('size');

Object.keys(STATE_RATES).sort().forEach(state => {
  const option = document.createElement('option');
  option.value = state;
  option.textContent = state;
  stateEl.appendChild(option);
});

// ── Helper: format a number as a dollar amount ────────────
function fmtDollar(n) {
  const abs = Math.round(Math.abs(n)).toLocaleString('en-US');
  return (n < 0 ? '-$' : '$') + abs;
}

// ── Main function: runs when either input changes ─────────
function run() {
  const state = stateEl.value;
  const size  = parseFloat(sizeEl.value);

  // Validate inputs
  if (!state || !size || size <= 0) {
    document.getElementById('results').style.display = 'none';
    document.getElementById('size-error').textContent =
      sizeEl.value && size <= 0 ? 'Please enter a positive number.' : '';
    return;
  }

  document.getElementById('size-error').textContent = '';

  // Run the model
  const { cashflows, upfront, annualGen, itcCredit } = calcCashFlows(size, state);
  const irr     = calcIRR(cashflows);
  const payback = calcPayback(cashflows);

  // Update metric cards
  document.getElementById('m-cost').textContent = fmtDollar(upfront);
  document.getElementById('m-gen').textContent  = Math.round(annualGen).toLocaleString() + ' kWh';
  document.getElementById('m-irr').textContent  = irr !== null ? (irr * 100).toFixed(1) + '%' : 'N/A';
  document.getElementById('m-pb').textContent   = payback !== null ? payback.toFixed(1) + ' yrs' : '>25 yrs';

  // Build cash flow table
  const tbody = document.getElementById('cf-body');
  tbody.innerHTML = '';

  // Year 0 row
  const r0 = document.createElement('tr');
  r0.innerHTML = `
  <td>0</td>
  <td>—</td>
  <td>—</td>
  <td class="pos">${fmtDollar(itcCredit)}</td>
  <td class="neg">${fmtDollar(cashflows[0])}</td>
  <td class="neg">${fmtDollar(cashflows[0])}</td>
`;
  tbody.appendChild(r0);

  // Years 1-25
  let cumulative = cashflows[0];
  for (let y = 1; y <= 25; y++) {
    cumulative += cashflows[y];
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${y}</td>
        <td class="pos">${fmtDollar(cashflows[y] + (size * OM_PER_KW))}</td>
        <td class="neg">${fmtDollar(-(size * OM_PER_KW))}</td>
        <td>—</td>
        <td class="pos">${fmtDollar(cashflows[y])}</td>
        <td class="${cumulative >= 0 ? 'pos' : 'neg'}">${fmtDollar(cumulative)}</td>
    `;
    tbody.appendChild(tr);
  }

  document.getElementById('results').style.display = 'block';
}

// ── Listen for input changes ──────────────────────────────
stateEl.addEventListener('change', run);
sizeEl.addEventListener('input', run);

// ── Dark / light mode toggle ──────────────────────────
const toggleBtn = document.getElementById('theme-toggle');

toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  toggleBtn.textContent = isDark ? '☀️ Light mode' : '🌙 Dark mode';
});
