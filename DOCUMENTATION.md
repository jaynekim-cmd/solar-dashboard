# Solar Dashboard — Documentation

## Key Assumptions

| Parameter | Value | Source / Rationale |
|---|---|---|
| Installed cost | $2.50/W | Per brief specification |
| Annual generation | 1,400 kWh/kW | Per brief — location-agnostic |
| Electricity price | Varies by state | ElectricChoice.com (EIA, May 2026) |
| Electricity escalation | 2.5%/year | Per brief |
| O&M cost | $15/kW/year (flat) | Per brief — no escalation applied |
| ITC credit | 30% of installed cost | Per brief — applied in Year 0 |
| Financing | All equity | Per brief — no debt or interest |
| Project life | 25 years | Per brief |
| Degradation | None modeled | Brief did not specify; simplifying assumption |

## Financial Model Structure

### Year 0
- Upfront cost = System size (kW) × 1,000 × $2.50/W
- ITC credit = Upfront cost × 30%
- Net Year 0 cash flow = −Upfront cost + ITC credit

### Years 1–25
- Revenue = Annual generation × Electricity rate × (1 + 2.5%)^(year−1)
- Annual generation = System size (kW) × 1,400 kWh/kW
- O&M cost = System size (kW) × $15/kW (flat, no escalation)
- Net cash flow = Revenue − O&M

### IRR
Internal rate of return is solved numerically using Newton-Raphson
iteration on the full 26-element cash flow array (Year 0 through
Year 25). Convergence tolerance is 1×10⁻⁹, maximum 300 iterations.

### Payback Period
Cumulative cash flow is tracked year by year. When it crosses zero
the fractional payback year is linearly interpolated:

Payback = (year − 1) + |cumulative at end of prior year| / net CF in crossing year

## Technical Architecture

The application is a single-page React app built with Vite with no
external dependencies beyond React itself.

### Separation of concerns

| Layer | File | Responsibility |
|---|---|---|
| Financial model | finance.js | All calculations — calcCashFlows, calcIRR, calcPayback |
| UI & rendering | App.jsx | React component, handles inputs and displays results |
| Styles | App.css | All visual styling, responsive layout |
| Entry point | main.jsx | Mounts the React app, no logic |

### Why React over vanilla JS
The brief preferred React. Using React also gives clear separation
between the financial model (finance.js) and the UI (App.jsx),
making the code easier to read and maintain.

### Why Vite
Vite is the modern standard for React projects — fast dev server,
clean builds, and simple GitHub Pages deployment.

### Electricity rates
Stored as a static lookup table in finance.js, sourced from
ElectricChoice.com (EIA residential rates, May 2026). This keeps
the app fully offline-capable with no API calls needed.

### Error handling
- Validates that system size is a positive finite number
- Results section only renders when both inputs are valid
- If IRR fails to converge, displays N/A
- If payback is not reached within 25 years, displays >25 yrs