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
