# Space Fish

A vertical / dual-axis scrolling space shooter. You are a **space fish** — a koi-shaped starfighter — blasting through a neon nebula.

Play: **[https://dust2ash7.github.io/space-fish/](https://dust2ash7.github.io/space-fish/)**

Repo: **[https://github.com/dust2ash7/space-fish](https://github.com/dust2ash7/space-fish)**

## How to play

- **Move** with arrow keys or WASD. On a phone, drag the **Move** stick (or drag on the canvas).
- **Fire** with Space, click / tap, or hold the **Fire** button.
- Survive endless waves. Grunts dart, Spreaders fan shots, Tanks soak damage and punch back.
- Keep a **combo** by chaining kills. Power-ups drop from wrecks: **Rapid**, **Shield**, and **Bloom**.
- You have three lives. A shield absorbs one hit. High score is stored locally.

**P** pauses · **M** mutes · hiding the tab pauses the run.

## Features

- Distinctive koi starfighter (not a triangle ship) with engine wake and scale glow
- Three enemy types, player / enemy bullets, collisions, explosions
- Parallax stars and nebula scroll
- Score, lives, combo multiplier, localStorage high score
- Rapid-fire, shield, and bloom (spread) power-ups
- Start, pause, game over + retry
- Screen shake that respects `prefers-reduced-motion`
- Particles and Web Audio sound
- Keyboard and touch controls with labeled buttons
- PWA: `manifest.json` + service worker, `index.html` at repo root for GitHub Pages
- Responsive canvas, safe-area insets, mute, pause on tab hide

## Run locally

Open `index.html` from a static server (service worker needs HTTP):

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080/`.

## GitHub Pages

Enable Pages on this repo: **Settings → Pages → Deploy from branch `main` / root**. After that the game is at:

`https://dust2ash7.github.io/space-fish/`

Vanilla HTML, CSS, and canvas JavaScript. No backend, no build step, no paywall.
