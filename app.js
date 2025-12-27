// Global Elements
const ocrBtn = document.getElementById("ocr-btn");
const cameraInput = document.getElementById("camera-input");
const ingredientsBox = document.getElementById("ingredients");
const nameBox = document.getElementById("product-name"); // New
const scanBtn = document.getElementById("scan-btn");
const barcodeBtn = document.getElementById("barcode-btn");
const readerDiv = document.getElementById("reader");
const addListBtn = document.getElementById("add-list-btn"); // New
const listContainer = document.getElementById("shopping-list-items"); // New
const API_URL = "https://capsicum.pythonanywhere.com/scan";

let html5QrCode;

// --- 1. BARCODE SCANNER LOGIC ---
if (barcodeBtn) {
  barcodeBtn.addEventListener("click", () => {
    if (readerDiv.style.display === "block") {
      stopScanner();
      return;
    }
    startScanner();
  });
}

function startScanner() {
  readerDiv.style.display = "block";
  barcodeBtn.textContent = "❌ Stop Camera";
  ingredientsBox.value = "Point camera at a barcode...";

  html5QrCode = new Html5Qrcode("reader");

  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  html5QrCode
    .start({ facingMode: "environment" }, config, onScanSuccess)
    .catch((err) => {
      console.error("Camera Error:", err);
      ingredientsBox.value = "Camera error. Please allow permissions.";
      stopScanner();
    });
}

function stopScanner() {
  if (html5QrCode) {
    html5QrCode
      .stop()
      .then(() => {
        html5QrCode.clear();
        readerDiv.style.display = "none";
        barcodeBtn.textContent = "📶 Scan Barcode (Fast)";
      })
      .catch((err) => console.error("Stop failed", err));
  }
}

async function onScanSuccess(decodedText) {
  stopScanner();
  ingredientsBox.value = `Barcode: ${decodedText}. Searching...`;

  const product = await fetchProductDetails(decodedText);

  if (product && product.ingredients) {
    // Fill BOTH Name and Ingredients
    ingredientsBox.value = product.ingredients;
    if (product.name) nameBox.value = product.name;

    scanBtn.click();
  } else {
    ingredientsBox.value = "";
    alert("Product not found. Please use 'Scan Text (OCR)'.");
  }
}

// --- 2. OCR (AI) SCANNER LOGIC ---
if (ocrBtn) {
  ocrBtn.addEventListener("click", () => cameraInput.click());
}

if (cameraInput) {
  cameraInput.addEventListener("change", async (e) => {
    const originalFile = e.target.files[0];
    if (!originalFile) return;

    ocrBtn.textContent = "⏳ Processing...";
    ocrBtn.disabled = true;
    ingredientsBox.value = "AI is reading name & ingredients (~6s)...";

    try {
      const file = await resizeImage(originalFile);

      // UPDATED PROMPT: Ask for JSON to separate Name and Ingredients
      const response = await puter.ai.chat(
        `Look at this food label. Extract: 
         1. The Product Name (brand + type).
         2. The Ingredients List.
         Return ONLY a valid JSON object like this: {"name": "...", "ingredients": "..."}`,
        file
      );

      const content = response.message?.content || response;

      // Parse JSON from AI
      try {
        // AI sometimes puts markdown ```json ... ``` wrapper, strip it
        const cleanJson = content.replace(/```json|```/g, "").trim();
        const data = JSON.parse(cleanJson);

        ingredientsBox.value = data.ingredients || "";
        nameBox.value = data.name || "Unknown Product";
      } catch (jsonErr) {
        // Fallback if AI didn't give strict JSON
        ingredientsBox.value = content;
      }

      scanBtn.click();
    } catch (error) {
      console.error("OCR Error:", error);
      ingredientsBox.value = "Error reading text.";
    } finally {
      ocrBtn.textContent = "📸 Scan Text (OCR)";
      ocrBtn.disabled = false;
      cameraInput.value = "";
    }
  });
}

// --- 3. SHOPPING LIST LOGIC (NEW) ---

// Load list on startup
document.addEventListener("DOMContentLoaded", renderShoppingList);

// Add Button Logic
addListBtn.addEventListener("click", () => {
  const name = nameBox.value.trim() || "Unknown Item";
  const ingredients = ingredientsBox.value.trim(); // Optional: store this?

  // Save to LocalStorage
  const list = JSON.parse(localStorage.getItem("shoppingList") || "[]");
  list.push({ id: Date.now(), name: name });
  localStorage.setItem("shoppingList", JSON.stringify(list));

  renderShoppingList();
  alert(`Added "${name}" to list!`);
});

function renderShoppingList() {
  const list = JSON.parse(localStorage.getItem("shoppingList") || "[]");
  listContainer.innerHTML = "";

  if (list.length === 0) {
    listContainer.innerHTML =
      '<p style="color:#999; font-style:italic;">List is empty.</p>';
    return;
  }

  list.forEach((item) => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `
            <span>${item.name}</span>
            <button class="delete-btn" onclick="deleteItem(${item.id})">🗑</button>
        `;
    listContainer.appendChild(div);
  });
}

// Make delete function global so onclick works
window.deleteItem = function (id) {
  let list = JSON.parse(localStorage.getItem("shoppingList") || "[]");
  list = list.filter((item) => item.id !== id);
  localStorage.setItem("shoppingList", JSON.stringify(list));
  renderShoppingList();
};

// --- 4. MAIN SCAN LOGIC ---
scanBtn.addEventListener("click", checkIngredients);

async function checkIngredients() {
  const ingredients = ingredientsBox.value.trim();
  if (!ingredients) return;

  scanBtn.textContent = "Checking...";
  scanBtn.disabled = true;
  document.getElementById("results").innerHTML = "";
  addListBtn.style.display = "none"; // Hide add button while scanning

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients: ingredients }),
    });

    const data = await response.json();
    displayResults(data);

    // Show "Add to List" button after successful scan
    addListBtn.style.display = "block";
  } catch (error) {
    document.getElementById("results").innerHTML =
      '<p class="error">Error connecting to server</p>';
  } finally {
    scanBtn.textContent = "Scan Ingredients";
    scanBtn.disabled = false;
  }
}

function displayResults(data) {
  // ... (Your existing displayResults function remains unchanged) ...
  // Paste the SAME displayResults function from previous version here
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

// --- 5. HELPERS ---
async function fetchProductDetails(barcode) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,ingredients_text,ingredients_text_en,image_front_small_url,status`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Capzicum - Web - Version 1.0 - www.capzicum.com",
      },
    });

    if (!response.ok) return null;
    const data = await response.json();

    if (data.status === 1 && data.product) {
      return {
        name: data.product.product_name || "Unknown Product",
        ingredients:
          data.product.ingredients_text_en ||
          data.product.ingredients_text ||
          "",
        image: data.product.image_front_small_url || "",
      };
    }
    return null;
  } catch (error) {
    console.error("OFF API Error:", error);
    return null;
  }
}

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
        }
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
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function checkDevice() {
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  const toolsDiv = document.getElementById("mobile-tools");
  const msgDiv = document.getElementById("desktop-msg");

  if (isMobile) {
    if (toolsDiv) toolsDiv.style.display = "flex";
    if (msgDiv) msgDiv.style.display = "none";
  } else {
    if (toolsDiv) toolsDiv.style.display = "none";
    if (msgDiv) msgDiv.style.display = "block";
  }
}
checkDevice();
