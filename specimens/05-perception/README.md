# 05 · Browser perception

> Can the assistant not perform the action, or can it not perceive the target through this interface?

Status: simulated in the lab on synthetic data; upstream not executed. Claims below are unverified research leads.

## Anchor

[microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)

Exposes structured accessibility snapshots with element references for browser interaction.

## Diversion

- [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp): Compare the structured snapshot with screenshots and visible page content.

## Where it bends

Release notes include fixes around snapshot content: the representation itself has edges.

## Lab experiment

A synthetic page with a labelled button, an unlabelled visual twin, a canvas and a control that changes after inspection.

## Evidence record

| Field | Value |
| --- | --- |
| Pinned upstream revision | not pinned |
| Documented behaviour checked against source | partly, README read 2026-11-21 (truncated); not pinned |
| Controlled mutation | perception mode (snapshot only, coordinates on); page re-renders after every click |
| Actual evidence | lab simulation only: `npm run lab -- click --target lever --perception vision` |
| What this does not prove | anything about how the upstream server behaves when run |

## Sources

- https://github.com/microsoft/playwright-mcp
- https://github.com/microsoft/playwright.dev/blob/main/mcp/snapshots.mdx
- https://github.com/microsoft/playwright-mcp/releases
