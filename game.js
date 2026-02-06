// Game State
let score = 0;
let currentQuestion = null;
let answered = false;

const API_URL = "https://capsicum.pythonanywhere.com/game/question";

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
const scoreEl = document.getElementById("score");

// Flip card to show ingredients
function flipCard(choice) {
  const card = choice === "a" ? cardA : cardB;
  const wrapper = choice === "a" ? wrapperA : wrapperB;
  card.classList.add("flipped");
  wrapper.classList.add("is-flipped");
}

// Close card (flip back)
function closeCard(choice) {
  const card = choice === "a" ? cardA : cardB;
  const wrapper = choice === "a" ? wrapperA : wrapperB;
  card.classList.remove("flipped");
  wrapper.classList.remove("is-flipped");
}

// Handle answer selection - only when card is showing front
function selectAnswer(choice) {
  const wrapper = choice === "a" ? wrapperA : wrapperB;
  const card = choice === "a" ? cardA : cardB;

  // Don't allow selection if answered or card is flipped
  if (answered || card.classList.contains("flipped")) {
    return;
  }

  answered = true;

  const isCorrect = choice === currentQuestion.correct_answer;

  // Update score
  if (isCorrect) {
    score++;
    scoreEl.textContent = score;
  }

  // Disable both cards
  wrapperA.classList.add("disabled");
  wrapperB.classList.add("disabled");

  // Mark selected card
  wrapper.classList.add("selected", isCorrect ? "correct" : "incorrect");

  // Highlight correct answer if wrong
  if (!isCorrect) {
    const correctWrapper =
      currentQuestion.correct_answer === "a" ? wrapperA : wrapperB;
    correctWrapper.classList.add("reveal-correct");
  }

  // Show result
  resultBox.classList.add("visible", isCorrect ? "correct" : "incorrect");
  resultTitle.textContent = isCorrect ? "✓ Correct!" : "✗ Incorrect";
  resultExplanation.textContent = currentQuestion.explanation;
  nextBtn.classList.add("visible");
}

// Load a question from API
async function loadQuestion() {
  answered = false;

  // Reset UI
  loadingEl.style.display = "block";
  gameContentEl.style.display = "none";
  resultBox.classList.remove("visible", "correct", "incorrect");
  nextBtn.classList.remove("visible");

  // Reset cards
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
    const response = await fetch(API_URL);
    const data = await response.json();

    if (!data.success) {
      loadingEl.textContent = "Error loading question. Please refresh.";
      return;
    }

    currentQuestion = data.question;

    // Populate UI
    questionTextEl.textContent = currentQuestion.text;
    imageA.src =
      "https://capsicum.pythonanywhere.com" + currentQuestion.product_a.image;
    imageB.src =
      "https://capsicum.pythonanywhere.com" + currentQuestion.product_b.image;
    nameA.textContent = currentQuestion.product_a.name;
    nameB.textContent = currentQuestion.product_b.name;
    backNameA.textContent = currentQuestion.product_a.name;
    backNameB.textContent = currentQuestion.product_b.name;
    ingredientsA.textContent = currentQuestion.product_a.ingredients;
    ingredientsB.textContent = currentQuestion.product_b.ingredients;

    // Show game
    loadingEl.style.display = "none";
    gameContentEl.style.display = "flex";
  } catch (error) {
    console.error("Error fetching question:", error);
    loadingEl.textContent = "Error loading question. Please refresh.";
  }
}

// Event Listeners
frontA.addEventListener("click", () => selectAnswer("a"));
frontB.addEventListener("click", () => selectAnswer("b"));
checkA.addEventListener("click", () => flipCard("a"));
checkB.addEventListener("click", () => flipCard("b"));
closeA.addEventListener("click", () => closeCard("a"));
closeB.addEventListener("click", () => closeCard("b"));
nextBtn.addEventListener("click", loadQuestion);

// Start game
document.addEventListener("DOMContentLoaded", loadQuestion);
