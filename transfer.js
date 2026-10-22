(function () {
  const params = new URLSearchParams(window.location.search);
  if (params.get('transfer') !== '1') return;

  const progress = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith('nauka-')) {
      progress[key] = localStorage.getItem(key);
    }
  }

  const count = Object.keys(progress).length;
  const overlay = document.createElement('div');
  overlay.className = 'transfer-overlay';
  overlay.innerHTML = `
    <section class="transfer-card" role="dialog" aria-modal="true" aria-labelledby="transfer-title">
      <div class="transfer-icon" aria-hidden="true">🔄</div>
      <p class="transfer-kicker">Przenoszenie postępu</p>
      <h1 id="transfer-title">Przenieś wyniki z Chrome</h1>
      <p class="transfer-message"></p>
      <button class="transfer-button" type="button">Przenieś do aplikacji</button>
      <a class="transfer-cancel" href="./">Anuluj</a>
    </section>
  `;

  const message = overlay.querySelector('.transfer-message');
  const button = overlay.querySelector('.transfer-button');

  if (count === 0) {
    message.textContent = 'W Chrome nie znaleziono jeszcze zapisanego postępu z ćwiczeń.';
    button.textContent = 'Wróć do strony';
    button.addEventListener('click', () => window.location.assign('./'));
  } else {
    message.textContent = `Znaleziono ${count} zapisanych elementów. Naciśnij przycisk, aby skopiować je do aplikacji.`;
    button.addEventListener('click', () => {
      const json = JSON.stringify(progress);
      const bytes = new TextEncoder().encode(json);
      let binary = '';

      for (let offset = 0; offset < bytes.length; offset += 8192) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
      }

      const payload = btoa(binary)
        .replaceAll('+', '-')
        .replaceAll('/', '_')
        .replace(/=+$/u, '');

      button.disabled = true;
      button.textContent = 'Otwieram aplikację…';
      window.location.href = `naukaszkola://import#${payload}`;
    });
  }

  document.body.appendChild(overlay);
  button.focus();
})();
