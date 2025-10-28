// Variables globales para almacenar las tasas
let exchangeRates = {
    brlToUsd: 0,
    usdOficialToArs: 0,
    usdTarjetaToArs: 0,
    usdMepToArs: 0, // Dólar MEP/Blue usado por apps de PIX
    impuestosPorcentaje: 65, // 35% PAIS + 30% Ganancias (puede ser ajustado)
    mepPorcentaje: 10, // % sobre el oficial que suele tener el MEP (ajustable)
    lastUpdate: null
};

// Elementos del DOM
const brlInput = document.getElementById('brlAmount');
const arsTarjetaValue = document.getElementById('arsTarjetaValue');
const arsPixValue = document.getElementById('arsPixValue');
const exchangeRatesDiv = document.getElementById('exchangeRates');
const lastUpdateSpan = document.getElementById('lastUpdate');
const comparisonDiv = document.getElementById('comparison');
const comparisonGrid = document.getElementById('comparisonGrid');
const impuestosInput = document.getElementById('impuestosSlider');
const mepInput = document.getElementById('mepSlider');

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
        exchangeRates.usdOficialToArs = data.rates.ARS / data.rates.USD;
        // Calcular dólar tarjeta con impuestos
        exchangeRates.usdTarjetaToArs = exchangeRates.usdOficialToArs * (1 + exchangeRates.impuestosPorcentaje / 100);
        // Calcular dólar MEP (usado por apps de PIX como Belo, DolarApp, Cocos)
        exchangeRates.usdMepToArs = exchangeRates.usdOficialToArs * (1 + exchangeRates.mepPorcentaje / 100);
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
    const brlToArsTarjeta = exchangeRates.brlToUsd * exchangeRates.usdTarjetaToArs;
    const brlToArsMep = exchangeRates.brlToUsd * exchangeRates.usdMepToArs;

    exchangeRatesDiv.innerHTML = `
        <div class="rate-item">
            <span class="rate-label">1 BRL =</span>
            <span class="rate-value">US$ ${exchangeRates.brlToUsd.toFixed(4)}</span>
        </div>
        <div class="rate-item">
            <span class="rate-label">1 USD oficial =</span>
            <span class="rate-value">$ ${exchangeRates.usdOficialToArs.toFixed(2)} ARS</span>
        </div>
        <div class="rate-item mep-rate">
            <span class="rate-label">1 USD MEP/Blue (+${exchangeRates.mepPorcentaje}%) =</span>
            <span class="rate-value">$ ${exchangeRates.usdMepToArs.toFixed(2)} ARS</span>
        </div>
        <div class="rate-item tax-rate">
            <span class="rate-label">1 USD tarjeta (+${exchangeRates.impuestosPorcentaje}%) =</span>
            <span class="rate-value">$ ${exchangeRates.usdTarjetaToArs.toFixed(2)} ARS</span>
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
        arsTarjetaValue.textContent = '$ 0.00';
        arsPixValue.textContent = '$ 0.00';
        comparisonDiv.style.display = 'none';
        document.getElementById('savingsInfo').style.display = 'none';
        return;
    }

    // BRL → USD
    const usdAmount = brlAmount * exchangeRates.brlToUsd;

    // USD → ARS (con dólar tarjeta)
    const arsTarjetaAmount = usdAmount * exchangeRates.usdTarjetaToArs;

    // USD → ARS (con dólar MEP para PIX)
    const arsMepAmount = usdAmount * exchangeRates.usdMepToArs;

    // Calcular ahorro
    const ahorro = arsTarjetaAmount - arsMepAmount;
    const ahorroPorcentaje = ((ahorro / arsTarjetaAmount) * 100).toFixed(1);

    // Mostrar resultados
    arsTarjetaValue.textContent = `$ ${arsTarjetaAmount.toFixed(2)}`;
    arsPixValue.textContent = `$ ${arsMepAmount.toFixed(2)}`;

    // Mostrar ahorro
    const savingsDiv = document.getElementById('savingsInfo');
    if (ahorro > 0) {
        savingsDiv.innerHTML = `
            <div class="savings-highlight">
                💰 Ahorrás <strong>$ ${ahorro.toFixed(2)} ARS</strong> (${ahorroPorcentaje}%) pagando con PIX
            </div>
        `;
        savingsDiv.style.display = 'block';
    } else {
        savingsDiv.style.display = 'none';
    }

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
        const arsTarjeta = usd * exchangeRates.usdTarjetaToArs;
        const arsPix = usd * exchangeRates.usdMepToArs;
        return `
            <div class="comparison-item">
                <div class="comparison-brl">R$ ${amount}</div>
                <div class="comparison-methods">
                    <div class="method-price">
                        <span class="method-icon">💳</span>
                        <span class="method-value">$ ${arsTarjeta.toFixed(2)}</span>
                    </div>
                    <div class="method-price pix">
                        <span class="method-icon">📱</span>
                        <span class="method-value">$ ${arsPix.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    comparisonDiv.style.display = 'block';
}

// Actualizar porcentaje de impuestos
function updateImpuestos(newPercentage) {
    exchangeRates.impuestosPorcentaje = parseFloat(newPercentage);
    exchangeRates.usdTarjetaToArs = exchangeRates.usdOficialToArs * (1 + exchangeRates.impuestosPorcentaje / 100);
    displayExchangeRates();
    calculateConversion();
}

// Actualizar porcentaje de MEP
function updateMep(newPercentage) {
    exchangeRates.mepPorcentaje = parseFloat(newPercentage);
    exchangeRates.usdMepToArs = exchangeRates.usdOficialToArs * (1 + exchangeRates.mepPorcentaje / 100);
    displayExchangeRates();
    calculateConversion();
}

// Event listeners
brlInput.addEventListener('input', calculateConversion);

if (impuestosInput) {
    impuestosInput.addEventListener('input', (e) => {
        updateImpuestos(e.target.value);
        document.getElementById('impuestosValue').textContent = e.target.value + '%';
    });
}

if (mepInput) {
    mepInput.addEventListener('input', (e) => {
        updateMep(e.target.value);
        document.getElementById('mepValue').textContent = e.target.value + '%';
    });
}

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
