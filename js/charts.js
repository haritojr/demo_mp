let barChartInstance = null;
let pieChartInstance = null;
let trendChartInstance = null; 

function renderCharts(data) {
    if (!data || data.length === 0) return;

    // --- PREPARACIÓN DE DATOS ---
    
    // 1. Top Reincidentes (Barras)
    const top10 = [...data].sort((a,b) => b.averias.length - a.averias.length).slice(0, 10);

    // 2. Categorías (Circular)
    let cats = {"Fallo Instalación":0, "Fallo Montaje":0, "Otros":0};
    data.forEach(l => l.averias.forEach(av => {
        let catKey = "Otros";
        if(av.category === "Fallo Instalación") catKey = "Fallo Instalación";
        if(av.category === "Fallo Montaje") catKey = "Fallo Montaje";
        cats[catKey]++;
    }));

    // 3. Tendencia Temporal (Línea)
    const timeline = {};
    data.forEach(lift => {
        lift.averias.forEach(av => {
            if (!av.date || av.date.length < 10) return;
            const parts = av.date.split('/'); 
            if(parts.length === 3) {
                const key = `${parts[2]}-${parts[1]}`; 
                timeline[key] = (timeline[key] || 0) + 1;
            }
        });
    });

    const sortedKeys = Object.keys(timeline).sort();
    const timelineLabels = sortedKeys.map(k => {
        const [y, m] = k.split('-');
        return `${m}/${y}`;
    });
    const timelineData = sortedKeys.map(k => timeline[k]);

    // --- LIMPIEZA ---
    if (barChartInstance) barChartInstance.destroy();
    if (pieChartInstance) pieChartInstance.destroy();
    if (trendChartInstance) trendChartInstance.destroy();

    // --- RENDERIZADO ---

    // 1. Gráfico de Tendencia
    const ctxTrend = document.getElementById('trendChart');
    if (ctxTrend) {
        trendChartInstance = new Chart(ctxTrend.getContext('2d'), {
            type: 'line',
            data: {
                labels: timelineLabels,
                datasets: [{
                    label: 'Evolución de Averías',
                    data: timelineData,
                    borderColor: '#c92228', 
                    backgroundColor: 'rgba(201, 34, 40, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#c92228',
                    pointRadius: 4,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    y: { beginAtZero: true, grid: { borderDash: [2, 2] } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 2. Top 10 Reincidentes (CON SEMÁFORO Y TOOLTIP INFO)
    const ctxBar = document.getElementById('barChart');
    if (ctxBar) {
        // Generar colores dinámicos según valor
        const barColors = top10.map(l => {
            const c = l.averias.length;
            if (c >= 5) return '#c92228'; // Rojo
            if (c >= 2) return '#f97316'; // Naranja
            return '#22c55e'; // Verde
        });

        barChartInstance = new Chart(ctxBar.getContext('2d'), {
            type: 'bar',
            data: {
                labels: top10.map(l => l.id), // Solo mostramos ID en eje X
                datasets: [{
                    label: 'Averías',
                    data: top10.map(l => l.averias.length),
                    backgroundColor: barColors, 
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        padding: 12,
                        callbacks: {
                            // Título del Tooltip: ID
                            title: (items) => `Instalación: ${items[0].label}`,
                            // Cuerpo del Tooltip: Info Completa
                            label: (context) => {
                                const lift = top10[context.dataIndex];
                                return [
                                    `Averías: ${lift.averias.length}`,
                                    `Obra: ${lift.name}`,
                                    `Puesta en Marcha: ${lift.date}`
                                ];
                            }
                        }
                    }
                },
                scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
            }
        });
    }

    // 3. Categorías
    const ctxPie = document.getElementById('pieChart');
    if (ctxPie) {
        const colors = ['#c2410c', '#1d4ed8', '#94a3b8']; 
        pieChartInstance = new Chart(ctxPie.getContext('2d'), {
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
                cutout: '75%',
                plugins: { legend: { display: false } }
            }
        });
        
        const totalCats = Object.values(cats).reduce((a,b)=>a+b,0);
        const legendContainer = document.getElementById('catLegend');
        if (legendContainer) {
            legendContainer.innerHTML = Object.keys(cats).map((k, i) => {
                const val = Object.values(cats)[i];
                const pct = totalCats ? Math.round((val/totalCats)*100) : 0;
                return `
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; padding:0.5rem 0; border-bottom:1px solid #f1f5f9;">
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                            <span style="width:8px; height:8px; border-radius:50%; background-color:${colors[i]}"></span>
                            <span style="font-weight:bold; color:#64748b; text-transform:uppercase;">${k}</span>
                        </div>
                        <div><strong>${val}</strong> <span style="color:#cbd5e1;">(${pct}%)</span></div>
                    </div>
                `;
            }).join('');
        }
    }
}