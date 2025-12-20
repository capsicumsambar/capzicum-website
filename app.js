const API_URL = 'https://capzicum.pythonanywhere.com/check';

document.getElementById('scan-btn').addEventListener('click', checkProduct);
document.getElementById('barcode').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkProduct();
});

async function checkProduct() {
    const barcode = document.getElementById('barcode').value.trim();
    if (!barcode) return;

    const resultSection = document.getElementById('result');
    const statusDiv = document.getElementById('status');
    const productNameDiv = document.getElementById('product-name');
    const flaggedDiv = document.getElementById('flagged-ingredients');
    const addBtn = document.getElementById('add-to-list');

    statusDiv.textContent = 'Checking...';
    statusDiv.className = '';
    resultSection.classList.remove('hidden');
    productNameDiv.textContent = '';
    flaggedDiv.textContent = '';
    addBtn.classList.add('hidden');

    try {
        const response = await fetch(`${API_URL}?barcode=${barcode}`);
        const data = await response.json();

        if (data.error) {
            statusDiv.textContent = data.error;
            statusDiv.className = 'unknown';
            return;
        }

        productNameDiv.textContent = data.product_name || 'Unknown Product';

        if (data.status === 'safe') {
            statusDiv.textContent = '✅ Vegetarian Safe';
            statusDiv.className = 'safe';
        } else if (data.status === 'not_safe') {
            statusDiv.textContent = '❌ Not Vegetarian';
            statusDiv.className = 'unsafe';
            if (data.flagged_ingredients?.length) {
                flaggedDiv.textContent = 'Contains: ' + data.flagged_ingredients.join(', ');
            }
        } else {
            statusDiv.textContent = '⚠️ Unknown - Check manually';
            statusDiv.className = 'unknown';
        }

        // Show add to list button for safe products
        if (data.status === 'safe') {
            addBtn.classList.remove('hidden');
            addBtn.onclick = () => addToList(barcode, data.product_name);
        }

    } catch (error) {
        statusDiv.textContent = 'Error connecting to server';
        statusDiv.className = 'unknown';
    }
}

function addToList(barcode, productName) {
    const list = JSON.parse(localStorage.getItem('shoppingList') || '[]');
    
    if (!list.some(item => item.barcode === barcode)) {
        list.push({ barcode, productName, addedAt: new Date().toISOString() });
        localStorage.setItem('shoppingList', JSON.stringify(list));
        alert('Added to shopping list!');
    } else {
        alert('Already in your list');
    }
}
