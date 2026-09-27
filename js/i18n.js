// Sprachen: Englisch und Deutsch. Auswahl wird gespeichert, Standard folgt der Gerätesprache.
const I18N = (() => {
  const STRINGS = {
    en: {
      loading: 'Topping the pizza …',
      tagline: 'Slice precisely. Slice fast.',
      play: 'Play',
      howto: 'How to play',
      reset: 'Reset progress',
      resetConfirm: 'Really delete all progress?',
      sound: 'Sound on/off',
      back: 'Back',
      quit: 'Quit',
      levels: 'Levels',
      level: 'Level',
      slices: '{n} slices',
      cutOf: 'Cut {a}/{b}',
      accuracy: 'Accuracy',
      score: 'Score',
      timeBonus: '+{n} time bonus',
      retry: 'Retry',
      next: 'Next ›',
      timerWait: 'tap to start',
      // Ergebnis-Titel
      resPerfect: 'Perfetto!',
      resGreat: 'Bravo!',
      resOk: 'Nice cut!',
      resBad: 'Too uneven!',
      resTimeout: "Time's up!",
      // Ablehnungen
      rejMissed: 'Missed the pizza!',
      rejShort: 'Swipe all the way across!',
      rejEdge: 'Too close to the edge – aim for the center!',
      rejDup: 'Already cut there!',
      // Hinweise pro Level
      hintL1a: 'Swipe once straight across the pizza, right through the center. The timer starts when you touch the screen.',
      hintL2a: 'Cut 1 of 2: any direction you like, but through the center.',
      hintL2b: 'Cut 2: follow the dashed guide line. It shows where to cut for four equal quarters.',
      hintL3a: 'No guide lines this time. Picture a cross: the second cut goes at a right angle to the first.',
      hintL4a: 'From now on, you decide the angles. For {n} slices you need {c} cuts, evenly spread like spokes of a wheel.',
      hintRotate: 'The pizza is spinning! A cut counts where the pizza is at the moment you swipe.',
      hintDrift: 'The pizza is drifting. Keep an eye on the center and swipe when it lines up.',
      hintSmall: 'A smaller pizza needs a steadier hand. Swipe a bit slower.',
      // Feedback nach einem Schnitt
      fbCenterPerfect: 'Bullseye! Right through the center.',
      fbCenterGood: 'Good, almost centered.',
      fbCenterOff: 'Off center by {p}%. Aim for the middle.',
      fbAnglePerfect: 'Perfect angle!',
      fbAngleGood: 'Angle {d}° off, close!',
      fbAngleOff: 'Angle {d}° off. Spread the cuts evenly.',
      // Tipps im Ergebnis
      tipCenter: 'Tip: the closer your cut runs through the center, the more equal the pieces.',
      tipAngle: 'Tip: for {n} slices the cuts must be exactly {a}° apart.',
      tipGreat: 'Great precision! Keep the cuts through the center and evenly spread.',
      tipTimeout: 'Tip: you need {c} cuts. Make them quick, one smooth swipe each.',
      tipIncomplete: 'You made {a} of {c} cuts. Swipe faster next time!',
      // Hilfe-Bildschirm
      helpTitle: 'How to play',
      help1t: 'Swipe across the pizza',
      help1d: 'One swipe is one straight cut. Go all the way across and through the center.',
      help2t: 'Make equal pieces',
      help2d: 'Each level asks for a number of equal slices. Spread your cuts evenly like the spokes of a wheel.',
      help3t: 'Beat the clock',
      help3d: 'Finish all cuts before the bar runs out. Remaining time gives bonus points.',
      help4t: 'Earn stars',
      help4d: '★ from 75 % accuracy, ★★ from 90 %, ★★★ from 97 %. One star unlocks the next level.',
      helpClose: 'Got it!',
      langName: 'English',
    },
    de: {
      loading: 'Pizza wird belegt …',
      tagline: 'Schneide exakt. Schneide schnell.',
      play: 'Spielen',
      howto: 'So geht’s',
      reset: 'Fortschritt zurücksetzen',
      resetConfirm: 'Gesamten Fortschritt wirklich löschen?',
      sound: 'Ton an/aus',
      back: 'Zurück',
      quit: 'Abbrechen',
      levels: 'Level',
      level: 'Level',
      slices: '{n} Stücke',
      cutOf: 'Schnitt {a}/{b}',
      accuracy: 'Genauigkeit',
      score: 'Punkte',
      timeBonus: '+{n} Zeitbonus',
      retry: 'Nochmal',
      next: 'Weiter ›',
      timerWait: 'Tippe zum Start',
      resPerfect: 'Perfetto!',
      resGreat: 'Bravo!',
      resOk: 'Geschafft!',
      resBad: 'Zu ungleich!',
      resTimeout: 'Zeit abgelaufen!',
      rejMissed: 'Die Pizza verfehlt!',
      rejShort: 'Ganz durchziehen!',
      rejEdge: 'Zu weit am Rand – ziele auf die Mitte!',
      rejDup: 'Da ist schon ein Schnitt!',
      hintL1a: 'Wische einmal gerade über die Pizza, genau durch die Mitte. Die Zeit läuft erst, wenn du den Bildschirm berührst.',
      hintL2a: 'Schnitt 1 von 2: Richtung egal, aber durch die Mitte.',
      hintL2b: 'Schnitt 2: Folge der gestrichelten Hilfslinie. Sie zeigt, wo du für vier gleiche Viertel schneiden musst.',
      hintL3a: 'Diesmal ohne Hilfslinien. Stell dir ein Kreuz vor: Der zweite Schnitt geht im rechten Winkel zum ersten.',
      hintL4a: 'Ab jetzt bestimmst du die Winkel. Für {n} Stücke brauchst du {c} Schnitte, gleichmäßig verteilt wie Speichen eines Rads.',
      hintRotate: 'Die Pizza dreht sich! Ein Schnitt zählt so, wie die Pizza im Moment des Wischens liegt.',
      hintDrift: 'Die Pizza schwebt. Behalte die Mitte im Blick und wische, wenn sie passt.',
      hintSmall: 'Eine kleinere Pizza braucht eine ruhigere Hand. Wische etwas langsamer.',
      fbCenterPerfect: 'Volltreffer! Genau durch die Mitte.',
      fbCenterGood: 'Gut, fast mittig.',
      fbCenterOff: '{p} % neben der Mitte. Ziele auf den Mittelpunkt.',
      fbAnglePerfect: 'Perfekter Winkel!',
      fbAngleGood: 'Winkel {d}° daneben, knapp!',
      fbAngleOff: 'Winkel {d}° daneben. Verteile die Schnitte gleichmäßig.',
      tipCenter: 'Tipp: Je genauer dein Schnitt durch die Mitte geht, desto gleicher werden die Stücke.',
      tipAngle: 'Tipp: Für {n} Stücke müssen die Schnitte genau {a}° auseinander liegen.',
      tipGreat: 'Tolle Präzision! Weiter so: durch die Mitte und gleichmäßig verteilt.',
      tipTimeout: 'Tipp: Du brauchst {c} Schnitte. Mach sie zügig, je ein flüssiger Wisch.',
      tipIncomplete: 'Du hast {a} von {c} Schnitten geschafft. Nächstes Mal schneller wischen!',
      helpTitle: 'So geht’s',
      help1t: 'Über die Pizza wischen',
      help1d: 'Ein Wisch ist ein gerader Schnitt. Zieh ganz durch und genau durch die Mitte.',
      help2t: 'Gleich große Stücke',
      help2d: 'Jedes Level verlangt eine Anzahl gleicher Stücke. Verteile deine Schnitte gleichmäßig wie Speichen eines Rads.',
      help3t: 'Gegen die Zeit',
      help3d: 'Schaffe alle Schnitte, bevor der Balken leer ist. Restzeit gibt Bonuspunkte.',
      help4t: 'Sterne sammeln',
      help4d: '★ ab 75 % Genauigkeit, ★★ ab 90 %, ★★★ ab 97 %. Ein Stern schaltet das nächste Level frei.',
      helpClose: 'Alles klar!',
      langName: 'Deutsch',
    },
  };

  let lang = 'en';
  try {
    const saved = localStorage.getItem('ps_lang');
    if (saved && STRINGS[saved]) lang = saved;
    else if ((navigator.language || '').toLowerCase().startsWith('de')) lang = 'de';
  } catch (e) {}

  function t(key, params) {
    let s = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
    if (params) for (const k in params) s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
    return s;
  }

  // Alle Elemente mit data-i18n / data-i18n-aria übersetzen
  function apply() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  }

  function set(l) {
    if (!STRINGS[l]) return;
    lang = l;
    try { localStorage.setItem('ps_lang', l); } catch (e) {}
    apply();
  }
  function toggle() { set(lang === 'de' ? 'en' : 'de'); return lang; }
  function get() { return lang; }
  function locale() { return lang === 'de' ? 'de-DE' : 'en-US'; }

  return { t, apply, set, toggle, get, locale };
})();
const t = I18N.t;
