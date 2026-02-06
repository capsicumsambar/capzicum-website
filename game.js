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
const containerA = document.getElementById("container-a");
const containerB = document.getElementById("container-b");
const resultBox = document.getElementById("result-box");
const resultTitle = document.getElementById("result-title");
const resultExplanation = document.getElementById("result-explanation");
const nextBtn = document.getElementById("next-btn");
const scoreEl = document.getElementById("score");

// Load a question from API
async function loadQuestion() {
  // Reset state
  answered = false;

  // Reset UI
  loadingEl.style.display = "block";
  gameContentEl.style.display = "none";
  resultBox.classList.remove("visible", "correct", "incorrect");
  nextBtn.classList.remove("visible");

  // Reset cards
  containerA.classList.remove(
    "selected",
    "correct",
    "incorrect",
    "reveal-correct",
  );
  containerB.classList.remove(
    "selected",
    "correct",
    "incorrect",
    "reveal-correct",
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
    gameContentEl.style.flexDirection = "column";
    gameContentEl.style.alignItems = "center";
  } catch (error) {
    console.error("Error fetching question:", error);
    loadingEl.textContent = "Error loading question. Please refresh.";
  }
}

// Handle answer selection
function selectAnswer(choice) {
  if (answered) {
    return; // Already answered
  }

  answered = true;

  const isCorrect = choice === currentQuestion.correct_answer;

  // Update score
  if (isCorrect) {
    score++;
    scoreEl.textContent = score;
  }

  // Show which was selected and if correct/incorrect
  if (choice === "a") {
    containerA.classList.add("selected", isCorrect ? "correct" : "incorrect");
  } else {
    containerB.classList.add("selected", isCorrect ? "correct" : "incorrect");
  }

  // Highlight correct answer if wrong
  if (!isCorrect) {
    if (currentQuestion.correct_answer === "a") {
      containerA.classList.add("reveal-correct");
    } else {
      containerB.classList.add("reveal-correct");
    }
  }

  // Flip both cards to reveal ingredients
  cardA.classList.add("flipped");
  cardB.classList.add("flipped");

  // Show result after flip animation
  setTimeout(() => {
    resultBox.classList.add("visible", isCorrect ? "correct" : "incorrect");
    resultTitle.textContent = isCorrect ? "✓ Correct!" : "✗ Incorrect";
    resultExplanation.textContent = currentQuestion.explanation;
    nextBtn.classList.add("visible");
  }, 600);
}

// Start game on page load
document.addEventListener("DOMContentLoaded", loadQuestion);
