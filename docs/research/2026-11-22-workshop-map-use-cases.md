# The workshop map against every use case — 2026-11-22

Owner liked prototype C ("the workshop") and asked for a richer version: MCP as the entrance, not the room, and the things tools reach drawn as neighbours outside. Then: "go through the use cases in the repo and think if this really makes sense."

Prototype: `docs/research/map-prototype/map-canvas.html` (open in a browser; tab "C+").

## The picture

- **Outside, left:** you and the AI app. The model stays there.
- **MCP is the front desk.** Its board is the `tools/list` answer: all the AI is shown. Under it, whatever else crosses the desk.
- **Behind the desk, the server's workshop:** nine slots where you would expect them. Shelf (Read, Write), workbench (Compute, Sequence, Invent), phone (Delegate), loading dock (Act), and near the desk the two slots that go back out (Ask, Share).
- **Neighbours outside the walls:** what the tools reach, named per server. Web pages, files and stored data above; another model and another program to the right; the world below.
- **A call is one line:** desk → slot → neighbour.

## Each use case

| Specimen | Fits? | What the map shows / what it needed |
| --- | --- | --- |
| 01 Fetch | yes | Read → web pages. The story is the robots.txt check, which sits **in the wall opening**: a gate. |
| 02 Memory | yes | Read/Write → `memory.jsonl`. Naming the neighbour per server carries the story (where the file lives). |
| 03 Thinking | yes, with builds | One board, three rooms: the same `plan_steps` lands on Sequence, Compute or Delegate depending on the build. The map must let a bend move the line while the board stays the same. |
| 04 Filesystem | needed a fix | Read → files through a gate (allowed folders). The client can move that gate by sending **roots in through the desk**: the desk is two-way. |
| 05 Perception | yes | Read and Write → the page, through a gate that sees 2 of 4 controls. |
| 06 CLI | building level | Not about slots. A generated CLI is a **photocopy of the board taken away**; it goes stale when the board changes. |
| 07 Local/remote | building level | Two visitors at one desk, one room behind it. The story is how many rooms there are. |
| 08 Apps | needed a fix | The app view is shown **by the AI app, to you**, outside the room. Share goes back out through the desk. |
| 09 Code mode | yes | The AI carries a program in through the desk; Invent on the bench runs it; many writes to the ledger. |
| 10 Delegation | yes | Delegate → another model. What goes down the phone line (the map or not) is the story. |
| 11 Iteration | yes | Sequence with a writer and a judge (another model), checkpoints as stored data. |
| 12 Network | building level | One desk, two servers behind it; their menus merged on one board, a shared name hides a tool. |
| 13 Inspector | yes, it is the point | The inspector reads the board and cannot see into the room. |
| 14 Ask | needed a fix | The question leaves **through the desk** (`elicitation/create`); the server has no other way to reach you. |
| 15 Arm | yes | Act → the world through the loading dock, with the sensor as the gate. |
| Your server | yes | A pasted list is only a board. The room is fogged: slots are guesses, neighbours unknown. |

## What changed in the picture because of this

1. **You stand with the AI app, not behind a window of the room.** In MCP a server cannot reach the person directly; questions (elicitation) and app views go back through the client. The first C had a "window to you" in the room wall; that was wrong.
2. **The desk is two-way.** Besides calls and results: roots come in, questions and app views go out, the board can change (`list_changed`). Shown as short amber lines under the board.
3. **Rules sit in the wall openings.** robots.txt, the folder boundary, the partial view of a page, the sensor. Drawn as amber gates where a tool line leaves the room.
4. **A slot can depend on the build.** Same board, different room (thinking, cart). The map gets a build switch.
5. **Some stories are about the building, not the room.** A copy of the board outside (CLI), two visitors in one room (local/remote), two rooms behind one desk (gateway), a dark room (a pasted list).
6. **Neighbours are named per server.** "the valley map", "memory.jsonl in the package cache", "the ledger, no undo", "expert (stand-in)".

## What still does not fit well

- **Compute and Sequence reach nothing outside.** That is accurate, but it makes the thinking-as-record build look empty. Acceptable: the empty room is the point.
- **A tool in two slots.** `reserve_cart` asks and then writes. The prototype shows Ask with a line to the cart list; the slot stays one.
- **The gateway** is drawn as one room calling another program. Two real rooms behind one desk would be truer, but busier.

## Status

Observed: the prototype renders all 16 servers without errors (one screenshot each of cart, files, gateway, your server, local/remote).
Proposed: replace the staircase map in the lab with this picture.
