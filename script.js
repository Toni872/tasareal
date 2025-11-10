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
        this.setupEventListeners();
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

            // Asegurar USD y EUR están incluidos
            this.rates.USD = usdData.rates.VES;

            // Obtener EUR si no está en la respuesta USD
            if (!usdData.rates.EUR) {
                const eurResponse = await fetch(`${this.baseUrl}/EUR`);
                const eurData = await eurResponse.json();
                this.rates.EUR = eurData.rates.VES;
            } else {
                this.rates.EUR = usdData.rates.EUR * usdData.rates.VES;
            }

            this.updateDisplay();
            this.renderLatamRates();
        } catch (error) {
            console.error('Error cargando tasas de cambio:', error);
            this.showError('Error al cargar las tasas de cambio. Intente recargar la página.');
        }
    }

    updateDisplay() {
        const usdAmount = document.getElementById('usd-amount');
        const eurAmount = document.getElementById('eur-amount');

        if (usdAmount && this.rates.USD) {
            usdAmount.textContent = this.formatCurrency(this.rates.USD);
        }

        if (eurAmount && this.rates.EUR) {
            eurAmount.textContent = this.formatCurrency(this.rates.EUR);
        }
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

        // Toggle panel LATAM
        const toggleBtn = document.getElementById('toggle-latam-rates');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleLatamPanel());
        }
    }

    convertFromVES() {
        const vesValue = parseFloat(document.getElementById('ves-input').value) || 0;

        if (vesValue > 0) {
            // Convertir VES a USD
            const usdValue = vesValue / this.rates.USD;
            document.getElementById('usd-input').value = this.formatCurrency(usdValue);

            // Convertir VES a EUR
            const eurValue = vesValue / this.rates.EUR;
            document.getElementById('eur-input').value = this.formatCurrency(eurValue);
        } else {
            this.clearInputs(['usd-input', 'eur-input']);
        }
    }

    convertFromUSD() {
        const usdValue = parseFloat(document.getElementById('usd-input').value) || 0;

        if (usdValue > 0) {
            // Convertir USD a EUR
            const eurValue = usdValue * (this.rates.USD / this.rates.EUR);
            document.getElementById('eur-input').value = eurValue.toFixed(4);

            // Convertir USD a moneda LATAM seleccionada
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
            // Convertir EUR a USD
            const usdValue = eurValue * (this.rates.EUR / this.rates.USD);
            document.getElementById('usd-input').value = usdValue.toFixed(4);

            // Convertir EUR a moneda LATAM seleccionada
            if (this.selectedLatamCurrency) {
                const latamValue = eurValue * (this.rates.EUR / this.rates[this.selectedLatamCurrency]);
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
    }

    toggleLatamPanel() {
        const panel = document.getElementById('latam-panel');
        const button = document.getElementById('toggle-latam-rates');

        if (panel && button) {
            const isOpen = panel.classList.contains('open');

            if (isOpen) {
                panel.classList.remove('open');
                button.classList.remove('active');
            } else {
                panel.classList.add('open');
                button.classList.add('active');
            }
        }
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
            // Convertir de LATAM a USD y EUR
            const usdValue = latamValue / this.rates[this.selectedLatamCurrency];
            const eurValue = usdValue * (this.rates.EUR / this.rates.USD);

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
    // Inicializar elementos (sin animación de loading)
    const usdAmount = document.getElementById('usd-amount');
    const eurAmount = document.getElementById('eur-amount');

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
});
