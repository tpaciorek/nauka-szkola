---
name: nowe-wyzwanie
description: Tworzenie nowych wyzwań/gier edukacyjnych w projekcie nauka-szkola (strona z ćwiczeniami dla dzieci). Użyj, gdy użytkownik prosi o nową grę, quiz, ćwiczenie, słówka, dyktando, test albo nową klasę/przedmiot – np. „zrób wyzwanie z miesięcy”, „dodaj słówka z kolorów dla 3a”, „nowa gra z matmy”.
---

# Nowe wyzwanie edukacyjne

Projekt to statyczna strona (czyste HTML/CSS/JS, bez builda), otwierana głównie **na telefonie** przez dziecko. Rodzic pisze po polsku, często skrótowo – domyślaj się rozsądnie i nie zasypuj pytaniami.

## Kto z tego korzysta

- Córka użytkownika w roku szkolnym 2026/27 chodzi do **klasy 3a** (wcześniej 2a – stare materiały zostają).
- Dziecko ma ok. 8–9 lat: krótkie polecenia, duże przyciski, dużo pochwał, zero kar.
- Cały interfejs po polsku. Słówka obce czytane przez `speechSynthesis` (en-GB).

## Struktura katalogów

```
index.html                  ← wybór klasy (karta na każdą klasę, najnowsza klasa pierwsza)
portal.css                  ← wspólny styl WSZYSTKICH stron-menu
<klasa>/index.html          ← wybór przedmiotu (np. 3a/index.html)
<klasa>/<przedmiot>/index.html   ← lista wyzwań (karty portal-link-card)
<klasa>/<przedmiot>/<wyzwanie>.html  ← samodzielna gra, jeden plik
```

Przedmioty: `angielski`, `polski`, `matematyka`, `przyroda`. Nazwy plików: małe litery, myślniki, bez polskich znaków (`dni-tygodnia.html`, `miesiace.html`).

**Przyroda – wzór `3a/przyroda/warstwy-lasu.html`** (ta sama Sówka, mapa i gwiazdki, ale zadania na prawdziwych zdjęciach: zdjęcie → wybór warstwy, zdania z luką, „znajdź wszystkie” w siatce zdjęć, wybór wielokrotny, gry zręcznościowe „spadające znaleziska” i „koszyk”, leśny album). Użytkownik chce, żeby przyroda była „ładna, ze zdjęciami”. Zdjęcia: Wikimedia Commons (główne zdjęcie artykułu z pl.wikipedia przez `prop=pageimages` albo wyszukiwanie w Commons), pobierane `curl` z User-Agentem, zmniejszane do 480 px JPEG (PowerShell `System.Drawing`), w `<klasa>/przyroda/zdjecia/` z `ZRODLA.md`; autor i licencja w obiekcie `CREDITS` – podpis pod każdym zdjęciem i ekran „Skąd są zdjęcia?”. Treść z podręcznika parafrazuj, nie przepisuj.

## Dodając wyzwanie, zawsze zaktualizuj menu

1. Plik gry w `<klasa>/<przedmiot>/`.
2. Karta w `<klasa>/<przedmiot>/index.html` – wzór poniżej (badge z kategorią i datą dodania, data w formacie DD.MM.RRRR = dzisiejsza).
3. Jeśli klasa/przedmiot jest nowy: utwórz ich `index.html` (skopiuj z `3a/`) i dodaj kartę wyżej (`<klasa>/index.html`, a dla nowej klasy – główny `index.html`). Popraw też opisy kart wyżej, jeśli wymieniają zawartość.

```html
<a class="portal-link-card" href="./NAZWA.html">
  <span class="portal-icon" aria-hidden="true">🦉</span>
  <div class="portal-card-header">
    <span class="portal-card-badge portal-card-badge--new">✨ Kategoria: słówka • dodano DD.MM.RRRR</span>
    <h2 class="portal-card-title">Tytuł — podtytuł</h2>
  </div>
  <p class="portal-card-text">Jedno-dwa zdania: czego się dziecko nauczy.</p>
  <span class="portal-card-date">Kategoria: słówka • data dodania: DD.MM.RRRR</span>
  <span class="portal-card-cta">Zagraj →</span>
</a>
```

Warianty badge: `--new` (zielony, nowe), `--practice` (niebieski, ćwiczenie/sprawdzian), `--reading` (różowy, lektura). Gdy dodajesz nowe wyzwanie, starsze karty zmieniają `--new` na `--practice`.

## Silnik gry słówkowej (Sówka Lulu) – używaj go ponownie

Wzorcowa gra: `3a/angielski/dni-tygodnia.html`. **Dla każdych nowych słówek (miesiące, kolory, liczby, zwierzęta, słówka z polskiego itp.) skopiuj ten plik i zmień TYLKO obiekt `CONFIG` na górze skryptu.** Silnik (poniżej komentarza „SILNIK GRY”) zostaw bez zmian; jeśli go ulepszasz, przenieś poprawkę do wszystkich kopii.

Co ustawić w `CONFIG`:

- `storageKey` – unikalny, np. `nauka-3a-angielski-miesiace-v1` (inaczej gry nadpiszą sobie postępy).
- `title`, `intro` (powitanie Sówki, mówi co i po co się uczymy).
- `ordered` – `true` tylko gdy słówka mają naturalną kolejność (dni, miesiące, liczby). Włącza poziom „pociąg” i pytania o następny/poprzedni. Dla kolorów/zwierząt: `false`.
- `order` – teksty dla trybu kolejności (nazwa poziomu, pytania, `promptHTML`/`writePromptHTML`). Przy miesiącach np. „This month is … Next month is …”.
- `capitalNote` – przypomnienie o wielkiej literze (albo pusty tekst, gdy słowa piszemy małą literą – wtedy popraw treść; gra i tak akceptuje małe litery).
- `items` – 5–10 słówek, każde: `en` (odpowiedź), `pl`, `emoji`, `parts` (sylaby/kawałki do kolorowania), `say` (wymowa zapisana po polsku), `tricky` (indeksy trudnych liter do ukrycia, bez indeksu 0), `tip` (skojarzenie po polsku – śmieszne, obrazowe, to najważniejsza pomoc w zapamiętaniu).

Przy słówkach **polskich** (np. ortografia) pole `en` to wyraz docelowy, a `pl` – podpowiedź/obrazek; ustaw `lang` głosu w `say()` na `pl-PL` i dodaj polskie litery do klawiatury (`ą ć ę ł ń ó ś ź ż`) w `keyboardHTML()`.

### Progresja (nie zmieniaj bez powodu – działa)

Od rozpoznawania do samodzielnego pisania, **przeplatane grami zręcznościowymi 🎮** (użytkownik wyraźnie chce, żeby nie było samego klikania i wybierania – gry zręcznościowe muszą być w trakcie, nie tylko na końcu):

1. **Poznaj słówka** – karty ze słowem, wymową 🔊/🐢 i skojarzeniem.
2. **Co to znaczy?** – wybór z 4 (PL→EN i EN→PL).
3. 🎮 **Łap słówka** – Sówka z koszykiem (palec w lewo/prawo) łapie spadające słowo pasujące do polskiego.
4. **Pociąg** – kolejność (tylko gdy `ordered`).
5. 🎮 **Balonowe słuchanie** – słyszy słowo, przebija właściwy balon, zanim odleci.
6. **Literkowe klocki** – ułóż słowo z rozsypanych liter.
7. 🎮 **Lot Sówki** – palcem w górę/dół, wlatuje w literki po kolei i układa słowo (pisanie w ruchu).
8. **Dziurawe słowa** – wpisz brakujące trudne litery.
9. **Napisz sam** – całe słowo z pamięci.
10. **Dyktando** – ze słuchu.
11. **Wielki sprawdzian** – mieszanka pisania.

Gry zręcznościowe (`arcade: true` w `LEVELS`): 3 serduszka, po ich utracie „Jeszcze raz”, ekran startowy z instrukcją, sterowanie palcem (`pointermove`, `touch-action: none`) i strzałkami na komputerze, pętla `requestAnimationFrame` przez `gameLoop()`. Zawsze ćwiczą te same słówka – zręczność ma służyć nauce, nie zastępować jej. Nowe gry dodawaj do `RENDER` przez `Object.assign(RENDER, {...})` i wplataj między poziomy nauki.

Mechanika: poziom odblokowuje się po zdobyciu ≥1 gwiazdki w poprzednim; gwiazdki wg odsetka błędów (≤10% → 3, ≤30% → 2); błędne słówko wraca na koniec poziomu; po 2 błędach w pisaniu gra pokazuje słowo i każe je **przepisać**; „mastery” 0–5 na słówko (tylko za pisanie) steruje losowaniem – słabsze słówka wypadają częściej; „Szybka powtórka” po odblokowaniu pisania; seria dni 🔥; nagrody dla sowy (okulary, szalik, czapka, korona) za sumę gwiazdek. Postęp w `localStorage`.

## Silnik gry matematycznej – `3a/matematyka/tabliczka-mnozenia.html`

Ta sama Sówka, mapa, gwiazdki, nagrody i gry zręcznościowe, ale z **klawiaturą liczbową** i „faktami” zamiast słówek (`{t, k}` = t × k; 3 × 7 i 7 × 3 to ten sam fakt `fk()`, mastery 0–5 na fakt). Poziomy w `LEVELS` mają `tables` (które tabliczki), typy: `intro` (grupy przedmiotów), `practice` (karta z tabliczką i sztuczką z `TIPS` → wybór → rytm „licz co t” → wpisz wynik → brakujący czynnik), gry `catch`/`balloons`/`fly` (liczby zamiast słów), `minute` (60 s na czas, gwiazdki za wynik, rekord w `state.best`), `boss`. Na mapie siatka 10×10 „Moja tabliczka” pokolorowana wg mastery.

Nowe wyzwania matematyczne (dzielenie, dodawanie z przekroczeniem progu itp.) rób na kopii tego pliku: zmień `LEVELS`, generowanie zadań w `buildTasks`, `facts()`/`distractors()` i podpowiedzi. Błędny wynik → podpowiedź „licz co t” + sztuczka; drugi błąd → pokazuje wynik i każe go wpisać.

Kopie silnika: `3a/matematyka/dzielenie.html` (fakt `{t, k}` = (t·k) : t = k, klucz mastery `"dzielna:dzielnik"`, wprowadzenie „dzielimy po równo na talerze”) oraz prostsze `3a/matematyka/losowanie.html` (wybór działania × / : / oba, zakresu 20/30/50/100 i „z okienkiem”, zawsze 10 losowych zadań, bez mapy).

## Odznaki klasy 3a – `3a/osiagniecia.js` + `3a/osiagniecia.html`

Wspólne dla wszystkich gier z 3a. Użytkownik chce odznak **tylko za maksymalny wynik** (nie za dni z rzędu ani sumy gwiazdek): jedna odznaka za 3 ⭐ w każdym poziomie, w losowaniu za 10/10 dla danego działania i zakresu, plus odznaka mistrza gry za komplet. Liczone z postępów gier w localStorage (`stars`, `perfectKeys`); strona `3a/osiagniecia.html` (karta „Moje odznaki” w `3a/index.html`) pokazuje je pogrupowane według gier, z gwiazdkami przy każdym poziomie. Każda nowa gra w 3a:

1. `<script src="../osiagniecia.js"></script>` przed głównym skryptem.
2. W pasku górnym pigułka `<a class="pill" href="../osiagniecia.html" title="Moje odznaki" aria-label="Moje odznaki">🏅</a>`.
3. W `finishLevel()` po `save()`: `if (window.Odznaki) Odznaki.sprawdz();` – pokazuje dymek „Nowa odznaka!”.
4. W `osiagniecia.js` dopisz grę do `GRY`: `key` (storageKey), `href`, `mistrz` i `poziomy: [[id, ikona, nazwa], …]` – te same id co w `LEVELS` gry.

## Wymowa – nagrania lektora, nie syntezator

Użytkownik uznał głos syntezatora (`speechSynthesis`) za słaby („jakby po polsku czytał angielskie słowa”). Dlatego:

- Słówka czyta **nagranie mp3** z `audio/<język>/<słowo małymi literami>.mp3` (wspólny katalog w głównym folderze – ponownie używaj istniejących plików). W grze ustaw `CONFIG.audioDir` (np. `'../../audio/en/'`) i `CONFIG.audioCredit`.
- Źródło nagrań: Wikimedia Commons, pliki `En-uk-<Słowo>.ogg` (brytyjskie, zwykle Shtooka / Judith Franck, CC BY 3.0), a gdy brak – `En-us-<Słowo>.ogg`. Pobieraj wersję mp3 (transkodowaną) przez API:
  `https://commons.wikimedia.org/w/api.php?action=query&titles=File:En-uk-Monday.ogg&prop=imageinfo|videoinfo&iiprop=url|extmetadata&viprop=derivatives&format=json` → pole `derivatives` z typem `audio/mpeg`.
  Używaj `curl` (Python ma tu problem z certyfikatami), z nagłówkiem User-Agent i przerwą kilku sekund między plikami (inaczej Wikimedia zwraca stronę błędu zamiast mp3 – sprawdzaj `file *.mp3`).
- Autora i licencję dopisz do `audio/<język>/ZRODLA.md` i podpisu `audioCredit` (CC BY wymaga podania autora).
- Syntezator jest tylko awaryjny i wybiera wyłącznie angielski głos (preferuje Google/Natural/Siri); gdy go brak – milczy, zamiast czytać polskim głosem.
- Dla polskich słówek: nagrania `Pl-<słowo>.ogg` z Commons albo głos `pl-PL`.

## Publikacja – GitHub Pages

Strona działa pod adresem **https://tpaciorek.github.io/nauka-szkola/** (repo `tpaciorek/nauka-szkola`, gałąź `main`). Rodzic wysyła dziecku link – więc:

- Tylko ścieżki **względne** (`./`, `../`), nigdy `/coś` od korzenia domeny ani `file://`.
- GitHub Pages rozróżnia wielkość liter – nazwy plików i odwołania zawsze małymi literami.
- Żadnych plików/folderów zaczynających się od `_` (Jekyll je pomija). Żadnego backendu – wszystko statyczne.
- Nowe pliki są widoczne dopiero po commicie i `git push`; po skończonej i przetestowanej pracy commituj i pushuj (użytkownik tego oczekuje) i podaj bezpośredni link do nowego wyzwania.

## Zasady dla każdego nowego wyzwania (także innego typu niż słówka)

- **Najpierw opowiedz, potem wymagaj** (wyraźna prośba użytkownika, stały format): przed poziomami z nową wiedzą ekran „📖 Przypomnij sobie” – krótka teoria dla dziecka (zdjęcia/obrazki, kolorowe sekcje, „Sztuczka Sówki” na końcu), przyciski „🔊 Przeczytaj mi” i „Rozumiem – zaczynamy! →”. W trakcie poziomu przycisk 📖 w górnym pasku otwiera tę teorię w okienku. Nie wszędzie: gry zręcznościowe i wielki sprawdzian bez teorii, „Jeszcze raz” po wyniku pomija teorię. Wzór: `THEORY`, `renderTheory()`, `openTheory()` w `3a/przyroda/warstwy-lasu.html`.
- **Czytanie na głos po polsku** (prośba użytkownika „mogłoby coś czytać”): `speak()`/`plain()`/`autoSay()` z `warstwy-lasu.html` – głos `pl-PL` przeglądarki (preferuje Google/Natural/Online, potem Paulina/Zofia), przycisk 🔊 obok dymku Sówki i w karcie pytania (czyta pytanie z odpowiedziami), 🗣️ w pasku włącza/wyłącza automatyczne czytanie (domyślnie włączone: teoria, pytanie, podpowiedź po błędzie). `plain()` usuwa emoji, litery A–D, podpisy zdjęć i elementy `.no-read`. Przy wejściu na mapę `stopSpeak()`.

- **Mobile-first**: działa na 360 px szerokości, przyciski ≥ 48 px, `touch-action: manipulation`, `viewport-fit=cover` + `env(safe-area-inset-*)`. Na komputerze też grywalne (fizyczna klawiatura).
- **Pisanie na telefonie**: własna klawiatura ekranowa zamiast `<input>` (brak autokorekty, klawiatura systemowa nie zasłania ekranu). Wielka litera na start.
- **Jeden samodzielny plik HTML**; bez Tailwinda i frameworków. Czcionka Nunito z Google Fonts. Brak zewnętrznych skryptów poza tym.
- Postać-przewodnik (Sówka Lulu 🦉, SVG w `owlSVG()`) komentuje każdy krok w dymku; przy błędzie podpowiada, nigdy nie gani.
- Nagradzaj: dźwięki WebAudio, konfetti, gwiazdki, postęp widoczny na mapie.
- Link „← Wróć” do `./index.html` działu.
- Teksty dla dziecka krótkie, na „Ty”, z emoji.
- Ikony przedmiotów w menu: matematyka 🧮 (nie ✖️ – wygląda jak „źle”), angielski – obrazek `img/flaga-gb.svg` (`<img class="flag" …>`, w karcie `flag flag-big`). **Nie używaj emoji flag** – Windows pokazuje je jako litery „GB”. 🔤 zostaje wolne dla polskiego.

## Sprawdzenie przed oddaniem

1. Uruchom podgląd przez serwer HTTP (`.claude/launch.json` → konfiguracja `strona`, `python -m http.server 8765`) – nie przez `file://`.
2. Ustaw widok `mobile` (375×812), przejdź mapę, po jednym zadaniu z każdego typu (poziomy odblokujesz w konsoli: `state.stars = {...}; startLevel(n)`), błędną i dobrą odpowiedź, ekran wyniku.
3. Sprawdź konsolę (brak błędów), potem `localStorage.clear()`, żeby nie zostawić testowych postępów.
4. Sprawdź, że linki w menu prowadzą do nowego pliku.
5. Commit + push, potem podaj link.
