# 🍕 Pizza Slizer

A mobile game for the browser: slice the pizza into **perfectly equal pieces** before the clock runs out.

## Languages

The game is available in **English** and **German**. It follows the device language and can be switched with the 🌐 button on the title screen.

## Gameplay

- Swipe your finger across the pizza. Every swipe is one straight cut.
- Each level asks for an **exact number of equal-sized** slices (e.g. 8 slices = 4 cuts). The HUD always shows how many pieces you currently have.
- Cuts that pass close to the center snap onto it (within 10 % of the radius) so the piece count stays exact; the deviation still lowers your accuracy. Cuts that clearly miss the center create extra pieces, and as soon as you have more pieces than required the level ends.
- After the last cut, the real area of every piece is measured. The more even the pieces, the higher your **accuracy**.
- Stars: ★ from 75 %, ★★ from 90 %, ★★★ from 97 % accuracy. Remaining time adds a score bonus.
- Swipes that are too short, too close to the edge or duplicate an existing cut are rejected.

## Levels & pizzas

24 levels across 8 worlds, each world with its own pizza:

| World | Pizza | Twist |
|-------|-------|-------|
| 1 | Margherita | guided tutorial: demo swipe, center marker, cut feedback, timer starts on touch |
| 2 | Salami | more slices |
| 3 | Funghi | the pizza **spins** |
| 4 | Hawaii | small pizzas |
| 5 | Quattro Formaggi | the pizza **drifts** back and forth |
| 6 | Veggie | spinning in both directions |
| 7 | Diavola | spin + drift + less time |
| 8 | Dolce | master class, up to 16 slices |

Levels unlock one after another (at least 1 star). Progress is stored locally in the browser.

## Play online

The game is deployed with GitHub Pages on every push:
**https://marcelweissgerberit.github.io/PizzaSlizer/**

## Run it locally

There is no build step. Start any static web server:

```bash
python3 -m http.server 8080
# then open http://localhost:8080 in a browser, or on your phone in the same Wi-Fi
```

The app is installable as a PWA ("Add to Home Screen") and works offline thanks to the service worker.

## Assets

All artwork (8 pizzas, background, logo, pizza cutter) was generated with **OpenArt MCP** (model *Nano Banana 2*, text2image).
Source URLs and history IDs are listed in `tools/asset_sources.json`.

To re-process the raw images (background removal, circular crop, WebP, icons):

```bash
pip install pillow numpy scipy
python3 tools/process_assets.py
```

## Project structure

```
index.html          UI (title, level select, HUD, result)
css/style.css       styles (mobile-first, safe area, touch)
js/i18n.js          English/German strings
js/levels.js        pizza and level definitions
js/audio.js         synthesized sounds (WebAudio)
js/game.js          game engine: input, cut geometry, scoring, rendering
assets/pizzas/      cut-out pizzas (WebP, 720 px, perfectly circular)
assets/ui/          background, logo, cutter, app icons
tools/              asset pipeline
sw.js, manifest.json  PWA
```
