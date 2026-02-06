// Game State
let score = 0;
let currentQuestion = null;

const API_URL = "https://capsicum.pythonanywhere.com/game/question";

// DOM Elements
const loadingEl = document.getElementById("loading");
const gameContentEl = document.getElementById("game-content");
const questionTextEl = document.getElementById("question-text");
const imageA = document.getElementById("image-a");
const imageB = document.getElementById("image-b");
const nameA = document.getElementById("name-a");
const nameB = document.getElementById("name-b");
const ingredientsA = document.getElementById("ingredients-a");
const ingredientsB = document.getElementById("ingredients-b");
const cardA = document.getElementById("card-a");
const cardB = document.getElementById("card-b");
const resultBox = document.getElementById("result-box");
const resultTitle = document.getElementById("result-title");
const resultExplanation = document.getElementById("result-explanation");
const nextBtn = document.getElementById("next-btn");
const scoreEl = document.getElementById("score");

// Load a question from API
async function loadQuestion() {
  // Reset UI
  loadingEl.style.display = "block";
  gameContentEl.style.display = "none";
  resultBox.classList.remove("visible", "correct", "incorrect");
  nextBtn.classList.remove("visible");
  cardA.classList.remove("selected", "correct", "incorrect", "reveal-correct");
  cardB.classList.remove("selected", "correct", "incorrect", "reveal-correct");
  ingredientsA.classList.remove("visible");
  ingredientsB.classList.remove("visible");

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
  if (resultBox.classList.contains("visible")) {
    return; // Already answered
  }

  const isCorrect = choice === currentQuestion.correct_answer;

  // Update score
  if (isCorrect) {
    score++;
    scoreEl.textContent = score;
  }

  // Show which was selected
  if (choice === "a") {
    cardA.classList.add("selected", isCorrect ? "correct" : "incorrect");
  } else {
    cardB.classList.add("selected", isCorrect ? "correct" : "incorrect");
  }

  // Highlight correct answer if wrong
  if (!isCorrect) {
    if (currentQuestion.correct_answer === "a") {
      cardA.classList.add("reveal-correct");
    } else {
      cardB.classList.add("reveal-correct");
    }
  }

  // Reveal ingredients
  ingredientsA.classList.add("visible");
  ingredientsB.classList.add("visible");

  // Show result
  resultBox.classList.add("visible", isCorrect ? "correct" : "incorrect");
  resultTitle.textContent = isCorrect ? "✓ Correct!" : "✗ Incorrect";
  resultExplanation.textContent = currentQuestion.explanation;

  // Show next button
  nextBtn.classList.add("visible");
}

// Start game on page load
document.addEventListener("DOMContentLoaded", loadQuestion);
