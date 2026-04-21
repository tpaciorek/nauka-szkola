const app = document.getElementById('app');

const QUESTION_COUNT = 20;
const MAX_MULTIPLICATION_FACTOR = 10;
const MAX_DIVISION_DIVIDEND = 30;

const state = {
  gameState: 'start',
  mode: 'mixed',
  questions: [],
  currentQuestionIndex: 0,
  currentInput: '',
};

const trainingModes = {
  multiply: {
    label: 'Mnożenie do 100',
    shortLabel: 'Mnożenie',
    symbol: '✖️',
    description: 'Ćwicz tabliczkę mnożenia do 100. Wpisujesz wynik albo brakujący czynnik.',
  },
  divide: {
    label: 'Dzielenie do 30',
    shortLabel: 'Dzielenie',
    symbol: '➗',
    description: 'Rozwiązuj działania z dzielenia w zakresie do 30 i uzupełniaj brakujące liczby.',
  },
  mixed: {
    label: 'Mieszany trening',
    shortLabel: 'Mieszany',
    symbol: '🧠',
    description: 'Połącz mnożenie do 100 i dzielenie do 30 w jednym teście powtórkowym.',
  },
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
  home: `
    <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5"></path>
      <path d="M5 10.5V20h14v-9.5"></path>
    </svg>
  `,
};

const divisionFacts = buildDivisionFacts();

function buildDivisionFacts() {
  const facts = [];

  for (let divisor = 1; divisor <= 10; divisor += 1) {
    for (let quotient = 1; quotient <= MAX_DIVISION_DIVIDEND; quotient += 1) {
      const dividend = divisor * quotient;

      if (dividend <= MAX_DIVISION_DIVIDEND) {
        facts.push({ left: dividend, right: divisor, result: quotient });
      }
    }
  }

  return facts;
}

function getModeConfig(mode) {
  return trainingModes[mode] || trainingModes.mixed;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(array) {
  return array[randomInt(0, array.length - 1)];
}

function getRandomMissingPart() {
  return pickRandom(['result', 'result', 'left', 'right']);
}

function createMultiplicationQuestion() {
  const left = randomInt(1, MAX_MULTIPLICATION_FACTOR);
  const right = randomInt(1, MAX_MULTIPLICATION_FACTOR);
  const result = left * right;
  const missing = getRandomMissingPart();

  return {
    type: 'multiply',
    left,
    right,
    result,
    missing,
    answer: { left, right, result }[missing],
    userAnswer: null,
  };
}

function createDivisionQuestion() {
  const fact = pickRandom(divisionFacts);
  const missing = getRandomMissingPart();

  return {
    type: 'divide',
    left: fact.left,
    right: fact.right,
    result: fact.result,
    missing,
    answer: { left: fact.left, right: fact.right, result: fact.result }[missing],
    userAnswer: null,
  };
}

function generateQuestions(mode) {
  return Array.from({ length: QUESTION_COUNT }, () => {
    if (mode === 'multiply') {
      return createMultiplicationQuestion();
    }

    if (mode === 'divide') {
      return createDivisionQuestion();
    }

    return Math.random() < 0.5 ? createMultiplicationQuestion() : createDivisionQuestion();
  });
}

function getOperationSymbol(type) {
  return type === 'divide' ? '÷' : '×';
}

function getQuestionPrompt(question) {
  if (question.missing === 'result') {
    return question.type === 'divide'
      ? 'Oblicz wynik dzielenia.'
      : 'Oblicz wynik mnożenia.';
  }

  if (question.type === 'multiply') {
    return 'Wpisz brakujący czynnik, aby działanie było poprawne.';
  }

  if (question.missing === 'right') {
    return 'Wpisz liczbę, przez którą dzielimy.';
  }

  return 'Wpisz brakującą liczbę, aby działanie było poprawne.';
}

function getQuestionLabel(question) {
  if (question.type === 'multiply') {
    return question.missing === 'result' ? 'Mnożenie • wynik' : 'Mnożenie • brakujący czynnik';
  }

  return question.missing === 'result' ? 'Dzielenie • wynik' : 'Dzielenie • brakująca liczba';
}

function renderOperationPart(question, partName, inputValue) {
  if (question.missing === partName) {
    return `<div class="answer-box ${inputValue ? 'filled' : ''}">${inputValue || '?'}</div>`;
  }

  return `<span class="operation-number">${question[partName]}</span>`;
}

function renderLiveOperation(question, inputValue = state.currentInput) {
  return `
    ${renderOperationPart(question, 'left', inputValue)}
    <span class="operation-separator">${getOperationSymbol(question.type)}</span>
    ${renderOperationPart(question, 'right', inputValue)}
    <span class="operation-separator">=</span>
    ${renderOperationPart(question, 'result', inputValue)}
  `;
}

function renderQuestionSkeleton(question) {
  const renderPart = (partName) => {
    if (question.missing === partName) {
      return '<span class="result-blank">□</span>';
    }

    return `<span>${question[partName]}</span>`;
  };

  return `
    ${renderPart('left')}
    <span class="inline-symbol">${getOperationSymbol(question.type)}</span>
    ${renderPart('right')}
    <span class="inline-symbol">=</span>
    ${renderPart('result')}
  `;
}

function formatSolvedExpression(question) {
  return `${question.left} ${getOperationSymbol(question.type)} ${question.right} = ${question.result}`;
}

function startGame(mode) {
  state.mode = mode;
  state.questions = generateQuestions(mode);
  state.currentQuestionIndex = 0;
  state.currentInput = '';
  state.gameState = 'playing';
  render();
}

function goToStart() {
  state.gameState = 'start';
  state.questions = [];
  state.currentQuestionIndex = 0;
  state.currentInput = '';
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
  const modeButtons = Object.entries(trainingModes)
    .map(
      ([modeKey, mode]) => `
        <button class="mode-card" type="button" data-action="start" data-mode="${modeKey}">
          <span class="mode-symbol" aria-hidden="true">${mode.symbol}</span>
          <span class="mode-card-body">
            <span class="mode-title">${mode.label}</span>
            <span class="mode-text">${mode.description}</span>
          </span>
        </button>
      `,
    )
    .join('');

  app.innerHTML = `
    <section class="page">
      <div class="card start-screen">
        <div class="start-icon" aria-hidden="true">
          <span class="start-icon-symbol">✖️➗</span>
        </div>
        <h1 class="start-title">Mnożenie do 100 i dzielenie do 30</h1>
        <p class="start-description">
          Wybierz tryb i rozwiąż 20 zadań. W tym treningu wpisujesz nie tylko wynik,
          ale czasem także brakujący składnik działania, żeby wszystko tworzyło jedną całość.
        </p>

        <div class="mode-grid" aria-label="Wybór trybu ćwiczeń">
          ${modeButtons}
        </div>

        <div class="start-note">
          <h2 class="start-note-title">Jak działa trening?</h2>
          <ul class="start-note-list">
            <li>• Możesz wybrać samo mnożenie, samo dzielenie albo mieszany zestaw.</li>
            <li>• Zadania sprawdzają wynik albo brakującą liczbę w działaniu.</li>
            <li>• Odpowiedzi wpisujesz klawiaturą ekranową albo klawiaturą komputera.</li>
          </ul>
        </div>
      </div>
    </section>
  `;
}

function renderQuiz() {
  const currentQuestion = state.questions[state.currentQuestionIndex];
  const progress = ((state.currentQuestionIndex + 1) / state.questions.length) * 100;
  const mode = getModeConfig(state.mode);

  app.innerHTML = `
    <section class="page">
      <div class="card game">
        <div class="progress-track" aria-hidden="true">
          <div class="progress-bar" style="width: ${progress}%;"></div>
        </div>

        <div class="game-inner">
          <div class="topbar topbar-quiz">
            <div>
              <div class="badge">Zadanie ${state.currentQuestionIndex + 1} z ${state.questions.length}</div>
              <h2 class="title">${mode.shortLabel}</h2>
            </div>
            <div class="mode-pill ${currentQuestion.type === 'divide' ? 'is-division' : ''}">${getQuestionLabel(currentQuestion)}</div>
          </div>

          <div class="question-panel">
            <p class="question-tip">${getQuestionPrompt(currentQuestion)}</p>
            <div class="operation" aria-label="Działanie">
              ${renderLiveOperation(currentQuestion)}
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

          <p class="hint">Możesz też używać klawiatury komputera (Enter = zatwierdź, Backspace = usuń).</p>
        </div>
      </div>
    </section>
  `;
}

function getFeedbackMessage(percentage) {
  if (percentage === 100) {
    return 'Perfekcyjnie! To była matematyczna robota na szóstkę.';
  }

  if (percentage >= 80) {
    return 'Świetna robota! Bardzo dobrze radzisz sobie z działaniami.';
  }

  if (percentage >= 50) {
    return 'Jest dobrze, ale jeszcze kilka ćwiczeń i będzie znakomicie.';
  }

  return 'To dobry początek. Spróbuj jeszcze raz i zobacz, które działania warto przećwiczyć.';
}

function renderResults() {
  const correctAnswers = state.questions.filter((question) => question.answer === question.userAnswer).length;
  const percentage = Math.round((correctAnswers / state.questions.length) * 100);
  const feedbackMessage = getFeedbackMessage(percentage);
  const mode = getModeConfig(state.mode);

  const results = state.questions
    .map((question, index) => {
      const isCorrect = question.answer === question.userAnswer;

      return `
        <article class="result-item ${isCorrect ? 'correct' : 'wrong'}">
          <div class="result-main">
            <div class="result-expression-row">
              <span class="result-index">${index + 1}.</span>
              <span class="result-expression">${renderQuestionSkeleton(question)}</span>
            </div>
            <div class="result-meta">${getQuestionLabel(question)}</div>
          </div>

          <div class="result-right">
            <div class="answer-stack">
              <span class="answer-caption">Twoja odpowiedź</span>
              <span class="answer-value ${isCorrect ? 'correct' : 'crossed'}">${question.userAnswer ?? 'Brak'}</span>
              ${!isCorrect ? `<span class="correct-answer">Poprawnie: ${formatSolvedExpression(question)}</span>` : ''}
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
          <div class="summary-mode">${mode.label}</div>
          <h1 class="results-title">Podsumowanie</h1>
          <div class="score">${correctAnswers} / ${state.questions.length}</div>
          <p class="results-subtitle">${feedbackMessage}</p>
        </header>

        <div class="summary-body">
          <h2 class="summary-heading">Twoje odpowiedzi:</h2>
          <div class="results-list">${results}</div>

          <div class="results-actions">
            <button class="restart" type="button" data-action="restart">
              ${icons.restart}
              <span>Powtórz ten tryb</span>
            </button>

            <button class="secondary-button" type="button" data-action="home">
              ${icons.home}
              <span>Wybierz inny tryb</span>
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

  const { action, value, mode } = button.dataset;

  if (action === 'start') {
    startGame(mode || 'mixed');
  } else if (action === 'number') {
    handleInput(value);
  } else if (action === 'delete') {
    handleDelete();
  } else if (action === 'submit') {
    handleSubmit();
  } else if (action === 'restart') {
    startGame(state.mode);
  } else if (action === 'home') {
    goToStart();
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