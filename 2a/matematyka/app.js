const app = document.getElementById('app');

const state = {
  questions: [],
  currentIndex: 0,
  currentAnswer: '',
  isFinished: false,
  score: 0,
};

const icons = {
  delete: `
    <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18"></path>
      <path d="M8 6V4h8v2"></path>
      <path d="M6 6l1 14h10l1-14"></path>
      <path d="M10 10v6"></path>
      <path d="M14 10v6"></path>
    </svg>
  `,
  check: `
    <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 6 9 17l-5-5"></path>
    </svg>
  `,
  restart: `
    <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 2v6h6"></path>
      <path d="M3 8a9 9 0 1 0 3-5.9"></path>
    </svg>
  `,
  award: `
    <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="5"></circle>
      <path d="m8.5 13.5-2 8 5.5-3 5.5 3-2-8"></path>
    </svg>
  `,
};

function generateQuestions() {
  const newQuestions = [];
  const used = new Set();

  while (newQuestions.length < 10) {
    let a = Math.floor(Math.random() * 10) + 1;
    const maxB = Math.min(10, Math.floor(50 / a));
    let b = Math.floor(Math.random() * maxB) + 1;

    if (Math.random() > 0.5) {
      [a, b] = [b, a];
    }

    const key = `${a}x${b}`;
    if (used.has(key)) {
      continue;
    }

    used.add(key);
    newQuestions.push({ a, b, answer: a * b, userAnswer: '' });
  }

  return newQuestions;
}

function restartQuiz() {
  state.questions = generateQuestions();
  state.currentIndex = 0;
  state.currentAnswer = '';
  state.isFinished = false;
  state.score = 0;
  render();
}

function handleNumber(num) {
  if (state.isFinished || state.currentAnswer.length >= 3) {
    return;
  }

  state.currentAnswer += num;
  render();
}

function handleDelete() {
  if (state.isFinished || !state.currentAnswer) {
    return;
  }

  state.currentAnswer = state.currentAnswer.slice(0, -1);
  render();
}

function handleNext() {
  if (state.isFinished || !state.currentAnswer) {
    return;
  }

  state.questions[state.currentIndex].userAnswer = state.currentAnswer;

  if (state.currentIndex < state.questions.length - 1) {
    state.currentIndex += 1;
    state.currentAnswer = '';
  } else {
    state.score = state.questions.filter(
      (question) => Number(question.userAnswer) === question.answer,
    ).length;
    state.isFinished = true;
  }

  render();
}

function renderLoading() {
  app.innerHTML = `
    <div class="center-screen">Ładowanie...</div>
  `;
}

function renderQuiz() {
  const currentQuestion = state.questions[state.currentIndex];
  const progress = ((state.currentIndex + 1) / state.questions.length) * 100;

  app.innerHTML = `
    <section class="page">
      <div class="card">
        <header>
          <div class="topbar">
            <h1 class="title">Mnożenie do 50</h1>
            <div class="badge">Zadanie ${state.currentIndex + 1}/${state.questions.length}</div>
          </div>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-bar" style="width: ${progress}%;"></div>
          </div>
        </header>

        <div class="question-panel">
          <div class="operation" aria-label="Działanie">
            <span>${currentQuestion.a}</span>
            <span class="operation-separator">×</span>
            <span>${currentQuestion.b}</span>
            <span class="operation-separator">=</span>
          </div>

          <div class="answer-box ${state.currentAnswer ? 'filled' : ''}">
            ${state.currentAnswer || '?'}
          </div>

          <p class="hint">Wpisz odpowiedź klawiaturą ekranową lub z klawiatury.</p>
        </div>

        <div class="keypad" role="group" aria-label="Klawiatura numeryczna">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9]
            .map(
              (num) => `
                <button class="key" type="button" data-action="number" data-value="${num}">${num}</button>
              `,
            )
            .join('')}

          <button class="key icon delete" type="button" data-action="delete" aria-label="Usuń ostatnią cyfrę">
            ${icons.delete}
          </button>

          <button class="key" type="button" data-action="number" data-value="0">0</button>

          <button
            class="key icon primary"
            type="button"
            data-action="next"
            aria-label="Zatwierdź odpowiedź"
            ${state.currentAnswer ? '' : 'disabled'}
          >
            ${icons.check}
          </button>
        </div>
      </div>
    </section>
  `;
}

function renderResults() {
  const results = state.questions
    .map((question, index) => {
      const isCorrect = Number(question.userAnswer) === question.answer;

      return `
        <article class="result-item ${isCorrect ? 'correct' : 'wrong'}">
          <div class="result-left">
            <span class="result-index">${index + 1}.</span>
            <span>${question.a} × ${question.b} =</span>
          </div>
          <div class="result-right">
            <span class="${isCorrect ? '' : 'crossed'}">${question.userAnswer || 'Brak'}</span>
            ${
              isCorrect
                ? ''
                : `<span class="correct-answer">Poprawna: ${question.answer}</span>`
            }
          </div>
        </article>
      `;
    })
    .join('');

  app.innerHTML = `
    <section class="page">
      <div class="card">
        <header class="results-header">
          <div class="results-icon">${icons.award}</div>
          <h1 class="results-title">Koniec quizu!</h1>
          <p class="results-subtitle">Twój wynik to:</p>
          <div class="score">${state.score} / ${state.questions.length}</div>
        </header>

        <div class="results-list">${results}</div>

        <button class="restart" type="button" data-action="restart">
          ${icons.restart}
          <span>Zagraj ponownie</span>
        </button>
      </div>
    </section>
  `;
}

function render() {
  if (!state.questions.length) {
    renderLoading();
    return;
  }

  if (state.isFinished) {
    renderResults();
    return;
  }

  renderQuiz();
}

app.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');

  if (!button) {
    return;
  }

  const { action, value } = button.dataset;

  if (action === 'number') {
    handleNumber(value);
  } else if (action === 'delete') {
    handleDelete();
  } else if (action === 'next') {
    handleNext();
  } else if (action === 'restart') {
    restartQuiz();
  }
});

window.addEventListener('keydown', (event) => {
  if (state.isFinished) {
    return;
  }

  if (/^\d$/.test(event.key)) {
    event.preventDefault();
    handleNumber(event.key);
  } else if (event.key === 'Backspace') {
    event.preventDefault();
    handleDelete();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    handleNext();
  }
});

restartQuiz();