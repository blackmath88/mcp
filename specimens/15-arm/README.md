# 15 · A tool that moves something

Status: simulated. Rung 9 of the ladder, "a physical action". Tools `move_crate` and `read_sensor` (`src/domain/reach.ts`).

Nothing physical exists. The crane, its controller and its sensor are three made-up parts.

## What happens

`move_crate` sends a command to the controller, which accepts it. With something in the way, the arm stops and the crate hangs halfway. A server that trusts the controller still answers "Moved." A server that checks the sensor fails the call with where the crate really is. `read_sensor` tells you either way. No call takes a movement back.

## Evidence record

| Claim | Basis |
| --- | --- |
| "Moved." can be returned while the crate is halfway | observed: test in `src/domain/reach.test.ts` |
| A server that checks the sensor fails honestly | observed: test in `src/domain/reach.test.ts` |
| Nothing physical is controlled | by construction |
