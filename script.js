// TasaDiv - Tasas de cambio y convertidor de divisas para Latinoamérica
class CurrencyConverter {
    constructor() {
        this.rates = {};
        this.baseUrl = 'https://api.exchangerate-api.com/v4/latest';
        this.selectedLatamCurrency = null; // Moneda LATAM seleccionada
        this.init();
    }

    async init() {
        await this.loadExchangeRates();
        this.loadCryptoData();
        this.setupEventListeners();
        
        // Actualizar crypto cada 60 segundos
        setInterval(() => this.loadCryptoData(), 60000);
    }

    async loadExchangeRates() {
        try {
            // Cache busting y timeout para mejor UX
            const timestamp = Date.now();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            // Obtener tasas con base USD para múltiples monedas
            const usdResponse = await fetch(`${this.baseUrl}/USD?t=${timestamp}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            const usdData = await usdResponse.json();

            // Monedas LATAM principales
            const latamCurrencies = {
                'VES': { name: 'Bolívar', symbol: 'Bs' },
                'ARS': { name: 'Peso Argentino', symbol: '$' },
                'BRL': { name: 'Real Brasileño', symbol: 'R$' },
                'CLP': { name: 'Peso Chileno', symbol: '$' },
                'COP': { name: 'Peso Colombiano', symbol: '$' },
                'MXN': { name: 'Peso Mexicano', symbol: '$' },
                'PEN': { name: 'Sol Peruano', symbol: 'S/' },
                'UYU': { name: 'Peso Uruguayo', symbol: '$' },
                'PYG': { name: 'Guaraní Paraguayo', symbol: '₲' },
                'BOB': { name: 'Boliviano', symbol: 'Bs' },
                'CRC': { name: 'Colón Costarricense', symbol: '₡' },
                'GTQ': { name: 'Quetzal Guatemalteco', symbol: 'Q' },
                'HNL': { name: 'Lempira Hondureño', symbol: 'L' },
                'NIO': { name: 'Córdoba Nicaragüense', symbol: 'C$' },
                'PAB': { name: 'Balboa Panameño', symbol: 'B/.' },
                'SVC': { name: 'Colón Salvadoreño', symbol: '$' }
            };

            // Almacenar todas las tasas a VES
            this.rates = {};
            this.latamCurrencies = latamCurrencies;

            for (const [code, info] of Object.entries(latamCurrencies)) {
                if (usdData.rates[code]) {
                    this.rates[code] = usdData.rates[code] * usdData.rates.VES;
                }
            }

            // Almacenar tasa USD a VES para conversiones LATAM
            this.rates.USD = usdData.rates.VES;

            // Almacenar tasa USD a EUR para conversiones directas USD/EUR
            // usdData.rates.EUR contiene la tasa: 1 USD = X EUR
            if (!usdData.rates.EUR) {
                // Si EUR no está en la respuesta, obtenerla desde API EUR
                const eurResponse = await fetch(`${this.baseUrl}/EUR`);
                const eurData = await eurResponse.json();
                // Calcular tasa USD/EUR desde EUR base: 1 EUR = Y USD, entonces 1 USD = 1/Y EUR
                this.rates.EUR = 1 / eurData.rates.USD;
            } else {
                // Almacenar directamente la tasa USD/EUR (1 USD = X EUR)
                this.rates.EUR = usdData.rates.EUR;
            }

            this.updateDisplay();
            this.renderLatamRates();
        } catch (error) {
            console.error('Error cargando tasas de cambio:', error);
            this.showError('Error al cargar las tasas de cambio. Intente recargar la página.');
        }
    }

    updateDisplay() {
        // Esta función ya no es necesaria ya que eliminamos la sección "Current Exchange Rates"
        // Se mantiene vacía para evitar errores si se llama desde otros lugares
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    setupEventListeners() {
        // Inputs del convertidor
        const latamInput = document.getElementById('latam-input');
        const usdInput = document.getElementById('usd-input');
        const eurInput = document.getElementById('eur-input');

        // Botones
        const clearBtn = document.getElementById('clear-btn');

        // Event listeners para inputs
        if (latamInput) latamInput.addEventListener('input', () => this.convertFromLatam());
        usdInput.addEventListener('input', () => this.convertFromUSD());
        eurInput.addEventListener('input', () => this.convertFromEUR());

        // Event listeners para botones
        clearBtn.addEventListener('click', () => this.clearAll());
    }

    convertFromUSD() {
        const usdValue = parseFloat(document.getElementById('usd-input').value) || 0;

        if (usdValue > 0) {
            // Convertir USD a EUR (EUR está en formato 1 USD = X EUR)
            const eurValue = usdValue * this.rates.EUR;
            document.getElementById('eur-input').value = eurValue.toFixed(4);

            // Convertir USD a moneda LATAM seleccionada (tasa está en formato 1 USD = X LATAM)
            if (this.selectedLatamCurrency) {
                const latamValue = usdValue * this.rates[this.selectedLatamCurrency];
                document.getElementById('latam-input').value = latamValue.toFixed(2);
            }
        } else {
            document.getElementById('eur-input').value = '';
            if (this.selectedLatamCurrency) {
                document.getElementById('latam-input').value = '';
            }
        }
    }

    convertFromEUR() {
        const eurValue = parseFloat(document.getElementById('eur-input').value) || 0;

        if (eurValue > 0) {
            // Convertir EUR a USD (EUR está en formato 1 USD = X EUR, entonces 1 EUR = 1/X USD)
            const usdValue = eurValue / this.rates.EUR;
            document.getElementById('usd-input').value = usdValue.toFixed(4);

            // Convertir EUR a moneda LATAM seleccionada
            // Primero EUR → USD, luego USD → LATAM
            if (this.selectedLatamCurrency) {
                const latamValue = usdValue * this.rates[this.selectedLatamCurrency];
                document.getElementById('latam-input').value = latamValue.toFixed(2);
            }
        } else {
            document.getElementById('usd-input').value = '';
            if (this.selectedLatamCurrency) {
                document.getElementById('latam-input').value = '';
            }
        }
    }

    clearAll() {
        const inputsToClear = ['usd-input', 'eur-input'];
        if (this.selectedLatamCurrency) {
            inputsToClear.push('latam-input');
        }
        this.clearInputs(inputsToClear);
    }

    clearInputs(inputIds) {
        inputIds.forEach(id => {
            document.getElementById(id).value = '';
        });
    }

    async loadCryptoData() {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
            const data = await response.json();
            
            // Bitcoin
            const btcPrice = data.bitcoin.usd;
            const btcChange = data.bitcoin.usd_24h_change;
            document.getElementById('btc-price').textContent = `$${btcPrice.toLocaleString('en-US', {maximumFractionDigits: 0})}`;
            const btcChangeEl = document.getElementById('btc-change');
            btcChangeEl.textContent = `${btcChange >= 0 ? '+' : ''}${btcChange.toFixed(2)}%`;
            btcChangeEl.className = `market-change ${btcChange >= 0 ? 'positive' : 'negative'}`;
            
            // Ethereum
            const ethPrice = data.ethereum.usd;
            const ethChange = data.ethereum.usd_24h_change;
            document.getElementById('eth-price').textContent = `$${ethPrice.toLocaleString('en-US', {maximumFractionDigits: 0})}`;
            const ethChangeEl = document.getElementById('eth-change');
            ethChangeEl.textContent = `${ethChange >= 0 ? '+' : ''}${ethChange.toFixed(2)}%`;
            ethChangeEl.className = `market-change ${ethChange >= 0 ? 'positive' : 'negative'}`;
            
            // Calcular promedio LATAM
            this.updateLatamStats();
        } catch (error) {
            console.error('Error loading crypto data:', error);
            document.getElementById('btc-price').textContent = 'N/A';
            document.getElementById('eth-price').textContent = 'N/A';
        }
    }
    
    updateLatamStats() {
        if (!this.rates || Object.keys(this.rates).length === 0) return;
        
        // Calcular promedio de todas las monedas LATAM
        const latamRates = Object.entries(this.rates)
            .filter(([code]) => this.latamCurrencies && this.latamCurrencies[code])
            .map(([_, rate]) => rate);
        
        if (latamRates.length > 0) {
            const average = latamRates.reduce((a, b) => a + b, 0) / latamRates.length;
            document.getElementById('latam-avg').textContent = average.toLocaleString('en-US', {maximumFractionDigits: 2});
        }
    }

    renderLatamRates() {
        const grid = document.getElementById('latam-rates-grid');
        if (!grid || !this.latamCurrencies) return;

        grid.innerHTML = '';

        for (const [code, info] of Object.entries(this.latamCurrencies)) {
            if (this.rates[code]) { // Incluir todas las monedas LATAM
                const card = document.createElement('div');
                card.className = 'latam-rate-card';
                card.setAttribute('data-currency', code);
                card.innerHTML = `
                    <div class="currency-code">${code} ${info.name}</div>
                    <div class="rate-value">${this.formatCurrency(this.rates[code])}</div>
                    <div class="click-hint">Click para convertir</div>
                `;
                // Añadir event listener para convertir al hacer click
                card.addEventListener('click', (e) => {
                    this.convertFromLatamCard(code);
                    // Efecto visual de feedback
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        card.style.transform = '';
                    }, 150);
                });
                grid.appendChild(card);
            }
        }
        
        // Actualizar stats después de renderizar
        this.updateLatamStats();
    }


    convertFromLatamCard(currencyCode) {
        // Seleccionar la moneda LATAM como base para conversiones
        this.selectedLatamCurrency = currencyCode;

        // Actualizar las etiquetas del convertidor
        this.updateConverterLabels();

        // Habilitar el input de LATAM
        const latamInput = document.getElementById('latam-input');
        if (latamInput) {
            latamInput.disabled = false;
            latamInput.value = '1.00'; // Valor por defecto
        }

        // Convertir 1 unidad de la moneda seleccionada a USD y EUR
        this.convertFromLatam();
    }

    updateConverterLabels() {
        const latamTitle = document.getElementById('latam-title');
        const latamLabel = document.getElementById('latam-label');

        if (this.selectedLatamCurrency && latamTitle && latamLabel) {
            const currencyInfo = this.latamCurrencies[this.selectedLatamCurrency];
            latamTitle.textContent = currencyInfo.name;
            latamLabel.textContent = this.selectedLatamCurrency;
        } else if (latamTitle && latamLabel) {
            latamTitle.textContent = 'Seleccionar moneda';
            latamLabel.textContent = '---';
        }
    }

    convertFromLatam() {
        if (!this.selectedLatamCurrency) return;

        const latamValue = parseFloat(document.getElementById('latam-input').value) || 0;

        if (latamValue > 0) {
            // Convertir de LATAM a USD (la tasa ya está en formato 1 USD = X LATAM)
            const usdValue = latamValue / this.rates[this.selectedLatamCurrency];
            
            // Convertir USD a EUR (EUR está en formato 1 USD = X EUR)
            const eurValue = usdValue * this.rates.EUR;

            document.getElementById('usd-input').value = usdValue.toFixed(4);
            document.getElementById('eur-input').value = eurValue.toFixed(4);
        } else {
            document.getElementById('usd-input').value = '';
            document.getElementById('eur-input').value = '';
        }
    }

    showError(message) {
        // Crear elemento de error temporal
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            font-weight: 500;
        `;
        errorDiv.textContent = message;

        document.body.appendChild(errorDiv);

        // Remover después de 5 segundos
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Estado de carga para las tasas
document.addEventListener('DOMContentLoaded', () => {
    // Registrar Service Worker para PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registrado:', registration.scope);
            })
            .catch(error => {
                console.log('Error registrando Service Worker:', error);
            });
    }

    // Inicializar la aplicación
    new CurrencyConverter();

    // 🌐 Language Selector
    const langButton = document.getElementById('lang-button');
    const langDropdown = document.getElementById('lang-dropdown');
    const langOptions = document.querySelectorAll('.lang-option');
    const currentLangText = document.getElementById('current-lang');

    const translations = {
        en: {
            liveBadge: 'LIVE DATA',
            title: 'TasaDiv',
            subtitle: 'Real-Time Exchange Rates • 18 LATAM Currencies • API-Powered',
            currencies: 'Currencies',
            responseTime: 'Response Time',
            uptime: 'Uptime',
            latamTitle: 'Latin American Currencies',
            realTimeData: 'Real-Time Data',
            clickHint: 'Click to convert',
            marketOverview: 'Market Overview',
            marketLive: 'Live',
            bitcoin: 'Bitcoin',
            ethereum: 'Ethereum',
            latamAverage: 'LATAM Average',
            perUsd: 'Per USD',
            converter: 'Currency Converter',
            instantConversion: 'Instant Conversion • Bidirectional Exchange',
            selectCurrency: 'Select Currency',
            clickAnyCurrency: 'Click any LATAM currency below',
            clearAll: 'Clear All',
            footer: 'All rights reserved.',
            pwaEnabled: 'PWA Enabled',
            apiPowered: 'API-Powered',
            realTime: 'Real-Time'
        },
        es: {
            liveBadge: 'DATOS EN VIVO',
            title: 'TasaDiv',
            subtitle: 'Tasas de Cambio en Tiempo Real • 18 Monedas LATAM • Con API',
            currencies: 'Monedas',
            responseTime: 'Tiempo Respuesta',
            uptime: 'Disponibilidad',
            latamTitle: 'Monedas Latinoamericanas',
            realTimeData: 'Datos en Tiempo Real',
            clickHint: 'Click para convertir',
            marketOverview: 'Resumen de Mercado',
            marketLive: 'En Vivo',
            bitcoin: 'Bitcoin',
            ethereum: 'Ethereum',
            latamAverage: 'Promedio LATAM',
            perUsd: 'Por USD',
            converter: 'Convertidor de Divisas',
            instantConversion: 'Conversión Instantánea • Intercambio Bidireccional',
            selectCurrency: 'Seleccionar Moneda',
            clickAnyCurrency: 'Haz click en cualquier moneda LATAM',
            clearAll: 'Limpiar Todo',
            footer: 'Todos los derechos reservados.',
            pwaEnabled: 'PWA Habilitado',
            apiPowered: 'Con API',
            realTime: 'Tiempo Real'
        }
    };

    let currentLang = 'en';

    // Toggle dropdown
    langButton.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        const isOpen = langDropdown.classList.contains('show');
        
        if (!isOpen) {
            // Calcular posición del dropdown dinámicamente
            const buttonRect = langButton.getBoundingClientRect();
            langDropdown.style.top = `${buttonRect.bottom + 6}px`;
            langDropdown.style.right = `${window.innerWidth - buttonRect.right}px`;
        }
        
        langButton.classList.toggle('active');
        langDropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!langButton.contains(e.target) && !langDropdown.contains(e.target)) {
            langButton.classList.remove('active');
            langDropdown.classList.remove('show');
        }
    });

    // Change language
    langOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            const lang = option.dataset.lang;
            if (lang !== currentLang) {
                currentLang = lang;
                currentLangText.textContent = lang.toUpperCase();
                
                // Update active state
                langOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Apply translations
                applyTranslations(lang);
                
                // Close dropdown
                langButton.classList.remove('active');
                langDropdown.classList.remove('show');
            } else {
                // Si es el mismo idioma, solo cerrar dropdown
                langButton.classList.remove('active');
                langDropdown.classList.remove('show');
            }
        });
        
        // También manejar eventos táctiles para móvil
        option.addEventListener('touchend', (e) => {
            e.stopPropagation();
            e.preventDefault();
            option.click(); // Disparar el evento click
        });
    });

    function applyTranslations(lang) {
        const t = translations[lang];
        
        // Banner
        document.querySelector('.banner-badge').textContent = t.liveBadge;
        document.querySelector('.banner-subtitle').textContent = t.subtitle;
        document.querySelectorAll('.metric-label')[0].textContent = t.currencies;
        document.querySelectorAll('.metric-label')[1].textContent = t.responseTime;
        document.querySelectorAll('.metric-label')[2].textContent = t.uptime;
        
        // LATAM panel
        const panelHeader = document.querySelector('.panel-header h3');
        if (panelHeader) panelHeader.textContent = t.latamTitle;
        const panelBadge = document.querySelector('.panel-badge');
        if (panelBadge) panelBadge.textContent = t.realTimeData;
        document.querySelectorAll('.click-hint').forEach(el => {
            el.textContent = t.clickHint;
        });
        
        // Market Overview
        const marketHeader = document.querySelector('.market-header h3');
        if (marketHeader) marketHeader.textContent = t.marketOverview;
        const marketBadge = document.querySelector('.market-badge');
        if (marketBadge) marketBadge.textContent = t.marketLive;
        const marketNames = document.querySelectorAll('.market-name');
        if (marketNames[0]) marketNames[0].textContent = t.bitcoin;
        if (marketNames[1]) marketNames[1].textContent = t.ethereum;
        if (marketNames[2]) marketNames[2].textContent = t.latamAverage;
        const marketLabel = document.querySelector('.market-label');
        if (marketLabel) marketLabel.textContent = t.perUsd;
        
        // Converter
        document.querySelector('.converter h2').textContent = t.converter;
        document.querySelector('.converter .subtitle').textContent = t.instantConversion;
        const latamTitle = document.getElementById('latam-title');
        if (latamTitle && (latamTitle.textContent === 'Select Currency' || latamTitle.textContent === 'Seleccionar Moneda')) {
            latamTitle.textContent = t.selectCurrency;
        }
        const hint = document.querySelector('.hint');
        if (hint) hint.textContent = t.clickAnyCurrency;
        document.getElementById('clear-btn').textContent = t.clearAll;
        
        // Footer
        document.querySelector('footer p').textContent = `© 2025 TasaDiv. ${t.footer}`;
        document.querySelectorAll('.footer-badge')[0].textContent = t.pwaEnabled;
        document.querySelectorAll('.footer-badge')[1].textContent = t.apiPowered;
        document.querySelectorAll('.footer-badge')[2].textContent = t.realTime;
    }

    // Set initial language (English)
    langOptions[0].classList.add('active');
});
