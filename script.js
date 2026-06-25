// ==========================================
// 1. Theme Configuration Management
// ==========================================
const themeToggle = document.getElementById('theme-toggle');
const rootElement = document.documentElement;

const currentSavedTheme = localStorage.getItem('theme') || 'light';
if (currentSavedTheme === 'dark') {
    rootElement.setAttribute('data-theme', 'dark');
    themeToggle.textContent = '🌙';
}

themeToggle.addEventListener('click', () => {
    const activeTheme = rootElement.getAttribute('data-theme');
    if (activeTheme === 'dark') {
        rootElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeToggle.textContent = '☀️';
    } else {
        rootElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggle.textContent = '🌙';
    }
});

// ==========================================
// 2. Tab Navigation System Control
// ==========================================
const tabUnit = document.getElementById('tab-unit');
const tabCurrency = document.getElementById('tab-currency');
const unitSection = document.getElementById('unit-section');
const currencySection = document.getElementById('currency-section');

tabUnit.addEventListener('click', () => {
    tabUnit.classList.add('active');
    tabCurrency.classList.remove('active');
    unitSection.classList.remove('hidden-section');
    currencySection.classList.add('hidden-section');
});

tabCurrency.addEventListener('click', () => {
    tabCurrency.classList.add('active');
    tabUnit.classList.remove('active');
    currencySection.classList.remove('hidden-section');
    unitSection.classList.add('hidden-section');
    
    // Automatically trigger initial live data synchronization if clean
    if (Object.keys(exchangeRates).length === 0) {
        fetchGlobalExchangeRates();
    }
});

// ==========================================
// 3. Mathematical Metric / Unit Converter Module
// ==========================================
const unitDatabase = {
    length: { Meter: 1, Kilometer: 1000, Centimeter: 0.01, Inch: 0.0254, Foot: 0.3048, Mile: 1609.344 },
    weight: { Gram: 1, Kilogram: 1000, Pound: 453.59237, Ounce: 28.3495237 },
    temperature: { Celsius: 'C', Fahrenheit: 'F', Kelvin: 'K' },
    time: { Seconds: 1, Minutes: 60, Hours: 3600, Days: 86400 },
    speed: { "m/s": 1, "km/h": 0.27777778, "mph": 0.44704 }
};

const categorySelect = document.getElementById('unit-category');
const unitFromSelect = document.getElementById('unit-from');
const unitToSelect = document.getElementById('unit-to');
const unitValueInput = document.getElementById('unit-value');
const convertUnitBtn = document.getElementById('convert-unit-btn');
const unitResultText = document.getElementById('unit-result-text');

function buildUnitDropdownOptions(categoryKey) {
    const explicitUnits = Object.keys(unitDatabase[categoryKey]);
    unitFromSelect.innerHTML = '';
    unitToSelect.innerHTML = '';
    
    explicitUnits.forEach(unit => {
        unitFromSelect.add(new Option(unit, unit));
        unitToSelect.add(new Option(unit, unit));
    });
    
    if (explicitUnits.length > 1) unitToSelect.selectedIndex = 1;
}

categorySelect.addEventListener('change', (e) => {
    buildUnitDropdownOptions(e.target.value);
    unitResultText.textContent = 'Result: ---';
});

// Setup conversion engine presets
buildUnitDropdownOptions('length');

function executeTemperatureFormula(val, entryUnit, exitUnit) {
    if (entryUnit === exitUnit) return val;
    let baselineCelsius;
    
    if (entryUnit === 'Celsius') baselineCelsius = val;
    else if (entryUnit === 'Fahrenheit') baselineCelsius = (val - 32) * 5/9;
    else if (entryUnit === 'Kelvin') baselineCelsius = val - 273.15;
    
    if (exitUnit === 'Celsius') return baselineCelsius;
    if (exitUnit === 'Fahrenheit') return (baselineCelsius * 9/5) + 32;
    if (exitUnit === 'Kelvin') return baselineCelsius + 273.15;
}

convertUnitBtn.addEventListener('click', () => {
    const activeCategory = categorySelect.value;
    const fromUnit = unitFromSelect.value;
    const toUnit = unitToSelect.value;
    const initialNumericVal = parseFloat(unitValueInput.value);

    if (isNaN(initialNumericVal)) {
        unitResultText.textContent = "Please input a valid numeric value";
        return;
    }

    let calculatedOutput;
    if (activeCategory === 'temperature') {
        calculatedOutput = executeTemperatureFormula(initialNumericVal, fromUnit, toUnit);
    } else {
        const structuralBaseConversionRate = unitDatabase[activeCategory][fromUnit];
        const targetOutputConversionRate = unitDatabase[activeCategory][toUnit];
        calculatedOutput = (initialNumericVal * structuralBaseConversionRate) / targetOutputConversionRate;
    }

    // Limit floating inaccuracies down smoothly
    const normalizedCleanResult = parseFloat(calculatedOutput.toFixed(6));
    unitResultText.textContent = `Result: ${normalizedCleanResult} ${toUnit}`;
});

// ==========================================
// 4. Financial Currency Dynamic Exchange Module
// ==========================================
const BASE_RATE_API = 'https://open.er-api.com/v6/latest/USD';
let exchangeRates = {};

const currencyAmount = document.getElementById('currency-amount');
const currencyFrom = document.getElementById('currency-from');
const currencyTo = document.getElementById('currency-to');
const swapCurrencyBtn = document.getElementById('swap-currency-btn');
const convertCurrencyBtn = document.getElementById('convert-currency-btn');
const currencyResultText = document.getElementById('currency-result-text');
const currencyUpdatedText = document.getElementById('currency-updated-text');
const currencyLoadingIndicator = document.getElementById('currency-loading');

async function fetchGlobalExchangeRates() {
    try {
        currencyLoadingIndicator.classList.remove('hidden-section');
        currencyResultText.classList.add('hidden-section');
        
        const feedback = await fetch(BASE_RATE_API);
        if (!feedback.ok) throw new Error('Network latency or api node error');
        
        const payload = await feedback.json();
        
        if (payload.result === 'success') {
            exchangeRates = payload.rates;
            
            // Extract selected historical tokens to maintain selected choice states
            const historicFrom = currencyFrom.value;
            const historicTo = currencyTo.value;
            
            currencyFrom.innerHTML = '';
            currencyTo.innerHTML = '';
            
            // Build dynamic drop options with every world currency provided directly by API
            Object.keys(exchangeRates).sort().forEach(currencyCode => {
                currencyFrom.add(new Option(currencyCode, currencyCode));
                currencyTo.add(new Option(currencyCode, currencyCode));
            });
            
            // Reset to historical choices or standard defaults safely
            currencyFrom.value = exchangeRates[historicFrom] ? historicFrom : 'USD';
            currencyTo.value = exchangeRates[historicTo] ? historicTo : 'INR';
            
            const localizedTimestamp = new Date(payload.time_last_update_unix * 1000);
            currencyUpdatedText.textContent = `Rates Live Updated: ${localizedTimestamp.toLocaleString()}`;
        }
    } catch (err) {
        currencyResultText.textContent = "API network connection error. Try again.";
    } finally {
        currencyLoadingIndicator.classList.add('hidden-section');
        currencyResultText.classList.remove('hidden-section');
    }
}

swapCurrencyBtn.addEventListener('click', () => {
    const transferBuffer = currencyFrom.value;
    currencyFrom.value = currencyTo.value;
    currencyTo.value = transferBuffer;
});

convertCurrencyBtn.addEventListener('click', () => {
    const rawValueToConvert = parseFloat(currencyAmount.value);
    const primarySourceCurrency = currencyFrom.value;
    const targetDestinationCurrency = currencyTo.value;

    if (isNaN(rawValueToConvert)) {
        currencyResultText.textContent = "Please input a valid target amount";
        return;
    }

    if (!exchangeRates[primarySourceCurrency] || !exchangeRates[targetDestinationCurrency]) {
        currencyResultText.textContent = "Synchronizing exchange table variables...";
        fetchGlobalExchangeRates().then(() => convertCurrencyBtn.click());
        return;
    }

    // Convert via USD anchor configuration natively
    const processingConversionAmount = (rawValueToConvert / exchangeRates[primarySourceCurrency]) * exchangeRates[targetDestinationCurrency];
    
    // Auto-localize currency formatting
    try {
        const structuredFormatter = new Intl.NumberFormat(navigator.language, {
            style: 'currency',
            currency: targetDestinationCurrency
        });
        currencyResultText.textContent = structuredFormatter.format(processingConversionAmount);
    } catch (e) {
        // Fallback execution if browser local files lack the target currency configuration natively
        currencyResultText.textContent = `${processingConversionAmount.toFixed(2)} ${targetDestinationCurrency}`;
    }
});