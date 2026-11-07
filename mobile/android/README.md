# Nauka w szkole — aplikacja Android

Lekka aplikacja WebView wyświetlająca stronę:

`https://tpaciorek.github.io/nauka-szkola/`

## Postęp ucznia

JavaScript i DOM Storage są włączone. Dane zapisywane przez ćwiczenia w `localStorage`
pozostają w pamięci aplikacji między uruchomieniami. Android może je też przenieść przy
odtwarzaniu kopii zapasowej. Wyczyszczenie danych aplikacji lub jej odinstalowanie usuwa
lokalny postęp.

Przy pierwszym uruchomieniu bez lokalnych wyników aplikacja proponuje jednorazowy import
postępu z Chrome. Strona przekazuje wyłącznie klucze `localStorage` zaczynające się od
`nauka-`, po świadomym naciśnięciu przycisku przez użytkownika.

## Czytanie na głos

WebView na Androidzie nie ma działającego `speechSynthesis`, więc gry same z siebie by milczały.
Aplikacja wstrzykuje na starcie każdej strony `app/src/main/assets/tts-polyfill.js`, który udaje
`speechSynthesis` i `SpeechSynthesisUtterance`, a tekst przekazuje do systemowego lektora Androida
(`TtsBridge.java`, obiekt `AndroidTTS`). Gry nie wymagają żadnych zmian. Lektor używa języka
z wypowiedzi (`pl-PL`, `en-GB`, `en-US`) i głośności multimediów. Jeśli w telefonie nie ma polskiego
głosu, trzeba go zainstalować w Ustawieniach → Zamiana tekstu na mowę (np. „Usługi rozpoznawania mowy Google”).

## Budowanie

W katalogu `mobile/android` uruchom:

```bash
gradle :app:assembleDebug
```

Plik APK powstanie w `app/build/outputs/apk/debug/app-debug.apk`. Repozytorium zawiera
również workflow GitHub Actions, który buduje gotowy do instalacji artefakt `nauka-szkola-apk`.
