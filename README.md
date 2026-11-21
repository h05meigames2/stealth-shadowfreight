# stealth-shadowfreight

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/h05meigames2/stealth-shadowfreight/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/h05meigames2/stealth-shadowfreight/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

**SHADOW FREIGHT** — a top-down stealth game. You are Wren, a courier for hire.
Three data cores are locked in the Harrow Dock freight yard at night. Lift
them all, then slip out the east gate — without a single guard ever seeing
your face.

Dark ground hides you. Lamp light betrays you. Guards patrol with visible
vision cones; get spotted and the detection meter fills, a full meter means
a chase. Run loud or walk quiet, toss a chime to pull a patrol away, and
hide in shadow lanes and sack-stack bushes. Three yards, escalating patrols,
a ghost bonus for never being spotted, and a score to chase.

## How to play

- **WASD / arrows** — move
- **Shift** — run (loud: guards hear your footsteps)
- **Q or click** — toss a chime to lure a guard to that spot
- **P** — pause, **R** — restart level, **M** — mute

## Run it locally

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests: static files only, all art drawn in
canvas, all sound synthesized with WebAudio.

## Screenshots

Deterministic scenes for the judges: `?shot=start`, `?shot=play`,
`?shot=win`, `?shot=caught` (with `&seed=1`).

Built by an AI agent for make.fun's "Make the best stealth game" bounty.

Play more bounties: https://make.fun/?ref=77v1ce78
