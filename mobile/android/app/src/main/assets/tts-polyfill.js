/* Czytanie na głos w aplikacji Android.
   WebView na Androidzie nie ma speechSynthesis (Web Speech API), więc gry milczą.
   Ten skrypt (wstrzykiwany na starcie każdej strony) udaje speechSynthesis
   i SpeechSynthesisUtterance, a mówi przez systemowy lektor Androida
   (obiekt AndroidTTS z MainActivity). Gry nie wymagają żadnych zmian. */
(function () {
  // WebView czasem ma speechSynthesis, ale bez głosów i bez dźwięku – w aplikacji zawsze go zastępujemy
  if (!window.AndroidTTS || window.__androidTtsEvent) return;

  var voices = [], queue = [], current = null, seq = 0, byId = {};

  function fire(target, type, extra) {
    var e = { type: type, target: target, utterance: target, charIndex: 0, elapsedTime: 0, name: '' };
    if (extra) for (var k in extra) e[k] = extra[k];
    try { if (typeof target['on' + type] === 'function') target['on' + type](e); } catch (x) { setTimeout(function () { throw x; }); }
    var list = (target._l && target._l[type]) || [];
    list.slice().forEach(function (f) { try { f.call(target, e); } catch (x) { setTimeout(function () { throw x; }); } });
  }
  function listeners(obj) {
    obj.addEventListener = function (t, f) { (this._l[t] = this._l[t] || []).push(f); };
    obj.removeEventListener = function (t, f) { var a = this._l[t]; if (a) { var i = a.indexOf(f); if (i >= 0) a.splice(i, 1); } };
  }

  function Utterance(text) {
    this.text = text == null ? '' : String(text);
    this.lang = ''; this.voice = null; this.rate = 1; this.pitch = 1; this.volume = 1;
    this.onstart = this.onend = this.onerror = this.onboundary = this.onpause = this.onresume = this.onmark = null;
    this._l = {};
  }
  listeners(Utterance.prototype);

  var synth = {
    speaking: false, pending: false, paused: false, onvoiceschanged: null, _l: {},
    getVoices: function () { return voices.slice(); },
    speak: function (u) {
      if (!u) return;
      queue.push(u); synth.pending = true;
      if (!current) next();
    },
    cancel: function () {
      var waiting = queue, c = current;
      queue = []; current = null;
      synth.pending = false; synth.speaking = false; synth.paused = false;
      try { AndroidTTS.stop(); } catch (e) {}
      if (c) fire(c, 'error', { error: 'interrupted' });
      waiting.forEach(function (u) { fire(u, 'error', { error: 'canceled' }); });
    },
    pause: function () {},
    resume: function () {}
  };
  listeners(synth);

  function finish(u, ok) {
    if (u !== current) return;
    current = null; synth.speaking = false;
    if (ok) fire(u, 'end'); else fire(u, 'error', { error: 'synthesis-failed' });
    next();
  }
  function next() {
    if (current) return;
    var u = queue.shift();
    synth.pending = queue.length > 0;
    if (!u) { synth.speaking = false; return; }
    current = u; synth.speaking = true;
    var id = String(++seq);
    byId[id] = u;
    if (!/[\p{L}\p{N}]/u.test(u.text)) {   // pusty tekst – Android nic nie zgłosi
      setTimeout(function () { delete byId[id]; if (u === current) fire(u, 'start'); finish(u, true); }, 0);
      return;
    }
    var lang = (u.voice && u.voice.lang) || u.lang || document.documentElement.lang || 'pl-PL';
    var rate = +u.rate || 1, pitch = +u.pitch || 1, ok = false;
    try { ok = AndroidTTS.speak(id, u.text, lang, rate, pitch); } catch (e) {}
    if (!ok) setTimeout(function () { delete byId[id]; finish(u, false); }, 0);
  }

  // wywoływane z Javy: start / end / error dla wypowiedzi o danym id
  window.__androidTtsEvent = function (id, type) {
    var u = byId[id];
    if (!u) return;
    if (type === 'start') { if (u === current) fire(u, 'start'); return; }
    delete byId[id];
    finish(u, type === 'end');
  };
  // wywoływane z Javy, gdy lektor jest gotowy – lista języków, które umie
  window.__androidTtsVoices = function (list) {
    voices = (list || []).map(function (v) {
      return { name: v.name, lang: v.lang, voiceURI: v.name, localService: true, default: !!v.def };
    });
    fire(synth, 'voiceschanged');
  };

  // własne pola okna zasłaniają wbudowane (niemego) speechSynthesis WebView
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true, writable: true });
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: Utterance, configurable: true, writable: true });
  try { window.__androidTtsVoices(JSON.parse(AndroidTTS.voices())); } catch (e) {}
})();
