// Variables globales para almacenar las tasas
let exchangeRates = {
    brlToUsd: 0,
    usdToArs: 0,
    lastUpdate: null
};

// Elementos del DOM
const brlInput = document.getElementById('brlAmount');
const usdValue = document.getElementById('usdValue');
const arsValue = document.getElementById('arsValue');
const exchangeRatesDiv = document.getElementById('exchangeRates');
const lastUpdateSpan = document.getElementById('lastUpdate');
const comparisonDiv = document.getElementById('comparison');
const comparisonGrid = document.getElementById('comparisonGrid');

// Obtener tasas de cambio
async function fetchExchangeRates() {
    try {
        // Usando API gratuita de tasas de cambio
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/BRL');

        if (!response.ok) {
            throw new Error('Error al obtener tasas de cambio');
        }

        const data = await response.json();

        exchangeRates.brlToUsd = data.rates.USD;
        exchangeRates.usdToArs = data.rates.ARS / data.rates.USD;
        exchangeRates.lastUpdate = new Date();

        displayExchangeRates();
        updateLastUpdateTime();

        // Si hay un valor en el input, recalcular
        if (brlInput.value) {
            calculateConversion();
        }

        return true;
    } catch (error) {
        console.error('Error:', error);
        exchangeRatesDiv.innerHTML = `
            <div class="error">
                <p>⚠️ Error al cargar tasas de cambio</p>
                <button onclick="fetchExchangeRates()">Reintentar</button>
            </div>
        `;
        return false;
    }
}

// Mostrar tasas de cambio
function displayExchangeRates() {
    const brlToArsDirecto = exchangeRates.brlToUsd * exchangeRates.usdToArs;

    exchangeRatesDiv.innerHTML = `
        <div class="rate-item">
            <span class="rate-label">1 BRL =</span>
            <span class="rate-value">US$ ${exchangeRates.brlToUsd.toFixed(4)}</span>
        </div>
        <div class="rate-item">
            <span class="rate-label">1 USD =</span>
            <span class="rate-value">$ ${exchangeRates.usdToArs.toFixed(2)} ARS</span>
        </div>
        <div class="rate-item highlight">
            <span class="rate-label">1 BRL =</span>
            <span class="rate-value">$ ${brlToArsDirecto.toFixed(2)} ARS</span>
        </div>
    `;
}

// Actualizar tiempo de última actualización
function updateLastUpdateTime() {
    if (exchangeRates.lastUpdate) {
        const time = exchangeRates.lastUpdate.toLocaleTimeString('es-AR');
        lastUpdateSpan.textContent = time;
    }
}

// Calcular conversión
function calculateConversion() {
    const brlAmount = parseFloat(brlInput.value) || 0;

    if (brlAmount <= 0) {
        usdValue.textContent = 'US$ 0.00';
        arsValue.textContent = '$ 0.00';
        comparisonDiv.style.display = 'none';
        return;
    }

    // BRL → USD
    const usdAmount = brlAmount * exchangeRates.brlToUsd;

    // USD → ARS
    const arsAmount = usdAmount * exchangeRates.usdToArs;

    // Mostrar resultados
    usdValue.textContent = `US$ ${usdAmount.toFixed(2)}`;
    arsValue.textContent = `$ ${arsAmount.toFixed(2)}`;

    // Mostrar comparaciones si el valor es mayor a 0
    if (brlAmount > 0) {
        showComparisons(brlAmount);
    }
}

// Mostrar comparaciones rápidas
function showComparisons(baseAmount) {
    const commonAmounts = [1, 5, 10, 20, 50, 100];

    comparisonGrid.innerHTML = commonAmounts.map(amount => {
        const usd = amount * exchangeRates.brlToUsd;
        const ars = usd * exchangeRates.usdToArs;
        return `
            <div class="comparison-item">
                <div class="comparison-brl">R$ ${amount}</div>
                <div class="comparison-ars">$ ${ars.toFixed(2)}</div>
            </div>
        `;
    }).join('');

    comparisonDiv.style.display = 'block';
}

// Event listeners
brlInput.addEventListener('input', calculateConversion);

// Permitir solo números y punto decimal
brlInput.addEventListener('keypress', (e) => {
    const char = String.fromCharCode(e.which);
    if (!/[\d.]/.test(char)) {
        e.preventDefault();
    }
    // Solo un punto decimal
    if (char === '.' && brlInput.value.includes('.')) {
        e.preventDefault();
    }
});

// Inicializar la aplicación
async function init() {
    console.log('Iniciando aplicación...');
    const success = await fetchExchangeRates();

    if (success) {
        console.log('Tasas de cambio cargadas correctamente');
        // Actualizar tasas cada 5 minutos
        setInterval(fetchExchangeRates, 5 * 60 * 1000);
    }
}

// Cargar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
