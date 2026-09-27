# 🍕 Pizza Slizer

Ein Mobile-Game im Browser: Schneide die Pizza **so exakt wie möglich** in gleich große Stücke – bevor die Zeit abläuft.

## Spielprinzip

- Wische mit dem Finger quer über die Pizza. Jeder Wisch ist ein gerader Schnitt.
- Ziel jedes Levels: eine bestimmte Anzahl **gleich großer** Stücke (z. B. 8 Stücke = 4 Schnitte).
- Nach dem letzten Schnitt werden die tatsächlichen Flächen aller Stücke berechnet. Je gleichmäßiger, desto höher die **Genauigkeit**.
- Sterne: ★ ab 75 %, ★★ ab 90 %, ★★★ ab 97 % Genauigkeit. Restzeit gibt einen Punktebonus.
- Zu kurze Wische, Schnitte am Rand oder doppelte Schnitte werden abgelehnt.

## Level & Pizzen

24 Level in 8 Welten, jede Welt mit einer eigenen Pizza:

| Welt | Pizza | Besonderheit |
|------|-------|--------------|
| 1 | Margherita | Grundlagen, Hilfslinien |
| 2 | Salami | mehr Stücke |
| 3 | Funghi | die Pizza **dreht sich** |
| 4 | Hawaii | kleine Pizzen |
| 5 | Quattro Formaggi | die Pizza **schwebt** hin und her |
| 6 | Verdura | Drehung in beide Richtungen |
| 7 | Diavola | Drehung + Schweben + weniger Zeit |
| 8 | Dolce | Meisterklasse, bis 16 Stücke |

Level werden nacheinander freigeschaltet (mindestens 1 Stern). Fortschritt wird lokal im Browser gespeichert.

## Starten

Es gibt keinen Build-Schritt – einfach einen statischen Webserver starten:

```bash
python3 -m http.server 8080
# dann http://localhost:8080 im Browser bzw. am Handy im gleichen WLAN öffnen
```

Die App ist als PWA installierbar („Zum Startbildschirm hinzufügen“) und läuft dank Service Worker auch offline.

## Assets

Alle Grafiken (8 Pizzen, Hintergrund, Logo, Pizzaschneider) wurden mit **OpenArt MCP** (Modell *Nano Banana 2*, text2image) generiert.
Die Quell-URLs und History-IDs stehen in `tools/asset_sources.json`.

Zum Neuverarbeiten (Freistellen, Kreis-Zuschnitt, WebP, Icons):

```bash
pip install pillow numpy scipy
python3 tools/process_assets.py
```

## Projektstruktur

```
index.html          Oberfläche (Titel, Level-Auswahl, HUD, Ergebnis)
css/style.css       Styles (mobile-first, Safe-Area, Touch)
js/levels.js        Pizza- und Level-Definitionen
js/audio.js         Synthetisierte Sounds (WebAudio)
js/game.js          Spiel-Engine: Eingabe, Schnittgeometrie, Bewertung, Rendering
assets/pizzas/      Freigestellte Pizzen (WebP, 720 px, exakt kreisrund)
assets/ui/          Hintergrund, Logo, Schneider, App-Icons
tools/              Asset-Pipeline
sw.js, manifest.json  PWA
```
