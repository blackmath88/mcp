# 08 · The item becomes an application

> Which participant knows the current state?

Status: simulated in the lab on synthetic data, with scripted stand-ins where a model would be; upstream not executed. Claims below are unverified research leads.

## Anchor

[modelcontextprotocol/ext-apps](https://github.com/modelcontextprotocol/ext-apps) · `examples/map-server`

Interactive globe with geocoding; declares app resources and permitted external connections.

## Diversion

- [modelcontextprotocol/ext-apps](https://github.com/modelcontextprotocol/ext-apps): A later tool captures the current map view as a screenshot: human-visible state turned back into an artifact.

## Where it bends

The tool result, the displayed map and the model's information can all differ.

## Lab experiment

Let a person move the map, then compare the original tool result, the displayed map, a captured screenshot and what the model has.

## Evidence record

| Field | Value |
| --- | --- |
| Pinned upstream revision | not pinned |
| Documented behaviour checked against source | partly: README of the map-server example read on 2026-11-21 (source files not read). It lists server tools geocode and show-map and app tools navigate-to, get-current-view and get-screenshot; it does not describe how a view changed by the person reaches the model, and shows no resource URI. |
| Controlled mutation | app can be asked for its view, or cannot; the person drags the map |
| Actual evidence | lab simulation only: `npm run lab -- get_current_view --set app=off` |
| What this does not prove | anything about the upstream project, or about how a real model would behave |

## Sources

- https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/map-server
- https://github.com/modelcontextprotocol/ext-apps/releases
