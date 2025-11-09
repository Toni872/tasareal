// TasaReal - Calculadora de Tasa Efectiva Anual
// © 2025 - Herramienta financiera para Latinoamérica

class FinancialCalculator {
    constructor() {
        this.form = document.getElementById('calculatorForm');
        this.resultsDiv = document.getElementById('results');
        this.amortizationSection = document.getElementById('amortizationSection');
        this.amortizationTable = document.getElementById('amortizationTable');
        this.comparisonContainer = document.getElementById('comparisonContainer');
        this.bankRatesContainer = document.getElementById('bankRatesContainer');
        this.chartsSection = document.getElementById('chartsSection');
        this.chartContainer = document.getElementById('chartContainer');
        this.refinancingSection = document.getElementById('refinancingSection');
        this.refinancingResults = document.getElementById('refinancingResults');
        this.currentChart = null;
        this.comparisons = [];

        this.init();
    }

    init() {
        // Event listeners
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.showLoading();
            setTimeout(() => {
                this.calculate();
                this.hideLoading();
            }, 300);
        });

        document.getElementById('addComparison').addEventListener('click', () => {
            this.addToComparison();
        });

        document.getElementById('downloadTable').addEventListener('click', () => {
            this.downloadCSV();
        });

        document.getElementById('showAmortizationChart').addEventListener('click', () => {
            this.showAmortizationChart();
        });

        document.getElementById('showComparisonChart').addEventListener('click', () => {
            this.showComparisonChart();
        });

        document.getElementById('calculateRefinancing').addEventListener('click', () => {
            this.calculateRefinancing();
        });

        // Auto-calculate on input change
        this.form.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', () => {
                if (this.form.checkValidity()) {
                    this.calculate();
                }
            });
        });

        // Load bank rates on page load
        this.loadBankRates();
    }

    showLoading() {
        const btnText = document.getElementById('btnText');
        const btnLoader = document.getElementById('btnLoader');
        if (btnText && btnLoader) {
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
        }
    }

    hideLoading() {
        const btnText = document.getElementById('btnText');
        const btnLoader = document.getElementById('btnLoader');
        if (btnText && btnLoader) {
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    }

    animateNumber(element, start, end, duration = 1000) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = this.formatNumber(current);
        }, 16);
    }

    getFormData() {
        const plazo = parseInt(document.getElementById('plazo').value);
        const plazoUnidad = document.getElementById('plazoUnidad').value;
        const plazoMeses = plazoUnidad === 'años' ? plazo * 12 : plazo;

        return {
            monto: parseFloat(document.getElementById('monto').value),
            tna: parseFloat(document.getElementById('tna').value) / 100,
            plazoMeses: plazoMeses,
            frecuencia: parseInt(document.getElementById('frecuencia').value),
            sistema: document.getElementById('sistema').value,
            // Costos adicionales para CFT
            comisionApertura: parseFloat(document.getElementById('comisionApertura').value) || 0,
            seguroVida: parseFloat(document.getElementById('seguroVida').value) || 0,
            seguroDesempleo: parseFloat(document.getElementById('seguroDesempleo').value) || 0,
            otrosGastos: parseFloat(document.getElementById('otrosGastos').value) || 0
        };
    }

    calcularTEA(tna, frecuencia) {
        // TEA = (1 + TNA/n)^n - 1
        return Math.pow(1 + tna / frecuencia, frecuencia) - 1;
    }

    calcularCFT(data, tea, totalIntereses) {
        // CFT considera todos los costos del crédito
        const costosTotales = totalIntereses +
                             data.comisionApertura +
                             (data.seguroVida * (data.plazoMeses / 12)) +
                             (data.seguroDesempleo * (data.plazoMeses / 12)) +
                             data.otrosGastos;

        // CFT = (costosTotales / monto) / (plazo en años) * 100
        const plazoAnios = data.plazoMeses / 12;
        const cft = (costosTotales / data.monto) / plazoAnios * 100;

        return {
            cft: cft,
            costosTotales: costosTotales,
            costoPorcentaje: (costosTotales / data.monto) * 100
        };
    }

    calcularCuotaFrances(monto, tea, plazoMeses) {
        // Tasa mensual efectiva
        const tasaMensual = Math.pow(1 + tea, 1/12) - 1;
        
        // Cuota = P * [i * (1+i)^n] / [(1+i)^n - 1]
        const cuota = monto * (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) / 
                     (Math.pow(1 + tasaMensual, plazoMeses) - 1);
        
        return cuota;
    }

    calcularAmortizacionFrances(monto, tea, plazoMeses) {
        const tasaMensual = Math.pow(1 + tea, 1/12) - 1;
        const cuota = this.calcularCuotaFrances(monto, tea, plazoMeses);
        
        let saldo = monto;
        const tabla = [];
        
        for (let mes = 1; mes <= plazoMeses; mes++) {
            const interes = saldo * tasaMensual;
            const amortizacion = cuota - interes;
            saldo -= amortizacion;
            
            tabla.push({
                mes,
                cuota,
                interes,
                amortizacion,
                saldo: Math.max(0, saldo)
            });
        }
        
        return tabla;
    }

    calcularAmortizacionAleman(monto, tea, plazoMeses) {
        const tasaMensual = Math.pow(1 + tea, 1/12) - 1;
        const amortizacionFija = monto / plazoMeses;
        
        let saldo = monto;
        const tabla = [];
        
        for (let mes = 1; mes <= plazoMeses; mes++) {
            const interes = saldo * tasaMensual;
            const cuota = amortizacionFija + interes;
            saldo -= amortizacionFija;
            
            tabla.push({
                mes,
                cuota,
                interes,
                amortizacion: amortizacionFija,
                saldo: Math.max(0, saldo)
            });
        }
        
        return tabla;
    }

    calculate() {
        const data = this.getFormData();
        const tea = this.calcularTEA(data.tna, data.frecuencia);
        
        let tablaAmortizacion;
        let cuotaMensual;
        
        if (data.sistema === 'frances') {
            tablaAmortizacion = this.calcularAmortizacionFrances(data.monto, tea, data.plazoMeses);
            cuotaMensual = tablaAmortizacion[0].cuota;
        } else {
            tablaAmortizacion = this.calcularAmortizacionAleman(data.monto, tea, data.plazoMeses);
            cuotaMensual = tablaAmortizacion[0].cuota; // Primera cuota (la más alta)
        }
        
        const totalPagar = tablaAmortizacion.reduce((sum, row) => sum + row.cuota, 0);
        const totalIntereses = totalPagar - data.monto;

        // Calcular CFT si hay costos adicionales
        const cftData = this.calcularCFT(data, tea, totalIntereses);

        const results = {
            monto: data.monto,
            tna: data.tna * 100,
            tea: tea * 100,
            cft: cftData.cft,
            costosTotales: cftData.costosTotales,
            costoPorcentaje: cftData.costoPorcentaje,
            plazoMeses: data.plazoMeses,
            cuotaMensual,
            totalPagar,
            totalIntereses,
            sistema: data.sistema,
            tablaAmortizacion,
            // Datos de costos adicionales
            comisionApertura: data.comisionApertura,
            seguroVida: data.seguroVida,
            seguroDesempleo: data.seguroDesempleo,
            otrosGastos: data.otrosGastos
        };

        this.displayResults(results);
        this.showChartsSection(results);
    }

    displayResults(results) {
        const diferenciaTasas = results.tea - results.tna;
        const porcentajeIntereses = (results.totalIntereses / results.monto) * 100;
        
        this.resultsDiv.innerHTML = `
            <div class="animate-fade-in space-y-6" style="animation-delay: 0.1s">
                <!-- TEA Destacada -->
                <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-xl text-center animate-count relative overflow-hidden">
                    <div class="absolute inset-0 shimmer"></div>
                    <p class="text-sm font-semibold mb-2 opacity-90 relative z-10">TASA EFECTIVA ANUAL</p>
                    <p class="text-5xl font-bold mb-2 relative z-10 animate-count">${results.tea.toFixed(2)}%</p>
                    <p class="text-sm opacity-90 relative z-10">
                        ${diferenciaTasas.toFixed(2)}% más que la tasa nominal
                    </p>
                </div>

                <!-- Comparativa TNA vs TEA -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                        <p class="text-xs text-blue-600 font-semibold mb-1">TASA NOMINAL</p>
                        <p class="text-2xl font-bold text-blue-900">${results.tna.toFixed(2)}%</p>
                    </div>
                    <div class="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                        <p class="text-xs text-green-600 font-semibold mb-1">TASA EFECTIVA</p>
                        <p class="text-2xl font-bold text-green-900">${results.tea.toFixed(2)}%</p>
                    </div>
                </div>

                <!-- CFT (Costo Financiero Total) -->
                <div class="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border-2 border-red-200">
                    <div class="text-center">
                        <p class="text-sm font-semibold mb-2 text-red-700">COSTO FINANCIERO TOTAL (CFT)</p>
                        <p class="text-4xl font-bold mb-2 text-red-900 animate-count">${results.cft.toFixed(2)}%</p>
                        <div class="grid grid-cols-2 gap-4 mt-4 text-sm">
                            <div class="bg-white bg-opacity-50 p-3 rounded-lg">
                                <p class="text-red-600 font-semibold">Total a pagar</p>
                                <p class="text-2xl font-bold text-red-900">$${this.formatNumber(results.costosTotales)}</p>
                            </div>
                            <div class="bg-white bg-opacity-50 p-3 rounded-lg">
                                <p class="text-red-600 font-semibold">Costo total</p>
                                <p class="text-2xl font-bold text-red-900">${results.costoPorcentaje.toFixed(1)}%</p>
                            </div>
                        </div>
                        ${results.comisionApertura > 0 || results.seguroVida > 0 || results.seguroDesempleo > 0 || results.otrosGastos > 0 ?
                            `<div class="mt-4 text-xs text-red-600 bg-white bg-opacity-30 p-3 rounded-lg">
                                <p class="font-semibold mb-1">Costos incluidos:</p>
                                <div class="grid grid-cols-2 gap-2 text-xs">
                                    ${results.comisionApertura > 0 ? `<span>Comisión: $${this.formatNumber(results.comisionApertura)}</span>` : ''}
                                    ${results.seguroVida > 0 ? `<span>Seguro vida: $${this.formatNumber(results.seguroVida)}/año</span>` : ''}
                                    ${results.seguroDesempleo > 0 ? `<span>Seguro desempleo: $${this.formatNumber(results.seguroDesempleo)}/año</span>` : ''}
                                    ${results.otrosGastos > 0 ? `<span>Otros: $${this.formatNumber(results.otrosGastos)}</span>` : ''}
                                </div>
                            </div>`
                            : ''}
                    </div>
                </div>

                <!-- Cuota Mensual -->
                <div class="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-xl">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="text-sm text-yellow-700 font-semibold mb-1">
                                ${results.sistema === 'frances' ? 'CUOTA FIJA MENSUAL' : 'PRIMERA CUOTA (Máxima)'}
                            </p>
                            <p class="text-3xl font-bold text-yellow-900">
                                $${this.formatNumber(results.cuotaMensual)}
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="text-xs text-yellow-700">Sistema</p>
                            <p class="text-sm font-semibold text-yellow-900">
                                ${results.sistema === 'frances' ? 'Francés' : 'Alemán'}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Resumen Financiero -->
                <div class="space-y-3">
                    <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <span class="text-gray-600 font-medium">Monto Solicitado</span>
                        <span class="text-gray-900 font-bold text-lg">$${this.formatNumber(results.monto)}</span>
                    </div>
                    <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <span class="text-gray-600 font-medium">Total a Pagar</span>
                        <span class="text-gray-900 font-bold text-lg">$${this.formatNumber(results.totalPagar)}</span>
                    </div>
                    <div class="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-200">
                        <span class="text-red-700 font-medium">Total Intereses</span>
                        <span class="text-red-900 font-bold text-lg">$${this.formatNumber(results.totalIntereses)}</span>
                    </div>
                    <div class="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                        <span class="text-purple-700 font-medium">Plazo</span>
                        <span class="text-purple-900 font-bold text-lg">${results.plazoMeses} meses</span>
                    </div>
                </div>

                <!-- Indicador de Costo -->
                <div class="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-semibold text-orange-900">Costo del Crédito</span>
                        <span class="text-lg font-bold text-orange-900 animate-count">${porcentajeIntereses.toFixed(1)}%</span>
                    </div>
                    <div class="w-full bg-orange-200 rounded-full h-3 overflow-hidden">
                        <div class="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full progress-bar" 
                             style="width: 0%"
                             data-width="${Math.min(porcentajeIntereses, 100)}">
                        </div>
                    </div>
                    <p class="text-xs text-orange-700 mt-2">
                        Pagarás $${this.formatNumber(results.totalIntereses)} adicionales en intereses
                    </p>
                </div>

                <!-- Botón Ver Tabla -->
                <button 
                    onclick="calculator.showAmortizationTable()"
                    class="w-full bg-indigo-100 text-indigo-700 font-semibold py-3 rounded-lg hover:bg-indigo-200 transition"
                >
                    📋 Ver Tabla de Amortización Completa
                </button>
            </div>
        `;

        // Guardar tabla para mostrar después
        this.currentAmortization = results.tablaAmortizacion;
        
        // Animar barra de progreso
        setTimeout(() => {
            const progressBar = this.resultsDiv.querySelector('.progress-bar');
            if (progressBar) {
                const targetWidth = progressBar.getAttribute('data-width');
                progressBar.style.width = targetWidth + '%';
            }
        }, 100);
    }

    showAmortizationTable() {
        if (!this.currentAmortization) return;

        const data = this.getFormData();
        
        let tableHTML = `
            <table class="w-full text-sm">
                <thead class="bg-gray-100 sticky top-0">
                    <tr>
                        <th class="px-4 py-3 text-left font-semibold text-gray-700">Mes</th>
                        <th class="px-4 py-3 text-right font-semibold text-gray-700">Cuota</th>
                        <th class="px-4 py-3 text-right font-semibold text-gray-700">Interés</th>
                        <th class="px-4 py-3 text-right font-semibold text-gray-700">Amortización</th>
                        <th class="px-4 py-3 text-right font-semibold text-gray-700">Saldo</th>
                    </tr>
                </thead>
                <tbody>
        `;

        this.currentAmortization.forEach((row, index) => {
            const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            tableHTML += `
                <tr class="${bgClass} hover:bg-blue-50 transition">
                    <td class="px-4 py-3 font-medium text-gray-900">${row.mes}</td>
                    <td class="px-4 py-3 text-right font-semibold text-gray-900">$${this.formatNumber(row.cuota)}</td>
                    <td class="px-4 py-3 text-right text-red-600">$${this.formatNumber(row.interes)}</td>
                    <td class="px-4 py-3 text-right text-green-600">$${this.formatNumber(row.amortizacion)}</td>
                    <td class="px-4 py-3 text-right font-medium text-gray-700">$${this.formatNumber(row.saldo)}</td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        this.amortizationTable.innerHTML = tableHTML;
        this.amortizationSection.classList.remove('hidden');
        
        // Scroll suave a la tabla
        this.amortizationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    addToComparison() {
        const data = this.getFormData();
        const tea = this.calcularTEA(data.tna, data.frecuencia);
        
        let cuotaMensual;
        if (data.sistema === 'frances') {
            cuotaMensual = this.calcularCuotaFrances(data.monto, tea, data.plazoMeses);
        } else {
            const tabla = this.calcularAmortizacionAleman(data.monto, tea, data.plazoMeses);
            cuotaMensual = tabla[0].cuota;
        }

        const totalPagar = data.sistema === 'frances'
            ? cuotaMensual * data.plazoMeses
            : this.calcularAmortizacionAleman(data.monto, tea, data.plazoMeses)
                .reduce((sum, row) => sum + row.cuota, 0);

        const totalIntereses = totalPagar - data.monto;
        const cftData = this.calcularCFT(data, tea, totalIntereses);

        this.comparisons.push({
            id: Date.now(),
            nombre: `Oferta ${this.comparisons.length + 1}`,
            monto: data.monto,
            tna: data.tna * 100,
            tea: tea * 100,
            cft: cftData.cft,
            costosTotales: cftData.costosTotales,
            plazoMeses: data.plazoMeses,
            cuotaMensual,
            totalPagar,
            sistema: data.sistema,
            // Costos adicionales
            comisionApertura: data.comisionApertura,
            seguroVida: data.seguroVida,
            seguroDesempleo: data.seguroDesempleo,
            otrosGastos: data.otrosGastos
        });

        this.displayComparisons();
    }

    displayComparisons() {
        if (this.comparisons.length === 0) {
            this.comparisonContainer.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <p>Haz clic en "Agregar Oferta" para comparar diferentes créditos</p>
                </div>
            `;
            return;
        }

        // Encontrar la mejor oferta (menor TEA)
        const bestOffer = this.comparisons.reduce((min, offer) => 
            offer.tea < min.tea ? offer : min
        );

        let html = '<div class="grid md:grid-cols-3 gap-6">';

        this.comparisons.forEach(offer => {
            const isBest = offer.id === bestOffer.id;
            const borderClass = isBest ? 'border-4 border-green-500' : 'border-2 border-gray-200';
            
            html += `
                <div class="bg-white p-6 rounded-xl ${borderClass} relative">
                    ${isBest ? '<div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold">MEJOR OFERTA</div>' : ''}
                    
                    <div class="flex justify-between items-start mb-4">
                        <input 
                            type="text" 
                            value="${offer.nombre}"
                            onchange="calculator.updateOfferName(${offer.id}, this.value)"
                            class="font-bold text-lg text-gray-800 border-b-2 border-transparent hover:border-gray-300 focus:border-purple-500 outline-none transition"
                        >
                        <button 
                            onclick="calculator.removeComparison(${offer.id})"
                            class="text-red-500 hover:text-red-700 font-bold"
                        >✕</button>
                    </div>

                    <div class="space-y-3">
                        <div class="bg-purple-50 p-3 rounded-lg">
                            <p class="text-xs text-purple-600 font-semibold mb-1">TEA</p>
                            <p class="text-2xl font-bold text-purple-900">${offer.tea.toFixed(2)}%</p>
                        </div>

                        <div class="bg-red-50 p-3 rounded-lg">
                            <p class="text-xs text-red-600 font-semibold mb-1">CFT</p>
                            <p class="text-2xl font-bold text-red-900">${offer.cft.toFixed(2)}%</p>
                        </div>

                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">TNA</span>
                            <span class="font-semibold text-gray-900">${offer.tna.toFixed(2)}%</span>
                        </div>

                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Cuota</span>
                            <span class="font-semibold text-gray-900">$${this.formatNumber(offer.cuotaMensual)}</span>
                        </div>

                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Total</span>
                            <span class="font-semibold text-gray-900">$${this.formatNumber(offer.totalPagar)}</span>
                        </div>

                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Plazo</span>
                            <span class="font-semibold text-gray-900">${offer.plazoMeses}m</span>
                        </div>

                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Sistema</span>
                            <span class="font-semibold text-gray-900">${offer.sistema === 'frances' ? 'Francés' : 'Alemán'}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        // Agregar resumen comparativo
        if (this.comparisons.length > 1) {
            const maxTEA = Math.max(...this.comparisons.map(o => o.tea));
            const minTEA = Math.min(...this.comparisons.map(o => o.tea));
            const diferenciaTEA = maxTEA - minTEA;

            const maxCFT = Math.max(...this.comparisons.map(o => o.cft));
            const minCFT = Math.min(...this.comparisons.map(o => o.cft));
            const diferenciaCFT = maxCFT - minCFT;

            const mejorOfertaTEA = this.comparisons.find(o => o.tea === minTEA);
            const mejorOfertaCFT = this.comparisons.find(o => o.cft === minCFT);

            html += `
                <div class="mt-6 bg-blue-50 border-2 border-blue-200 p-6 rounded-xl">
                    <h4 class="font-bold text-blue-900 mb-3">📊 Análisis Comparativo</h4>
                    <div class="grid md:grid-cols-2 gap-6 text-sm">
                        <div class="bg-white bg-opacity-50 p-4 rounded-lg">
                            <h5 class="font-semibold text-blue-900 mb-2">Por TEA (Tasa Efectiva)</h5>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-blue-700">Mejor:</span>
                                    <span class="font-bold text-blue-900">${minTEA.toFixed(2)}% (${mejorOfertaTEA.nombre})</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-blue-700">Peor:</span>
                                    <span class="font-bold text-blue-900">${maxTEA.toFixed(2)}%</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-blue-700">Diferencia:</span>
                                    <span class="font-bold text-red-600">${diferenciaTEA.toFixed(2)}%</span>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-50 p-4 rounded-lg">
                            <h5 class="font-semibold text-red-900 mb-2">Por CFT (Costo Total)</h5>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-red-700">Mejor:</span>
                                    <span class="font-bold text-red-900">${minCFT.toFixed(2)}% (${mejorOfertaCFT.nombre})</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-red-700">Peor:</span>
                                    <span class="font-bold text-red-900">${maxCFT.toFixed(2)}%</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-red-700">Diferencia:</span>
                                    <span class="font-bold text-red-600">${diferenciaCFT.toFixed(2)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        this.comparisonContainer.innerHTML = html;
    }

    updateOfferName(id, newName) {
        const offer = this.comparisons.find(o => o.id === id);
        if (offer) {
            offer.nombre = newName;
        }
    }

    removeComparison(id) {
        this.comparisons = this.comparisons.filter(o => o.id !== id);
        this.displayComparisons();
    }

    downloadCSV() {
        if (!this.currentAmortization) return;

        const data = this.getFormData();
        let csv = 'Mes,Cuota,Interés,Amortización,Saldo\n';
        
        this.currentAmortization.forEach(row => {
            csv += `${row.mes},${row.cuota.toFixed(2)},${row.interes.toFixed(2)},${row.amortizacion.toFixed(2)},${row.saldo.toFixed(2)}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `amortizacion_${data.monto}_${data.plazoMeses}meses.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    showChartsSection(results) {
        this.chartsSection.classList.remove('hidden');
        this.chartsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.lastResults = results;
        this.showAmortizationChart(); // Mostrar gráfico de amortización por defecto
    }

    showAmortizationChart() {
        // Destruir gráfico anterior si existe
        if (this.currentChart) {
            this.currentChart.destroy();
        }

        const ctx = document.getElementById('amortizationChart').getContext('2d');

        // Preparar datos para el gráfico
        const labels = [];
        const capitalData = [];
        const interesData = [];
        const saldoData = [];

        this.lastResults.tablaAmortizacion.forEach((row, index) => {
            if (index < 24) { // Mostrar máximo 24 meses para legibilidad
                labels.push(`Mes ${index + 1}`);
                capitalData.push(row.amortizacion);
                interesData.push(row.interes);
                saldoData.push(row.saldo);
            }
        });

        this.currentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Interés',
                        data: interesData,
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Capital',
                        data: capitalData,
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Composición de Pagos Mensuales',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': $' + calculator.formatNumber(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + calculator.formatNumber(value);
                            }
                        }
                    }
                }
            }
        });
    }

    showComparisonChart() {
        // Destruir gráfico anterior si existe
        if (this.currentChart) {
            this.currentChart.destroy();
        }

        if (this.comparisons.length === 0) {
            this.chartContainer.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-gray-500">Agrega ofertas al comparador para ver el gráfico</p>
                </div>
            `;
            return;
        }

        const ctx = document.getElementById('amortizationChart').getContext('2d');

        const labels = this.comparisons.map(offer => offer.nombre);
        const teaData = this.comparisons.map(offer => offer.tea);
        const cftData = this.comparisons.map(offer => offer.cft);
        const cuotaData = this.comparisons.map(offer => offer.cuotaMensual);

        this.currentChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'TEA (%)',
                        data: teaData,
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(59, 130, 246, 1)'
                    },
                    {
                        label: 'CFT (%)',
                        data: cftData,
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(239, 68, 68, 1)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Comparación de Ofertas',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.r.toFixed(2) + '%';
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    calculateRefinancing() {
        // Obtener datos del formulario
        const montoPendiente = parseFloat(document.getElementById('refinancingMontoPendiente').value);
        const tnaActual = parseFloat(document.getElementById('refinancingTnaActual').value) / 100;
        const mesesRestantes = parseInt(document.getElementById('refinancingMesesRestantes').value);
        const tnaNueva = parseFloat(document.getElementById('refinancingTnaNueva').value) / 100;
        const costosRefinanciamiento = parseFloat(document.getElementById('refinancingCostos').value) || 0;
        const mantenerPlazo = document.getElementById('refinancingMantenerPlazo').checked;

        // Calcular TEA actual y nueva
        const teaActual = this.calcularTEA(tnaActual, 12); // Asumimos capitalización mensual
        const teaNueva = this.calcularTEA(tnaNueva, 12);

        // Calcular cuota actual (usando sistema francés para simplificar)
        const cuotaActual = this.calcularCuotaFrances(montoPendiente, teaActual, mesesRestantes);

        // Calcular total que se pagaría con crédito actual
        const totalActual = cuotaActual * mesesRestantes;
        const interesesActual = totalActual - montoPendiente;

        // Calcular nuevo crédito
        const mesesNuevo = mantenerPlazo ? mesesRestantes : mesesRestantes; // Por ahora mantenemos el plazo
        const cuotaNueva = this.calcularCuotaFrances(montoPendiente, teaNueva, mesesNuevo);
        const totalNuevo = cuotaNueva * mesesNuevo + costosRefinanciamiento;
        const interesesNuevo = totalNuevo - montoPendiente - costosRefinanciamiento;

        // Calcular ahorro
        const ahorroTotal = totalActual - totalNuevo;
        const ahorroMensual = cuotaActual - cuotaNueva;
        const ahorroPorcentaje = (ahorroTotal / totalActual) * 100;

        // Calcular meses para recuperar costos
        const mesesRecuperacion = costosRefinanciamiento > 0 ? Math.ceil(costosRefinanciamiento / ahorroMensual) : 0;

        // Mostrar resultados
        this.showRefinancingResults({
            cuotaActual,
            cuotaNueva,
            ahorroMensual,
            ahorroTotal,
            ahorroPorcentaje,
            totalActual,
            interesesActual,
            teaActual: teaActual * 100,
            totalNuevo,
            interesesNuevo,
            teaNueva: teaNueva * 100,
            mesesRecuperacion,
            costosRefinanciamiento
        });
    }

    showRefinancingResults(results) {
        // Mostrar sección de resultados
        this.refinancingResults.classList.remove('hidden');

        // Actualizar valores
        document.getElementById('refinancingAhorroTotal').textContent = '$' + this.formatNumber(results.ahorroTotal);
        document.getElementById('refinancingAhorroPorcentaje').textContent =
            results.ahorroPorcentaje.toFixed(1) + '% menos intereses';

        document.getElementById('refinancingCuotaActual').textContent = '$' + this.formatNumber(results.cuotaActual);
        document.getElementById('refinancingNuevaCuota').textContent = '$' + this.formatNumber(results.cuotaNueva);
        document.getElementById('refinancingAhorroMensual').textContent = '$' + this.formatNumber(results.ahorroMensual);

        document.getElementById('refinancingTotalActual').textContent = '$' + this.formatNumber(results.totalActual);
        document.getElementById('refinancingInteresesActual').textContent = '$' + this.formatNumber(results.interesesActual);
        document.getElementById('refinancingTeaActual').textContent = results.teaActual.toFixed(2) + '%';

        document.getElementById('refinancingTotalNuevo').textContent = '$' + this.formatNumber(results.totalNuevo);
        document.getElementById('refinancingInteresesNuevo').textContent = '$' + this.formatNumber(results.interesesNuevo);
        document.getElementById('refinancingTeaNueva').textContent = results.teaNueva.toFixed(2) + '%';
        document.getElementById('refinancingRecuperacion').textContent = results.mesesRecuperacion + ' meses';

        // Scroll suave a resultados
        this.refinancingResults.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    formatNumber(num) {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    loadBankRates() {
        // Simular API de tasas bancarias (en producción se conectaría a una API real)
        const bankRates = [
            { country: 'México', banks: [
                { name: 'BBVA México', personal: 18.5, hipotecario: 9.2, lastUpdate: '2025-01-15' },
                { name: 'Banorte', personal: 19.8, hipotecario: 9.8, lastUpdate: '2025-01-15' },
                { name: 'Santander México', personal: 17.9, hipotecario: 8.9, lastUpdate: '2025-01-15' }
            ]},
            { country: 'Argentina', banks: [
                { name: 'Banco Nación', personal: 85.0, hipotecario: 45.0, lastUpdate: '2025-01-15' },
                { name: 'Banco Provincia', personal: 78.0, hipotecario: 42.0, lastUpdate: '2025-01-15' },
                { name: 'ICBC', personal: 82.0, hipotecario: 48.0, lastUpdate: '2025-01-15' }
            ]},
            { country: 'Colombia', banks: [
                { name: 'Bancolombia', personal: 24.5, hipotecario: 12.8, lastUpdate: '2025-01-15' },
                { name: 'Davivienda', personal: 25.2, hipotecario: 13.1, lastUpdate: '2025-01-15' },
                { name: 'BBVA Colombia', personal: 23.8, hipotecario: 12.5, lastUpdate: '2025-01-15' }
            ]},
            { country: 'Perú', banks: [
                { name: 'BCP', personal: 22.5, hipotecario: 8.9, lastUpdate: '2025-01-15' },
                { name: 'Interbank', personal: 23.1, hipotecario: 9.2, lastUpdate: '2025-01-15' },
                { name: 'Scotiabank', personal: 21.8, hipotecario: 8.7, lastUpdate: '2025-01-15' }
            ]},
            { country: 'Chile', banks: [
                { name: 'Banco Estado', personal: 18.5, hipotecario: 4.8, lastUpdate: '2025-01-15' },
                { name: 'Santander Chile', personal: 19.2, hipotecario: 5.1, lastUpdate: '2025-01-15' },
                { name: 'BCI', personal: 17.8, hipotecario: 4.9, lastUpdate: '2025-01-15' }
            ]},
            { country: 'Ecuador', banks: [
                { name: 'Banco Pichincha', personal: 16.5, hipotecario: 9.2, lastUpdate: '2025-01-15' },
                { name: 'Banco Guayaquil', personal: 17.1, hipotecario: 9.5, lastUpdate: '2025-01-15' },
                { name: 'Produbanco', personal: 15.8, hipotecario: 8.9, lastUpdate: '2025-01-15' }
            ]},
            { country: 'Centroamérica', banks: [
                { name: 'BAC Credomatic', personal: 28.5, hipotecario: 8.9, lastUpdate: '2025-01-15' },
                { name: 'Banco Promerica', personal: 29.2, hipotecario: 9.1, lastUpdate: '2025-01-15' },
                { name: 'Banco Cuscatlán', personal: 27.8, hipotecario: 8.7, lastUpdate: '2025-01-15' }
            ]}
        ];

        this.renderBankRates(bankRates);
    }

    renderBankRates(bankRates) {
        this.bankRatesContainer.innerHTML = '';

        bankRates.forEach(country => {
            const countryCard = document.createElement('div');
            countryCard.className = 'bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 hover:shadow-lg transition-all duration-300';

            const countryTitle = document.createElement('h4');
            countryTitle.className = 'font-bold text-lg text-gray-800 mb-4 flex items-center';
            countryTitle.innerHTML = `
                <span class="text-blue-600 mr-2">🏦</span>
                ${country.country}
            `;

            const banksList = document.createElement('div');
            banksList.className = 'space-y-3';

            country.banks.forEach(bank => {
                const bankItem = document.createElement('div');
                bankItem.className = 'bg-white p-4 rounded-lg shadow-sm border border-gray-100';

                bankItem.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <span class="font-semibold text-gray-800">${bank.name}</span>
                        <span class="text-xs text-gray-500">TNA</span>
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-600">Personal:</span>
                            <span class="font-semibold text-blue-600">${bank.personal}%</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Hipotecario:</span>
                            <span class="font-semibold text-green-600">${bank.hipotecario}%</span>
                        </div>
                    </div>
                `;

                banksList.appendChild(bankItem);
            });

            countryCard.appendChild(countryTitle);
            countryCard.appendChild(banksList);
            this.bankRatesContainer.appendChild(countryCard);
        });
    }
}

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', function() {
    console.log('TasaReal loaded successfully');
});

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('[SW] Service Worker registered:', registration.scope);

                // Verificar si hay una nueva versión disponible
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // Nueva versión disponible
                                if (confirm('Hay una nueva versión disponible. ¿Quieres actualizar?')) {
                                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                                    window.location.reload();
                                }
                            }
                        });
                    }
                });
            })
            .catch((error) => {
                console.log('[SW] Service Worker registration failed:', error);
            });
    });
}

// Calcular automáticamente al cargar
window.addEventListener('load', () => {
    calculator.calculate();
});

