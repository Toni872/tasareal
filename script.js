// TasaReal - Tasas de cambio y convertidor de divisas
class CurrencyConverter {
    constructor() {
        this.rates = {};
        this.baseUrl = 'https://api.exchangerate-api.com/v4/latest';
        this.init();
    }

    async init() {
        await this.loadExchangeRates();
        this.setupEventListeners();
    }

    async loadExchangeRates() {
        try {
            // Obtener tasas con base USD para múltiples monedas
            const usdResponse = await fetch(`${this.baseUrl}/USD`);
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
        // Inputs del convertidor (solo USD y EUR)
        const usdInput = document.getElementById('usd-input');
        const eurInput = document.getElementById('eur-input');

        // Botones
        const convertBtn = document.getElementById('convert-btn');
        const clearBtn = document.getElementById('clear-btn');

        // Event listeners para inputs
        usdInput.addEventListener('input', () => this.convertFromUSD());
        eurInput.addEventListener('input', () => this.convertFromEUR());

        // Event listeners para botones
        convertBtn.addEventListener('click', () => this.convertAll());
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
            document.getElementById('eur-input').value = eurValue.toFixed(2);
        } else {
            document.getElementById('eur-input').value = '';
        }
    }

    convertFromEUR() {
        const eurValue = parseFloat(document.getElementById('eur-input').value) || 0;

        if (eurValue > 0) {
            // Convertir EUR a USD
            const usdValue = eurValue * (this.rates.EUR / this.rates.USD);
            document.getElementById('usd-input').value = usdValue.toFixed(2);
        } else {
            document.getElementById('usd-input').value = '';
        }
    }

    convertAll() {
        // Convertir desde el input que tenga valor
        const usdValue = parseFloat(document.getElementById('usd-input').value) || 0;
        const eurValue = parseFloat(document.getElementById('eur-input').value) || 0;

        if (usdValue > 0) {
            this.convertFromUSD();
        } else if (eurValue > 0) {
            this.convertFromEUR();
        }
    }

    clearAll() {
        this.clearInputs(['usd-input', 'eur-input']);
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
            if (this.rates[code] && code !== 'USD' && code !== 'EUR') { // Excluir USD y EUR ya mostrados
                const card = document.createElement('div');
                card.className = 'latam-rate-card';
                card.innerHTML = `
                    <div class="currency-code">${code}</div>
                    <div class="currency-name">${info.name}</div>
                    <div class="rate-value">${this.formatCurrency(this.rates[code])}</div>
                    <div class="target-currency">VES</div>
                `;
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

    // Inicializar la aplicación
    new CurrencyConverter();
});
