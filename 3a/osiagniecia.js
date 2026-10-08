/* =====================================================================
   ODZNAKI KLASY 3a – wspólne dla wszystkich gier.
   Odznakę dostaje się tylko za MAKSYMALNY wynik:
   • 3 ⭐ w danym poziomie gry (jedna odznaka na poziom),
   • 10/10 w losowaniu dla danego działania i zakresu,
   • odznaka mistrza gry – gdy wszystkie odznaki z tej gry są zdobyte.
   Odznaki liczone są z postępów zapisanych przez gry w localStorage.
   Gra po zapisaniu wyniku woła Odznaki.sprawdz() – nowe odznaki pokazują
   się w dymku u góry, a wszystkie na stronie 3a/osiagniecia.html.
   Nowa gra? Dopisz ją do GRY (klucz, poziomy: [id, ikona, nazwa]).
   ===================================================================== */
(function () {
  const GRY = [
    {
      id: 'T', grupa: '🧮 Tabliczka mnożenia', href: 'matematyka/tabliczka-mnozenia.html',
      key: 'nauka-3a-matematyka-tabliczka-v1', mistrz: ['🏆', 'Mistrzyni tabliczki'],
      poziomy: [['intro', '🍎', 'Co to jest mnożenie?'], ['t1-2-10', '×2', 'Razy 1, 2 i 10'], ['catch', '🧺', 'Łap wyniki'], ['t5', '×5', 'Razy 5'],
        ['t3', '×3', 'Razy 3'], ['balloons', '🎈', 'Balonowe wyniki'], ['t4', '×4', 'Razy 4'], ['t6', '×6', 'Razy 6'], ['fly', '🦉', 'Lot Sówki'],
        ['t7', '×7', 'Razy 7'], ['t8', '×8', 'Razy 8'], ['t9', '×9', 'Razy 9'], ['minute', '⏱️', 'Minutka'], ['boss', '👑', 'Wielki sprawdzian']]
    },
    {
      id: 'D', grupa: '🍪 Dzielenie', href: 'matematyka/dzielenie.html',
      key: 'nauka-3a-matematyka-dzielenie-v1', mistrz: ['🏆', 'Mistrzyni dzielenia'],
      poziomy: [['intro', '🍪', 'Co to jest dzielenie?'], ['d1-2-10', ':2', 'Przez 1, 2 i 10'], ['catch', '🧺', 'Łap wyniki'], ['d5', ':5', 'Przez 5'],
        ['d3', ':3', 'Przez 3'], ['balloons', '🎈', 'Balonowe wyniki'], ['d4', ':4', 'Przez 4'], ['d6', ':6', 'Przez 6'], ['fly', '🦉', 'Lot Sówki'],
        ['d7', ':7', 'Przez 7'], ['d8', ':8', 'Przez 8'], ['d9', ':9', 'Przez 9'], ['minute', '⏱️', 'Minutka'], ['boss', '👑', 'Wielki sprawdzian']]
    },
    {
      id: 'L', grupa: '🎲 Losowe zadania', href: 'matematyka/losowanie.html', losowanie: true,
      key: 'nauka-3a-matematyka-losowanie-v1', mistrz: ['🏆', 'Mistrzyni losowania'],
      poziomy: ['mul', 'div', 'mix'].flatMap(op => [20, 30, 50, 100].map(r => [`${op}-${r}`, String(r),
        `${op === 'mul' ? 'Mnożenie' : op === 'div' ? 'Dzielenie' : 'Mnożenie i dzielenie'} do ${r}`]))
    },
    {
      id: 'E', grupa: 'Angielski: Monday, Tuesday…', flaga: true, href: 'angielski/dni-tygodnia.html',
      key: 'nauka-3a-angielski-dni-tygodnia-v1', mistrz: ['🏆', 'Znam cały tydzień'],
      poziomy: [['learn', '📖', 'Poznaj słówka'], ['choose', '🎯', 'Co to znaczy?'], ['catch', '🧺', 'Łap słówka'], ['order', '🚂', 'Pociąg dni'],
        ['balloons', '🎈', 'Balonowe słuchanie'], ['tiles', '🧩', 'Literkowe klocki'], ['fly', '🦉', 'Lot Sówki'], ['gaps', '🕳️', 'Dziurawe słowa'],
        ['write', '✏️', 'Napisz sam'], ['dictation', '🎧', 'Dyktando Sówki'], ['boss', '👑', 'Wielki sprawdzian']]
    },
    {
      id: 'K', grupa: '💙 Karolcia', href: 'polski/karolcia.html',
      key: 'nauka-3a-polski-karolcia-v1', mistrz: ['🏆', 'Ekspertka od Karolci'],
      poziomy: [['l1', '📖', 'Kim jest Karolcia?'], ['l2', '🚕', 'Latająca taksówka'], ['l3', '🐱', 'Nowi sąsiedzi i gadający koralik'],
        ['l4', '🐔', 'Pierwsze niebezpieczne życzenia'], ['l5', '🧁', 'Ciastka bez końca'], ['l6', '👻', 'Niewidzialni w mieście'],
        ['l7', '🍪', 'Piernikowy domek Baby Jagi'], ['l8', '🦁', 'Kamienne lwy ożywają'], ['l9', '👑', 'Wizyta u Prezydenta Miasta'],
        ['l10', '💙', 'Pościg, ZOO i pożegnanie'], ['l11', '🏆', 'Wielki quiz o Karolci']]
    },
    {
      id: 'P', grupa: '🌳 Warstwy lasu', href: 'przyroda/warstwy-lasu.html',
      key: 'nauka-3a-przyroda-warstwy-lasu-v1', mistrz: ['🏆', 'Znawczyni lasu'],
      poziomy: [['learn', '🌳', 'Poznaj piętra lasu'], ['animals', '🐿️', 'Kto gdzie mieszka?'], ['drop', '🎮', 'Spadające znaleziska'],
        ['plants', '🫐', 'Co tu rośnie?'], ['light', '☀️', 'Światło w lesie'], ['catch', '🧺', 'Leśny koszyk'],
        ['pick', '🔍', 'Znajdź wszystkie'], ['gives', '🎁', 'Po co nam las?'], ['boss', '👑', 'Wielki sprawdzian']]
    }
  ];
  const SEEN_KEY = 'nauka-3a-odznaki-v2';
  const STRONA = document.currentScript ? new URL('osiagniecia.html', document.currentScript.src).href : null;

  function wczytaj(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; }
  }

  // lista wszystkich odznak z aktualnym stanem
  function stan() {
    const out = [];
    for (const g of GRY) {
      const s = wczytaj(g.key);
      const poz = g.poziomy.map(([id, icon, name]) => {
        // poziom: ile gwiazdek (0–3); losowanie: najlepszy wynik na 10
        const ile = g.losowanie ? Math.max(0, ...Object.entries(s.best || {}).filter(([k]) => k === id || k === id + '-o').map(([, v]) => v)) : ((s.stars || {})[id] || 0);
        const z = g.losowanie ? 10 : 3;
        const ma = g.losowanie ? !!(s.perfectKeys || {})[id] : ile >= 3;
        return { gra: g, id: `${g.id}-${id}`, icon, name, ile, z, ma, rodzaj: g.losowanie ? 'wynik' : 'gwiazdki',
          desc: g.losowanie ? '10 na 10 bez błędu' : '3 gwiazdki w poziomie' };
      });
      const ileMa = poz.filter(o => o.ma).length;
      out.push(...poz, { gra: g, id: `${g.id}-mistrz`, icon: g.mistrz[0], name: g.mistrz[1], ile: ileMa, z: poz.length,
        ma: ileMa === poz.length, rodzaj: 'mistrz', desc: 'Wszystkie odznaki z tej gry' });
    }
    return out;
  }

  function seen() { try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || []; } catch (e) { return []; } }

  function toast(nowe) {
    if (!document.getElementById('odz-style')) {
      const st = document.createElement('style');
      st.id = 'odz-style';
      st.textContent = `.odz-toast{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top));z-index:100;transform:translate(-50%,-140%);
        display:flex;align-items:center;gap:10px;max-width:min(92vw,420px);padding:10px 16px 10px 10px;border-radius:20px;
        background:#fef9c3;border:3px solid #facc15;box-shadow:0 10px 30px rgba(30,27,75,.25);text-decoration:none;color:#1e1b4b;
        font-family:Nunito,system-ui,sans-serif;transition:transform .45s cubic-bezier(.2,1.4,.4,1)}
        .odz-toast.on{transform:translate(-50%,0)}
        .odz-toast .i{flex:none;width:48px;height:48px;border-radius:50%;display:grid;place-items:center;font-size:1.6rem;font-weight:900;line-height:1;
        background:radial-gradient(circle at 35% 30%,#fff7cc,#fde047);box-shadow:0 3px 0 #ca8a04}
        .odz-toast b{display:block;font-size:.8rem;color:#a16207;text-transform:uppercase;letter-spacing:.04em}
        .odz-toast span{font-weight:900;font-size:1.05rem}`;
      document.head.appendChild(st);
    }
    const t = document.createElement(STRONA ? 'a' : 'div');
    t.className = 'odz-toast';
    if (STRONA) t.href = STRONA;
    const top = nowe.find(o => o.rodzaj === 'mistrz') || nowe[0];
    t.innerHTML = nowe.length === 1 || top.rodzaj === 'mistrz'
      ? `<span class="i">${top.icon}</span><span><b>🏅 Nowa odznaka!</b>${top.name}${top.rodzaj === 'mistrz' ? '' : ' ⭐⭐⭐'}</span>`
      : `<span class="i">🏅</span><span><b>Nowe odznaki: ${nowe.length}</b>Zobacz je wszystkie!</span>`;
    document.body.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('on')));
    setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.remove(), 600); }, 4200);
  }

  // pokazuje dymek z nowymi odznakami i zapamiętuje, że już je widziano
  function sprawdz(cicho) {
    try {
      const juz = seen();
      const nowe = stan().filter(o => o.ma && !juz.includes(o.id));
      if (!nowe.length) return [];
      localStorage.setItem(SEEN_KEY, JSON.stringify([...juz, ...nowe.map(o => o.id)]));
      if (!cicho) setTimeout(() => toast(nowe), 700);
      return nowe;
    } catch (e) { return []; }
  }

  window.Odznaki = { GRY, stan, sprawdz };
  // przy wejściu do gry pokaż odznaki zdobyte wcześniej, a jeszcze niepokazane
  if (!/osiagniecia\.html/.test(location.pathname)) window.addEventListener('load', () => sprawdz());
})();
