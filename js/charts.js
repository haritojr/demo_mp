// --- LÓGICA DE CHART.JS ---
let barChartInstance = null;
let pieChartInstance = null;

function renderCharts(data) {
    // 1. Preparar datos
    // Ordenar por número de averías para el gráfico de barras
    const top10 = [...data].sort((a,b) => b.averias.length - a.averias.length).slice(0, 10);
    
    // Contar categorías para el gráfico circular
    let cats = {"Fallo Instalación":0, "Fallo Montaje":0, "Otros":0};
    data.forEach(l => l.averias.forEach(av => {
        // Normalizamos la categoría para asegurar que coincida
        let catKey = "Otros";
        if(av.category === "Fallo Instalación") catKey = "Fallo Instalación";
        if(av.category === "Fallo Montaje") catKey = "Fallo Montaje";
        
        cats[catKey]++;
    }));

    // 2. Destruir gráficos anteriores si existen
    if (barChartInstance) barChartInstance.destroy();
    if (pieChartInstance) pieChartInstance.destroy();

    // 3. Crear Gráfico de Barras (Top 10)
    const ctxBar = document.getElementById('barChart').getContext('2d');
    barChartInstance = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: top10.map(l => l.id),
            datasets: [{
                label: 'Averías',
                data: top10.map(l => l.averias.length),
                backgroundColor: 'rgba(201, 34, 40, 0.85)', // Rojo MP con opacidad
                borderColor: '#c92228', // Rojo MP
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: { 
                    backgroundColor: '#333333',
                    callbacks: {
                        title: (items) => {
                            const idx = items[0].dataIndex;
                            return `${top10[idx].id} - ${top10[idx].name}`;
                        }
                    }
                } 
            },
            scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
        }
    });

    // 4. Crear Gráfico Circular (Categorías)
    const ctxPie = document.getElementById('pieChart').getContext('2d');
    // Colores: Naranja (Instalación), Azul (Montaje), Gris (Otros)
    const colors = ['#c2410c', '#1d4ed8', '#94a3b8']; 
    
    pieChartInstance = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: Object.keys(cats),
            datasets: [{
                data: Object.values(cats),
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: { legend: { display: false } }
        }
    });

    // 5. Generar Leyenda HTML personalizada
    const totalCats = Object.values(cats).reduce((a,b)=>a+b,0);
    document.getElementById('catLegend').innerHTML = Object.keys(cats).map((k, i) => {
        const val = Object.values(cats)[i];
        const pct = totalCats ? Math.round((val/totalCats)*100) : 0;
        return `
            <div class="flex justify-between items-center text-xs p-2 border-b border-slate-100">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full" style="background-color:${colors[i]}"></span>
                    <span class="font-bold text-slate-600 uppercase">${k}</span>
                </div>
                <div class="text-right"><span class="font-bold">${val}</span> <span class="text-slate-400">(${pct}%)</span></div>
            </div>
        `;
    }).join('');
}