// Game State
let score = 0;
let currentQuestion = null;
let answered = false;
let cardAFlipped = false;
let cardBFlipped = false;
let questionNumber = 0;
// const TOTAL_QUESTIONS = 10;
let askedQuestionIds = [];

const API_URL = "https://capsicum.pythonanywhere.com/game/question";

// Wait for DOM to be ready
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
  const scoreEl = document.getElementById("score");
  // const currentQuestionEl = document.getElementById("current-question");
  // const totalQuestionsEl = document.getElementById("total-questions");
  // const endScreen = document.getElementById("end-screen");
  // const finalScoreEl = document.getElementById("final-score");
  // const finalTotalEl = document.getElementById("final-total");
  // const endMessageEl = document.getElementById("end-message");
  // const endEmojiEl = document.getElementById("end-emoji");
  // const playAgainBtn = document.getElementById("play-again-btn");

  // Set total questions display
  // totalQuestionsEl.textContent = TOTAL_QUESTIONS;
  // finalTotalEl.textContent = TOTAL_QUESTIONS;

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

    if (isCorrect) {
      score++;
      scoreEl.textContent = score;
    }

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

    // // Check if game is over
    // if (questionNumber >= TOTAL_QUESTIONS) {
    //   nextBtn.textContent = "See Results →";
    // }
    nextBtn.classList.add("visible");
  }

  // function showEndScreen() {
  //   gameContentEl.style.display = "none";
  //   loadingEl.style.display = "none";
  //   endScreen.classList.add("visible");

  //   finalScoreEl.textContent = score;

  //   // Set message based on score
  //   const percentage = (score / TOTAL_QUESTIONS) * 100;
  //   if (percentage === 100) {
  //     endEmojiEl.textContent = "🏆";
  //     endMessageEl.textContent = "Perfect score! You're a UPF expert!";
  //   } else if (percentage >= 80) {
  //     endEmojiEl.textContent = "🌟";
  //     endMessageEl.textContent = "Excellent! You really know your ingredients!";
  //   } else if (percentage >= 60) {
  //     endEmojiEl.textContent = "👍";
  //     endMessageEl.textContent =
  //       "Good job! You're learning to spot ultra-processed foods.";
  //   } else if (percentage >= 40) {
  //     endEmojiEl.textContent = "📚";
  //     endMessageEl.textContent =
  //       "Keep learning! Check ingredient labels when you shop.";
  //   } else {
  //     endEmojiEl.textContent = "💪";
  //     endMessageEl.textContent =
  //       "Don't give up! Ultra-processed foods can be tricky to spot.";
  //   }
  // }

  function resetGame() {
    score = 0;
    questionNumber = 0;
    askedQuestionIds = [];
    scoreEl.textContent = "0";
    // currentQuestionEl.textContent = "1";
    endScreen.classList.remove("visible");
    nextBtn.textContent = "Next Question →";
    loadQuestion();
  }

  async function loadQuestion() {
    // // Check if game is over
    // if (questionNumber >= TOTAL_QUESTIONS) {
    //   showEndScreen();
    //   return;
    // }

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
      const response = await fetch(API_URL);
      const data = await response.json();

      if (!data.success) {
        loadingEl.textContent = "Error loading question. Please refresh.";
        return;
      }

      currentQuestion = data.question;
      questionNumber++;
      // currentQuestionEl.textContent = questionNumber;

      // Track asked questions to avoid repeats (if API supports it later)
      askedQuestionIds.push(currentQuestion.id);

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
  // playAgainBtn.addEventListener("click", resetGame);

  // Start
  loadQuestion();
});
