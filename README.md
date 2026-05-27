# Solar Dashboard

A React web app for calculating 25-year solar project financials.
Select a US state and enter a system size to instantly see upfront
cost, annual generation, project IRR, payback period, and a full
25-year cash flow table.

## Live Demo

[View live demo](https://jaynekim-cmd.github.io/solar-dashboard/)

## Setup

Clone the repo and run locally:

    git clone https://github.com/jaynekim-cmd/solar-dashboard.git
    cd solar-dashboard/solar-dashboard-react
    npm install
    npm run dev

Then open http://localhost:5173 in your browser.

## Financial Model

| Assumption | Value |
|---|---|
| Installed cost | $2.50/W |
| Annual generation | 1,400 kWh/kW |
| Electricity rate | By state (ElectricChoice.com) |
| Electricity escalation | 2.5%/year |
| O&M cost | $15/kW/year (flat) |
| ITC tax credit | 30% in Year 0 |
| Financing | All equity |
| Project life | 25 years |

## Project Structure

    solar-dashboard-react/
    ├── src/
    │   ├── finance.js   — financial model (calcCashFlows, calcIRR, calcPayback)
    │   ├── App.jsx      — main React component
    │   ├── App.css      — all styles
    │   └── main.jsx     — React entry point

## Tech Stack

- React (via Vite)
- Vanilla CSS
- No external dependencies