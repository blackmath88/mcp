# Open questions

- What can a visitor explain after inspecting the first before/after pair? Human feedback is still pending.
- Should the overflowing house-plus-Teams renderer adapt its layout, or explicitly offer a different view? This implementation records the edge without modifying Personas.
- Which next experiment best reveals MCP: screenshot-only comparison, a shared editable canvas, sampling, or dynamic tool discovery?
- How can field-level undo preserve an unrelated human edit? Whole-project compare-and-swap prevents clobbering but is not collaborative undo.
- Which deterministic constraints and human judgments transfer from PDF and Excel labs? The framework coordinates inquiry; it does not automatically know a new medium.
- What provider usage can Happier reliably expose? These runs supplied elapsed duration, not verified token or monetary totals.

Resolved for the first slice: local shared state is sufficient; no central memory ingestion or publication was enabled.
