// Game State
let currentQuestion = null;
let answered = false;
let cardAFlipped = false;
let cardBFlipped = false;
let recentQuestions = []; // Track recent to avoid repeats
const RECENT_LIMIT = 5; // Don't repeat within last 5 questions

const API_BASE = "https://capsicum.pythonanywhere.com";

document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const loadingEl = document.getElementById("loading");
  const gameContentEl = document.getElementById("game-content");
  const questionTextEl = document.getElementById("question-text");
  const imageA = document.getElementById("image-a");
  const imageB = document.getElementById("image-b");
  const nameA = document.getElementById("name-a");
  const nameB = document.getElementById("name-b");
  const backNameA = document.getElementById("back-name-a");
  const backNameB = document.getElementById("back-name-b");
  const ingredientsA = document.getElementById("ingredients-a");
  const ingredientsB = document.getElementById("ingredients-b");
  const cardA = document.getElementById("card-a");
  const cardB = document.getElementById("card-b");
  const wrapperA = document.getElementById("wrapper-a");
  const wrapperB = document.getElementById("wrapper-b");
  const frontA = document.getElementById("front-a");
  const frontB = document.getElementById("front-b");
  const checkA = document.getElementById("check-a");
  const checkB = document.getElementById("check-b");
  const closeA = document.getElementById("close-a");
  const closeB = document.getElementById("close-b");
  const resultBox = document.getElementById("result-box");
  const resultTitle = document.getElementById("result-title");
  const resultExplanation = document.getElementById("result-explanation");
  const nextBtn = document.getElementById("next-btn");

  function flipCard(choice) {
    if (answered) return;
    const card = choice === "a" ? cardA : cardB;
    const wrapper = choice === "a" ? wrapperA : wrapperB;
    if (choice === "a") cardAFlipped = true;
    else cardBFlipped = true;
    card.classList.add("flipped");
    wrapper.classList.add("is-flipped");
  }

  function closeCard(choice) {
    const card = choice === "a" ? cardA : cardB;
    const wrapper = choice === "a" ? wrapperA : wrapperB;
    if (choice === "a") cardAFlipped = false;
    else cardBFlipped = false;
    card.classList.remove("flipped");
    wrapper.classList.remove("is-flipped");
  }

  function selectAnswer(choice) {
    const isFlipped = choice === "a" ? cardAFlipped : cardBFlipped;
    if (answered || isFlipped) return;

    answered = true;

    const wrapper = choice === "a" ? wrapperA : wrapperB;
    const isCorrect = choice === currentQuestion.correct_answer;

    wrapperA.classList.add("disabled");
    wrapperB.classList.add("disabled");
    wrapper.classList.add("selected", isCorrect ? "correct" : "incorrect");

    if (!isCorrect) {
      const correctWrapper =
        currentQuestion.correct_answer === "a" ? wrapperA : wrapperB;
      correctWrapper.classList.add("reveal-correct");
    }

    resultBox.classList.remove("correct", "incorrect");
    resultBox.classList.add("visible", isCorrect ? "correct" : "incorrect");
    resultTitle.textContent = isCorrect ? "✓ Correct!" : "✗ Incorrect";
    resultExplanation.textContent = currentQuestion.explanation;
    nextBtn.classList.add("visible");
  }

  async function loadQuestion() {
    answered = false;
    cardAFlipped = false;
    cardBFlipped = false;

    loadingEl.style.display = "block";
    gameContentEl.style.display = "none";
    resultBox.classList.remove("visible", "correct", "incorrect");
    nextBtn.classList.remove("visible");

    wrapperA.classList.remove(
      "selected",
      "correct",
      "incorrect",
      "reveal-correct",
      "disabled",
      "is-flipped",
    );
    wrapperB.classList.remove(
      "selected",
      "correct",
      "incorrect",
      "reveal-correct",
      "disabled",
      "is-flipped",
    );
    cardA.classList.remove("flipped");
    cardB.classList.remove("flipped");

    try {
      // Keep fetching until we get a non-recent question (max 10 tries)
      let attempts = 0;
      let data;

      do {
        const response = await fetch(API_BASE + "/game/question");
        data = await response.json();
        attempts++;
      } while (
        data.success &&
        recentQuestions.includes(data.question.id) &&
        attempts < 10
      );

      if (!data.success) {
        loadingEl.textContent = "Error loading question. Please refresh.";
        return;
      }

      currentQuestion = data.question;

      // Track recent questions
      recentQuestions.push(currentQuestion.id);
      if (recentQuestions.length > RECENT_LIMIT) {
        recentQuestions.shift();
      }

      questionTextEl.textContent = currentQuestion.text;
      imageA.src = API_BASE + currentQuestion.product_a.image;
      imageB.src = API_BASE + currentQuestion.product_b.image;
      nameA.textContent = currentQuestion.product_a.name;
      nameB.textContent = currentQuestion.product_b.name;
      backNameA.textContent = currentQuestion.product_a.name;
      backNameB.textContent = currentQuestion.product_b.name;
      ingredientsA.textContent = currentQuestion.product_a.ingredients;
      ingredientsB.textContent = currentQuestion.product_b.ingredients;

      loadingEl.style.display = "none";
      gameContentEl.style.display = "flex";
    } catch (error) {
      console.error("Error:", error);
      loadingEl.innerHTML =
        'Error loading. <button onclick="location.reload()">Retry</button>';
    }
  }

  // Event Listeners
  frontA.addEventListener("click", (e) => {
    e.stopPropagation();
    selectAnswer("a");
  });
  frontB.addEventListener("click", (e) => {
    e.stopPropagation();
    selectAnswer("b");
  });
  checkA.addEventListener("click", (e) => {
    e.stopPropagation();
    flipCard("a");
  });
  checkB.addEventListener("click", (e) => {
    e.stopPropagation();
    flipCard("b");
  });
  closeA.addEventListener("click", (e) => {
    e.stopPropagation();
    closeCard("a");
  });
  closeB.addEventListener("click", (e) => {
    e.stopPropagation();
    closeCard("b");
  });
  nextBtn.addEventListener("click", loadQuestion);

  // Start
  loadQuestion();
});
