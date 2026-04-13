const app = document.getElementById('app');

const state = {
  gameState: 'start',
  questions: [],
  currentQuestionIndex: 0,
  currentInput: '',
};

const icons = {
  play: `
    <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="6,4 20,12 6,20 6,4"></polygon>
    </svg>
  `,
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
  x: `
    <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 6 6 18"></path>
      <path d="m6 6 12 12"></path>
    </svg>
  `,
  restart: `
    <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 2v6h6"></path>
      <path d="M3 8a9 9 0 1 0 3-5.9"></path>
    </svg>
  `,
};

function generateQuestions() {
  const newQuestions = [];

  for (let index = 0; index < 20; index += 1) {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;

    newQuestions.push({
      a,
      b,
      answer: a * b,
      userAnswer: null,
    });
  }

  return newQuestions;
}

function startGame() {
  state.questions = generateQuestions();
  state.currentQuestionIndex = 0;
  state.currentInput = '';
  state.gameState = 'playing';
  render();
}

function handleInput(char) {
  if (state.gameState !== 'playing' || state.currentInput.length >= 3) {
    return;
  }

  state.currentInput += char;
  render();
}

function handleDelete() {
  if (state.gameState !== 'playing' || !state.currentInput) {
    return;
  }

  state.currentInput = state.currentInput.slice(0, -1);
  render();
}

function handleSubmit() {
  if (state.gameState !== 'playing' || state.currentInput === '') {
    return;
  }

  state.questions[state.currentQuestionIndex].userAnswer = Number.parseInt(state.currentInput, 10);

  if (state.currentQuestionIndex < state.questions.length - 1) {
    state.currentQuestionIndex += 1;
    state.currentInput = '';
  } else {
    state.gameState = 'summary';
  }

  render();
}

function renderLoading() {
  app.innerHTML = `
    <div class="center-screen">Ładowanie...</div>
  `;
}

function renderStart() {
  app.innerHTML = `
    <section class="page">
      <div class="card start-screen">
        <div class="start-icon" aria-hidden="true">
          <span class="start-icon-symbol">✖️</span>
        </div>
        <h1 class="start-title">Tabliczka Mnożenia do 100</h1>
        <p class="start-description">
          Rozwiąż 20 losowych zadań z mnożenia do 100. Wynik poznasz na samym końcu.
          Możesz pisać na klawiaturze lub klikać na ekranie!
        </p>
        <button class="action-button" type="button" data-action="start">
          ${icons.play}
          <span>Rozpocznij Test</span>
        </button>
      </div>
    </section>
  `;
}

function renderQuiz() {
  const currentQuestion = state.questions[state.currentQuestionIndex];
  const progress = (state.currentQuestionIndex / state.questions.length) * 100;

  app.innerHTML = `
    <section class="page">
      <div class="card game">
        <div class="progress-track" aria-hidden="true">
          <div class="progress-bar" style="width: ${progress}%;"></div>
        </div>

        <div class="game-inner">
          <div class="topbar">
            <div class="badge">Zadanie ${state.currentQuestionIndex + 1} z ${state.questions.length}</div>
          </div>

          <div class="question-panel">
            <div class="operation" aria-label="Działanie">
              <span>${currentQuestion.a}</span>
              <span class="operation-separator">×</span>
              <span>${currentQuestion.b}</span>
              <span class="operation-separator">=</span>
              <div class="answer-box ${state.currentInput ? 'filled' : ''}">
                ${state.currentInput || '?'}
              </div>
            </div>
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
              data-action="submit"
              aria-label="Zatwierdź odpowiedź"
              ${state.currentInput ? '' : 'disabled'}
            >
              ${icons.check}
            </button>
          </div>

          <p class="hint">Możesz też używać klawiatury komputera (Enter = Zatwierdź)</p>
        </div>
      </div>
    </section>
  `;
}

function renderResults() {
  const correctAnswers = state.questions.filter((question) => question.answer === question.userAnswer).length;
  const percentage = Math.round((correctAnswers / state.questions.length) * 100);
  let feedbackMessage = '';

  if (percentage === 100) {
    feedbackMessage = 'Perfekcyjnie! Jesteś mistrzem!';
  } else if (percentage >= 80) {
    feedbackMessage = 'Świetna robota! Bardzo dobry wynik.';
  } else if (percentage >= 50) {
    feedbackMessage = 'Nieźle, ale warto jeszcze poćwiczyć.';
  } else {
    feedbackMessage = 'Musisz jeszcze trochę potrenować. Dasz radę!';
  }

  const results = state.questions
    .map((question, index) => {
      const isCorrect = question.answer === question.userAnswer;

      return `
        <article class="result-item ${isCorrect ? 'correct' : 'wrong'}">
          <div class="result-left">
            <span class="result-index">${index + 1}.</span>
            <span>${question.a} × ${question.b}</span>
          </div>
          <div class="result-right">
            <div class="answer-stack">
              <span class="answer-value ${isCorrect ? 'correct' : 'crossed'}">${question.userAnswer ?? 'Brak'}</span>
              ${!isCorrect ? `<span class="correct-answer">${question.answer}</span>` : ''}
            </div>
            <span class="result-state-icon ${isCorrect ? 'correct' : 'wrong'}" aria-hidden="true">
              ${isCorrect ? icons.check : icons.x}
            </span>
          </div>
        </article>
      `;
    })
    .join('');

  app.innerHTML = `
    <section class="page">
      <div class="card large">
        <header class="summary-hero results-header">
          <h1 class="results-title">Podsumowanie</h1>
          <div class="score">${correctAnswers} / ${state.questions.length}</div>
          <p class="results-subtitle">${feedbackMessage}</p>
        </header>

        <div class="summary-body">
          <h2 class="summary-heading">Twoje odpowiedzi:</h2>
          <div class="results-list">${results}</div>

          <div style="margin-top: 32px;">
            <button class="restart" type="button" data-action="restart">
              ${icons.restart}
              <span>Rozwiąż nowe zadania</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function render() {
  if (state.gameState === 'start') {
    renderStart();
    return;
  }

  if (!state.questions.length) {
    renderLoading();
    return;
  }

  if (state.gameState === 'summary') {
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

  if (action === 'start') {
    startGame();
  } else if (action === 'number') {
    handleInput(value);
  } else if (action === 'delete') {
    handleDelete();
  } else if (action === 'submit') {
    handleSubmit();
  } else if (action === 'restart') {
    startGame();
  }
});

window.addEventListener('keydown', (event) => {
  if (state.gameState !== 'playing') {
    return;
  }

  if (/^\d$/.test(event.key)) {
    event.preventDefault();
    handleInput(event.key);
  } else if (event.key === 'Backspace') {
    event.preventDefault();
    handleDelete();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    handleSubmit();
  }
});

render();