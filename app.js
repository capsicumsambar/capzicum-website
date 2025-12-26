// --- START OF NEW SCANNING CODE ---
const ocrBtn = document.getElementById("ocr-btn");
const cameraInput = document.getElementById("camera-input");
const ingredientsBox = document.getElementById("ingredients");
const scanBtn = document.getElementById("scan-btn");

// 1. Connect "Read Label" button to the hidden camera
ocrBtn.addEventListener("click", () => {
  cameraInput.click();
});

// 2. When a photo is taken, run the AI
cameraInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // UI Feedback: Show user something is happening
  ocrBtn.textContent = "⏳ Reading...";
  ocrBtn.disabled = true;
  ingredientsBox.value = "Scanning label... please wait...";

  try {
    // 3. Send to Puter AI with "Ignore Distractions" prompt
    const response = await puter.ai.chat(
      `Look at this image of a food product. Find the section labeled 'Ingredients'. 
             Extract and output ONLY the text of the ingredients list. 
             Ignore nutrition facts, barcodes, and branding.`,
      file
    );

    // 4. Fill the box with the result
    // Puter usually returns an object, we want the text content
    const text = response.message?.content || response;
    ingredientsBox.value = text.trim();

    // 5. Automatically click the existing "Scan" button
    scanBtn.click();
  } catch (error) {
    console.error("OCR Error:", error);
    ingredientsBox.value = "Could not read text. Please try again.";
  } finally {
    // Reset button state
    ocrBtn.textContent = "📸 Read Label";
    ocrBtn.disabled = false;
    // Clear the input so you can scan the same file again if needed
    cameraInput.value = "";
  }
});
// --- END OF NEW SCANNING CODE ---

const API_URL = "https://capsicum.pythonanywhere.com/scan";

document.getElementById("scan-btn").addEventListener("click", checkIngredients);

async function checkIngredients() {
  const ingredients = document.getElementById("ingredients").value.trim();
  if (!ingredients) return;

  const btn = document.getElementById("scan-btn");
  const resultsDiv = document.getElementById("results");

  btn.textContent = "Checking...";
  btn.disabled = true;
  resultsDiv.innerHTML = "";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ingredients: ingredients }),
    });

    const data = await response.json();
    displayResults(data);
  } catch (error) {
    resultsDiv.innerHTML = '<p class="error">Error connecting to server</p>';
  } finally {
    btn.textContent = "Scan";
    btn.disabled = false;
  }
}

function displayResults(data) {
  const resultsDiv = document.getElementById("results");

  if (data.banned_count === 0) {
    resultsDiv.innerHTML = `
      <div class="results-card">
        <div class="results-header safe">✓ No flagged ingredients found</div>
      </div>
    `;
    return;
  }

  let rowsHtml = "";

  for (const item of data.banned_ingredients) {
    const orgs = Array.isArray(item.organizations)
      ? item.organizations
      : [item.organizations];
    const tagsHtml = orgs
      .map((org) => `<span class="org-tag">${org}</span>`)
      .join("");

    rowsHtml += `
      <div class="results-row">
        <div class="ingredient-info">
          <div class="ingredient-name">${item.name}</div>
          <div class="ingredient-match">Found as: ${item.matched_terms.join(
            ", "
          )}</div>
        </div>
        <div class="org-tags">${tagsHtml}</div>
      </div>
    `;
  }

  resultsDiv.innerHTML = `
    <div class="results-card">
      <div class="results-header">
        ${data.banned_count} ingredient${
    data.banned_count > 1 ? "s" : ""
  } flagged in <strong>Capzicum</strong>
      </div>
      <div class="results-table-header">
        <span>Ingredient</span>
        <span>In the avoid list of</span>
      </div>
      <div class="results-table">
        ${rowsHtml}
      </div>
      <div class="disclaimer">
        <span class="disclaimer-icon">ℹ</span>
        <span>For informational purposes only. Tap for more.</span>
      </div>
    </div>
  `;
}
