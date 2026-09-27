// Pizza-Definitionen und Level-Daten für Pizza Slizer
// Alle Assets wurden mit OpenArt (Nano Banana 2) generiert, siehe tools/process_assets.py

const PIZZAS = {
  margherita: { name: 'Margherita',       file: 'assets/pizzas/margherita.webp', color: '#e8452c' },
  salami:     { name: 'Salami',           file: 'assets/pizzas/salami.webp',     color: '#c9302c' },
  funghi:     { name: 'Funghi',           file: 'assets/pizzas/funghi.webp',     color: '#a56b3c' },
  hawaii:     { name: 'Hawaii',           file: 'assets/pizzas/hawaii.webp',     color: '#f2b632' },
  formaggi:   { name: 'Quattro Formaggi', file: 'assets/pizzas/formaggi.webp',   color: '#f0c96a' },
  veggie:     { name: 'Verdura',          file: 'assets/pizzas/veggie.webp',     color: '#5aa843' },
  diavola:    { name: 'Diavola',          file: 'assets/pizzas/diavola.webp',    color: '#b3141c' },
  dolce:      { name: 'Dolce',            file: 'assets/pizzas/dolce.webp',      color: '#7a3e2a' },
};

// Level-Parameter:
//  pizza   – Schlüssel aus PIZZAS
//  slices  – gewünschte Anzahl gleich großer Stücke (gerade Zahl, => slices/2 Schnitte)
//  time    – Zeitlimit in Sekunden
//  guides  – Hilfslinien nach dem ersten Schnitt einblenden
//  rotate  – Drehgeschwindigkeit der Pizza in rad/s (0 = still)
//  drift   – Pizza schwebt hin und her (Amplitude in Vielfachen von 18 px)
//  scale   – relative Größe der Pizza (1 = normal)
const LEVELS = [
  // Welt 1 – Margherita: Grundlagen
  { pizza: 'margherita', slices: 2,  time: 10, guides: true },
  { pizza: 'margherita', slices: 4,  time: 12, guides: true },
  { pizza: 'margherita', slices: 4,  time: 9,  guides: false },

  // Welt 2 – Salami: mehr Stücke
  { pizza: 'salami', slices: 4,  time: 10, guides: true },
  { pizza: 'salami', slices: 6,  time: 14, guides: true },
  { pizza: 'salami', slices: 6,  time: 11, guides: false },

  // Welt 3 – Funghi: die Pizza dreht sich
  { pizza: 'funghi', slices: 6,  time: 13, guides: false, rotate: 0.18 },
  { pizza: 'funghi', slices: 8,  time: 16, guides: true,  rotate: 0.22 },
  { pizza: 'funghi', slices: 8,  time: 14, guides: false, rotate: 0.3 },

  // Welt 4 – Hawaii: kleine Pizzen
  { pizza: 'hawaii', slices: 4,  time: 8,  guides: false, scale: 0.72 },
  { pizza: 'hawaii', slices: 8,  time: 14, guides: false, scale: 0.8 },
  { pizza: 'hawaii', slices: 10, time: 18, guides: true,  scale: 0.85 },

  // Welt 5 – Quattro Formaggi: schwebende Pizza
  { pizza: 'formaggi', slices: 6,  time: 12, guides: false, drift: 1 },
  { pizza: 'formaggi', slices: 8,  time: 14, guides: false, drift: 1.2 },
  { pizza: 'formaggi', slices: 10, time: 18, guides: false, drift: 1.6 },

  // Welt 6 – Verdura: Drehung in beide Richtungen
  { pizza: 'veggie', slices: 8,  time: 12, guides: false, rotate: -0.35 },
  { pizza: 'veggie', slices: 10, time: 16, guides: false, rotate: 0.4, scale: 0.85 },
  { pizza: 'veggie', slices: 12, time: 20, guides: true,  rotate: 0.45 },

  // Welt 7 – Diavola: alles zusammen
  { pizza: 'diavola', slices: 8,  time: 10, guides: false, rotate: 0.5,  drift: 1 },
  { pizza: 'diavola', slices: 10, time: 14, guides: false, rotate: -0.6, scale: 0.8 },
  { pizza: 'diavola', slices: 12, time: 18, guides: false, rotate: 0.7,  drift: 1.5 },

  // Welt 8 – Dolce: Meisterklasse
  { pizza: 'dolce', slices: 6,  time: 8,  guides: false, scale: 0.7, rotate: 0.8 },
  { pizza: 'dolce', slices: 12, time: 16, guides: false, rotate: 0.9, drift: 2 },
  { pizza: 'dolce', slices: 16, time: 24, guides: false, rotate: 1.0, drift: 2, scale: 0.9 },
];

// Sterne-Schwellen (Genauigkeit 0..1)
const STAR_THRESHOLDS = { one: 0.75, two: 0.9, three: 0.97 };
