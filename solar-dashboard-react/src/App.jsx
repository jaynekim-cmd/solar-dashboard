import { useState } from 'react'
import './App.css'
import { STATE_RATES, calcCashFlows, calcIRR, calcPayback, fmtDollar } from './finance.js'

export default function App() {

  // ── React state — values that update the UI when changed ──
  const [state, setState] = useState('')
  const [size, setSize]   = useState('')
  const [sizeError, setSizeError] = useState('')

  // ── Derived values ────────────────────────────────────────
  const sizeNum = parseFloat(size)
  const isValid = state !== '' && size !== '' && sizeNum > 0

  // ── Run financial model when inputs are valid ─────────────
  let results = null
  if (isValid) {
    const { cashflows, upfront, annualGen, itcCredit, omCost } = calcCashFlows(sizeNum, state)
    const irr     = calcIRR(cashflows)
    const payback = calcPayback(cashflows)

    // Build table rows with cumulative cash flow
    const rows = []
    let cumulative = cashflows[0]
    let paybackRowSet = false

    for (let y = 1; y <= 25; y++) {
      const prev = cumulative
      cumulative += cashflows[y]
      const revenue = cashflows[y] + omCost

      // Mark the first row where cumulative turns positive
      const isPaybackRow = !paybackRowSet && prev < 0 && cumulative >= 0
      if (isPaybackRow) paybackRowSet = true

      rows.push({ year: y, revenue, om: omCost, net: cashflows[y], cumulative, isPaybackRow })
    }

    results = { upfront, annualGen, itcCredit, irr, payback, cashflows, rows }
  }

  // ── Input handlers ────────────────────────────────────────
  function handleSizeChange(e) {
    const val = e.target.value
    setSize(val)
    if (val !== '' && (isNaN(parseFloat(val)) || parseFloat(val) <= 0)) {
      setSizeError('Please enter a positive number.')
    } else {
      setSizeError('')
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="page">

      {/* Header */}
      <header>
        <div className="header-top">
          <div className="sun-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="5" fill="#0f1a26" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                stroke="#0f1a26" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1>Solar Dashboard</h1>
        </div>
        <p className="subtitle">25-year solar project financial model — enter your state and system size to begin</p>
      </header>

      {/* Inputs */}
      <div className="inputs-card">
        <div className="field">
          <label htmlFor="state">State</label>
          <select
            id="state"
            value={state}
            onChange={e => setState(e.target.value)}
          >
            <option value="">— select a state —</option>
            {Object.keys(STATE_RATES).sort().map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {/* Show the electricity rate for the selected state */}
          <p className="rate-tag">
            {state ? `¢${(STATE_RATES[state] * 100).toFixed(2)}/kWh residential rate` : ''}
          </p>
        </div>
        <div className="field">
          <label htmlFor="size">System size (kW DC)</label>
          <input
            id="size"
            type="number"
            min="0.1"
            step="0.5"
            placeholder="e.g. 10"
            value={size}
            onChange={handleSizeChange}
          />
          <p className="error">{sizeError}</p>
        </div>
      </div>

      {/* Results — only rendered when inputs are valid */}
      {isValid && results && (
        <div>

          {/* Metric cards */}
          <div className="metrics">
            <div className="metric">
              <div className="metric-icon">💰</div>
              <p className="metric-label">Upfront cost</p>
              <p className="metric-value">{fmtDollar(results.upfront)}</p>
              <p className="metric-sub">before ITC credit</p>
            </div>
            <div className="metric">
              <div className="metric-icon">⚡</div>
              <p className="metric-label">Annual generation</p>
              <p className="metric-value">{Math.round(results.annualGen).toLocaleString()} kWh</p>
              <p className="metric-sub">kWh per year</p>
            </div>
            <div className="metric">
              <div className="metric-icon">📈</div>
              <p className="metric-label">Project IRR</p>
              <p className="metric-value">
                {results.irr !== null ? (results.irr * 100).toFixed(1) + '%' : 'N/A'}
              </p>
              <p className="metric-sub">25-year return</p>
            </div>
            <div className="metric">
              <div className="metric-icon">🗓️</div>
              <p className="metric-label">Payback period</p>
              <p className="metric-value">
                {results.payback !== null ? results.payback.toFixed(1) + ' yrs' : '>25 yrs'}
              </p>
              <p className="metric-sub">years to break even</p>
            </div>
          </div>

          {/* Cash flow table */}
          <h2 className="table-title">25-year cash flow</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Revenue</th>
                  <th>O&amp;M cost</th>
                  <th>ITC credit</th>
                  <th>Net cash flow</th>
                  <th>Cumulative</th>
                </tr>
              </thead>
              <tbody>

                {/* Year 0 */}
                <tr>
                  <td>0</td>
                  <td>—</td>
                  <td>—</td>
                  <td className="pos">{fmtDollar(results.itcCredit)}</td>
                  <td className="neg">{fmtDollar(results.cashflows[0])}</td>
                  <td className="neg">{fmtDollar(results.cashflows[0])}</td>
                </tr>

                {/* Years 1-25 */}
                {results.rows.map(r => (
                  <tr key={r.year} className={r.isPaybackRow ? 'payback-row' : ''}>
                    <td>
                      {r.year}
                      {r.isPaybackRow && <span className="pb-badge">break-even</span>}
                    </td>
                    <td className="pos">{fmtDollar(r.revenue)}</td>
                    <td className="neg">{fmtDollar(-r.om)}</td>
                    <td>—</td>
                    <td className="pos">{fmtDollar(r.net)}</td>
                    <td className={r.cumulative >= 0 ? 'pos' : 'neg'}>
                      {fmtDollar(r.cumulative)}
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>

          {/* Assumptions footer */}
          <div className="assumptions">
            <span className="assumption"><strong>$2.50/W</strong> installed cost</span>
            <span className="assumption"><strong>1,400 kWh/kW</strong> annual generation</span>
            <span className="assumption"><strong>2.5%/yr</strong> electricity escalation</span>
            <span className="assumption"><strong>$15/kW/yr</strong> O&amp;M (flat)</span>
            <span className="assumption"><strong>30% ITC</strong> credit in Year 0</span>
            <span className="assumption"><strong>All equity</strong> — no financing</span>
            <span className="assumption">Rates: <strong>ElectricChoice.com</strong> May 2026</span>
          </div>

        </div>
      )}

    </div>
  )
}