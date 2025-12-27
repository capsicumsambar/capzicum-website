// Global Elements
const ocrBtn = document.getElementById("ocr-btn");
const cameraInput = document.getElementById("camera-input");
const ingredientsBox = document.getElementById("ingredients");
const scanBtn = document.getElementById("scan-btn");
const barcodeBtn = document.getElementById("barcode-btn");
const readerDiv = document.getElementById("reader");
const API_URL = "https://capsicum.pythonanywhere.com/scan";

let html5QrCode; // Stores the scanner instance

// --- 1. BARCODE SCANNER LOGIC (ROBUST MODE) ---
if (barcodeBtn) {
  barcodeBtn.addEventListener("click", () => {
    // Toggle: If box is open, close it. If closed, open it.
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

  // CONFIG: Reverted to square box, standard speed. More reliable.
  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
  };

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
  ingredientsBox.value = `Barcode: ${decodedText}. Searching database...`;

  const product = await fetchProductDetails(decodedText);

  if (product && product.ingredients) {
    ingredientsBox.value = product.ingredients;
    // Auto-click the scan button
    scanBtn.click();
  } else {
    ingredientsBox.value = "";
    alert("Product not found. Please use 'Read Label' to scan text manually.");
  }
}

// --- 2. OCR (AI) SCANNER LOGIC ---
if (ocrBtn) {
  ocrBtn.addEventListener("click", () => {
    cameraInput.click();
  });
}

if (cameraInput) {
  cameraInput.addEventListener("change", async (e) => {
    const originalFile = e.target.files[0];
    if (!originalFile) return;

    // UI Feedback
    ocrBtn.textContent = "⏳ Compressing...";
    ocrBtn.disabled = true;
    ingredientsBox.value = "Preparing image...";

    try {
      // A. Resize (Speed Boost)
      const file = await resizeImage(originalFile);

      ocrBtn.textContent = "⏳ Reading...";
      ingredientsBox.value = "Scanning label...";

      // B. Send to Puter AI
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
      ocrBtn.textContent = "📸 Read Label (Backup)";
      ocrBtn.disabled = false;
      cameraInput.value = "";
    }
  });
}

// --- 3. MAIN SCAN LOGIC (Existing Backend) ---
scanBtn.addEventListener("click", checkIngredients);

async function checkIngredients() {
  const ingredients = ingredientsBox.value.trim();
  if (!ingredients) return;

  scanBtn.textContent = "Checking...";
  scanBtn.disabled = true;
  document.getElementById("results").innerHTML = "";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients: ingredients }),
    });

    const data = await response.json();
    displayResults(data);
  } catch (error) {
    document.getElementById("results").innerHTML =
      '<p class="error">Error connecting to server</p>';
  } finally {
    scanBtn.textContent = "Scan Ingredients";
    scanBtn.disabled = false;
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

// --- 4. HELPERS ---

// Helper: Fetch details from OpenFoodFacts
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

// Helper: Resize image
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

// Helper: Check Device (Hide scanners on Desktop)
function checkDevice() {
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  const toolsDiv = document.getElementById("mobile-tools");
  const msgDiv = document.getElementById("desktop-msg");

  if (isMobile) {
    // Show tools, hide warning
    if (toolsDiv) toolsDiv.style.display = "flex";
    if (msgDiv) msgDiv.style.display = "none";
  } else {
    // Show warning, hide tools (Default CSS might already do this, but this reinforces it)
    if (toolsDiv) toolsDiv.style.display = "none";
    if (msgDiv) msgDiv.style.display = "block";
  }
}

// Run device check on load
checkDevice();
