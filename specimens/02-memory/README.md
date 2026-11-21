# 02 · Memory

> What actually remembers, and what decides which stored statement is true?

Status: reference only; not built. Claims below are unverified research leads.

## Anchor

[modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) · `src/memory`

Reference server storing entities, observations and relations in a local knowledge graph. Its README warns the default storage location can sit in a package-managed directory.

## Diversion

- [shaneholloman/mcp-knowledge-graph](https://github.com/shaneholloman/mcp-knowledge-graph): Adds project/global database handling and a file marker against overwriting unrelated files.
- [okooo5km/memory-mcp-server](https://github.com/okooo5km/memory-mcp-server): Reimplements the graph-memory idea in Swift.
- [CheMiguel23/MemoryMesh](https://github.com/CheMiguel23/MemoryMesh): Applies the same graph concept to RPG worlds, organisations or reading notes.

## Where it bends

The interface promises memory, but persistence depends on where the file lives.

## Lab experiment

Store two facts about a fictional workshop. Restart the client, restart the server, change the storage path, then add a conflicting observation.

## Evidence record

| Field | Value |
| --- | --- |
| Pinned upstream revision | not pinned |
| Documented behaviour checked against source | no |
| Controlled mutation | not defined |
| Actual evidence | none |
| What this does not prove | not applicable yet |

## Sources

- https://github.com/modelcontextprotocol/servers/tree/main/src/memory
- https://github.com/shaneholloman/mcp-knowledge-graph
- https://github.com/okooo5km/memory-mcp-server
- https://github.com/CheMiguel23/MemoryMesh
