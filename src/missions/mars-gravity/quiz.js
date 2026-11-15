(() => {
  "use strict";

  const QUESTIONS = [
    {
      question: "Which rover collected the Sapphire Canyon sample on Mars?",
      options: ["Curiosity", "Perseverance", "Sojourner", "Opportunity"],
      answer: 1,
    },
    {
      question: "Sapphire Canyon was drilled from which arrowhead-shaped rock?",
      options: ["Cheyava Falls", "Wildcat Ridge", "Rochette", "Berea"],
      answer: 0,
    },
    {
      question: "Why does Perseverance seal selected Martian samples inside clean tubes?",
      options: [
        "To use them as extra rover wheels",
        "To protect them for detailed scientific study",
        "To make the rover travel faster",
        "To turn the samples into fuel",
      ],
      answer: 1,
    },
    {
      question: "What major question could these Mars samples help scientists investigate?",
      options: [
        "Whether Mars once supported microscopic life",
        "Whether Mars has forests today",
        "Whether Mars is larger than Jupiter",
        "Whether Mars has an ocean on its surface today",
      ],
      answer: 0,
    },
    {
      question: "In the rover challenge, what is the safest way to cross a steep hill?",
      options: [
        "Accelerate as hard as possible",
        "Drive slowly and watch the stability warning",
        "Keep the rover tilted on two wheels",
        "Ignore the slope and hold Forward",
      ],
      answer: 1,
    },
  ];

  const PASS_SCORE = 4;
  let questionIndex = 0;
  let answers = [];
  let completionSent = false;

  const get = (id) => document.getElementById(id);
  const quizCard = get("quiz-card");
  const result = get("result");
  const progressBar = get("progress-bar");
  const counter = get("counter");
  const question = get("question");
  const options = get("options");
  const nextButton = get("next-button");

  function chooseAnswer(answerIndex) {
    answers[questionIndex] = answerIndex;
    renderQuestion();
  }

  function optionButton(label, optionIndex, selectedIndex) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option";
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", String(optionIndex === selectedIndex));
    button.textContent = label;
    button.addEventListener("click", () => chooseAnswer(optionIndex));
    return button;
  }

  function renderQuestion() {
    const current = QUESTIONS[questionIndex];
    const selected = answers[questionIndex];
    const isLast = questionIndex === QUESTIONS.length - 1;

    counter.textContent = `Question ${questionIndex + 1} of ${QUESTIONS.length}`;
    progressBar.style.width = `${((questionIndex + 1) / QUESTIONS.length) * 100}%`;
    question.textContent = current.question;
    options.setAttribute("role", "radiogroup");
    options.setAttribute("aria-label", `Answers for question ${questionIndex + 1}`);
    options.replaceChildren(
      ...current.options.map((label, index) => optionButton(label, index, selected)),
    );

    nextButton.textContent = isLast ? "Submit answers" : "Next question";
    nextButton.disabled = selected === undefined;
  }

  function sendCompletion() {
    if (completionSent) return;
    completionSent = true;
    window.parent.postMessage(
      { type: "QUIZ_PASSED", lessonId: 14 },
      window.location.origin,
    );
  }

  function showResult() {
    const score = answers.reduce(
      (total, answer, index) => total + Number(answer === QUESTIONS[index].answer),
      0,
    );
    const passed = score >= PASS_SCORE;

    quizCard.hidden = true;
    result.hidden = false;
    result.className = `quiz-card result ${passed ? "pass" : "fail"}`;

    const icon = document.createElement("div");
    icon.className = "result-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = passed ? "✓" : "↻";

    const heading = document.createElement("h2");
    heading.textContent = passed ? "Sample mission complete!" : "Almost there, cadet";

    const scoreLine = document.createElement("p");
    scoreLine.className = "score";
    scoreLine.textContent = `${score} / ${QUESTIONS.length} correct`;

    const copy = document.createElement("p");
    copy.className = "result-copy";
    copy.textContent = passed
      ? "You connected careful rover driving with the science behind collecting Mars samples."
      : `Review the video and try again. You need ${PASS_SCORE} correct answers to pass.`;

    result.replaceChildren(icon, heading, scoreLine, copy);

    if (passed) {
      sendCompletion();
      return;
    }

    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "button button-secondary";
    retry.textContent = "Try again";
    retry.addEventListener("click", restart);
    result.append(retry);
  }

  function restart() {
    questionIndex = 0;
    answers = [];
    result.hidden = true;
    quizCard.hidden = false;
    renderQuestion();
  }

  nextButton.addEventListener("click", () => {
    if (answers[questionIndex] === undefined) return;
    if (questionIndex === QUESTIONS.length - 1) {
      showResult();
      return;
    }

    questionIndex += 1;
    renderQuestion();
  });

  renderQuestion();
})();
