// --- START OF NEW SCANNING CODE ---
const ocrBtn = document.getElementById("ocr-btn");
const cameraInput = document.getElementById("camera-input");
const ingredientsBox = document.getElementById("ingredients");
const scanBtn = document.getElementById("scan-btn");

// 1. Connect "Read Label" button to the hidden camera
ocrBtn.addEventListener("click", () => {
  cameraInput.click();
});

// 2. When a photo is taken, run the AI (Optimized)
cameraInput.addEventListener("change", async (e) => {
  const originalFile = e.target.files[0];
  if (!originalFile) return;

  // UI Feedback
  ocrBtn.textContent = "⏳ Compressing...";
  ocrBtn.disabled = true;
  ingredientsBox.value = "Preparing image...";

  try {
    // A. Resize the image first (Speed Boost!)
    const file = await resizeImage(originalFile);

    ocrBtn.textContent = "⏳ Reading...";
    ingredientsBox.value = "Scanning label...";

    // B. Send to Puter AI (Slightly shorter prompt for speed)
    const response = await puter.ai.chat(
      `Read the 'Ingredients' section from this food label. Output ONLY the raw ingredient text.`,
      file
    );

    const text = response.message?.content || response;
    ingredientsBox.value = text.trim();

    // C. Auto-click Scan
    scanBtn.click();
  } catch (error) {
    console.error("OCR Error:", error);
    ingredientsBox.value = "Error reading text. Try again.";
  } finally {
    ocrBtn.textContent = "📸 Read Label";
    ocrBtn.disabled = false;
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

// Helper: Resize image to speed up upload & processing
function resizeImage(file, maxWidth = 1000) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = maxWidth / img.width;
        if (scale >= 1) {
          resolve(file);
          return;
        } // No resize needed

        const canvas = document.createElement("canvas");
        canvas.width = maxWidth;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, { type: file.type }));
          },
          file.type,
          0.8
        ); // 0.8 quality is plenty for text
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
