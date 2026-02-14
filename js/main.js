// --- VARIABLES GLOBALES ---
let fullData = [];
const CACHE_KEY = 'mp_averias_local_data';

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // 1. Intentar cargar datos de caché (Excel subido previamente)
    const cached = localStorage.getItem(CACHE_KEY);
    
    if (cached) {
        try {
            const parsedData = JSON.parse(cached);
            if (parsedData && parsedData.length > 0) {
                fullData = parsedData;
                showDashboard(true);
                return;
            }
        } catch (e) {
            console.error("Error caché", e);
        }
    }

    // 2. Si no hay caché, usar DATOS DEMO (definidos en data-demo.js)
    if (typeof DEMO_DATA !== 'undefined' && DEMO_DATA.length > 0) {
        console.log("Cargando modo DEMO");
        fullData = [...DEMO_DATA]; // Copia
        showDashboard(false);
    } else {
        // Si falla todo, mostrar estado vacío
        document.getElementById('emptyState').classList.remove('hidden');
    }
}

// --- GESTIÓN DE VISTAS Y DATOS ---

function showDashboard(isCachedData) {
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    document.getElementById('mainContent').classList.add('flex');
    
    // Mostrar botón de "Restaurar Demo" solo si estamos usando datos cacheados
    const clearBtn = document.getElementById('clearBtn');
    if (isCachedData) {
        clearBtn.classList.remove('hidden');
    } else {
        clearBtn.classList.add('hidden');
    }

    renderList(fullData);
    updateStats();
}

function updateStats() {
    const totalAv = fullData.reduce((s,l) => s + l.averias.length, 0);
    document.getElementById('stat-lifts').innerText = fullData.length;
    document.getElementById('stat-averias').innerText = totalAv;
    document.getElementById('stat-avg').innerText = (fullData.length ? (totalAv/fullData.length).toFixed(2) : 0);
}

// --- INTERFAZ DE USUARIO (TABS y MENÚS) ---

// Pestañas
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const view = tab.dataset.tab;
        
        // Activar pestaña visualmente
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Cambiar contenido
        document.getElementById('view-detalle').classList.add('hidden');
        document.getElementById('view-graficos').classList.add('hidden');
        document.getElementById(`view-${view}`).classList.remove('hidden');

        // Si es gráficos, renderizar charts
        if (view === 'graficos') {
            renderCharts(fullData);
        }
    });
});

// Menú Desplegable Instalaciones
document.getElementById('toggleMenuBtn').addEventListener('click', () => {
    const menu = document.getElementById('liftMenuContent');
    const chevron = document.getElementById('menuChevron');
    
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden'); 
        menu.classList.add('flex'); 
        chevron.classList.add('rotate-180');
    } else {
        menu.classList.add('hidden'); 
        menu.classList.remove('flex'); 
        chevron.classList.remove('rotate-180');
    }
});

// Buscador
document.getElementById('liftSearch').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = fullData.filter(l => l.id.toLowerCase().includes(term) || l.name.toLowerCase().includes(term));
    renderList(filtered);
});

// Botón Limpiar
document.getElementById('clearBtn').addEventListener('click', () => {
    if(confirm('¿Borrar datos importados y volver a la DEMO?')) {
        localStorage.removeItem(CACHE_KEY);
        location.reload();
    }
});

// --- RENDERIZADO DE LISTAS ---

function renderList(data) {
    const list = document.getElementById('liftList');
    list.innerHTML = '';
    
    data.forEach(lift => {
        const div = document.createElement('div');
        div.className = 'p-3 rounded border border-transparent hover:bg-red-50 hover:border-red-100 cursor-pointer flex justify-between items-center group transition-all';
        div.innerHTML = `
            <div class="overflow-hidden pr-2">
                <div class="text-xs font-mono font-bold text-slate-400 group-hover:text-mp-red transition-colors">${lift.id}</div>
                <div class="text-sm font-medium text-slate-700 truncate">${lift.name}</div>
            </div>
            <span class="text-xs font-bold px-2 py-1 rounded-full ${lift.averias.length > 0 ? 'bg-red-100 text-mp-red' : 'bg-slate-100 text-slate-400'}">${lift.averias.length}</span>
        `;
        div.onclick = () => showDetail(lift);
        list.appendChild(div);
    });
}

function showDetail(lift) {
    // Cerrar menú
    document.getElementById('liftMenuContent').classList.add('hidden');
    document.getElementById('liftMenuContent').classList.remove('flex');
    document.getElementById('menuChevron').classList.remove('rotate-180');

    // Mostrar panel detalle
    document.getElementById('selectLiftPrompt').classList.add('hidden');
    document.getElementById('liftDetailView').classList.remove('hidden');
    document.getElementById('liftDetailView').classList.add('flex');

    // Rellenar info
    document.getElementById('detailId').innerText = lift.id;
    document.getElementById('detailName').innerText = lift.name;
    document.getElementById('detailDate').innerText = lift.date;
    document.getElementById('detailCount').innerText = lift.averias.length;

    const container = document.getElementById('averiasContainer');
    
    if (lift.averias.length === 0) {
        container.innerHTML = `<div class="text-center py-10 text-slate-400 italic">Sin averías registradas</div>`;
        return;
    }

    container.innerHTML = lift.averias.map(av => {
        let badgeClass = "badge-otros";
        if(av.category === "Fallo Instalación") badgeClass = "badge-instalacion";
        if(av.category === "Fallo Montaje") badgeClass = "badge-montaje";
        
        return `
        <div class="averia-card">
            <div class="flex justify-between items-start mb-2">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">#${av.id}</span>
                    ${av.category ? `<span class="badge-categoria ${badgeClass}">${av.category}</span>` : ''}
                </div>
                <span class="text-xs text-slate-400 font-bold bg-slate-50 px-2 rounded">${av.date}</span>
            </div>
            <p class="text-sm text-slate-700">${av.desc}</p>
        </div>`;
    }).join('');
}

// --- PROCESAMIENTO DE EXCEL (Importar Archivos) ---
// Se mantiene la funcionalidad original para sobrescribir la demo

document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    toggleLoader(true);
    
    setTimeout(() => {
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, {header: 1, defval: ""});
                processData(rows);
            } catch (err) {
                console.error(err);
                alert("Error al procesar el archivo.");
            } finally {
                toggleLoader(false);
            }
        };
        reader.readAsArrayBuffer(file);
    }, 100);
});

function toggleLoader(show) {
    const loader = document.getElementById('loader');
    if(show) loader.classList.remove('hidden');
    else loader.classList.add('hidden');
}

function parseExcelDate(val) {
    if (!val) return '';
    let str = String(val).trim();
    if (str.includes('/') || str.includes('-')) return str;
    let n = parseFloat(str);
    if (!isNaN(n) && n > 10000) {
        let d = new Date(Math.round((n - 25569) * 86400 * 1000));
        d = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
        return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
    }
    return str;
}

function processData(rows) {
    let newData = [];
    let currentLift = null;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 5 || row.every(c => !c)) continue;

        const col2 = row[2] ? String(row[2]).trim() : '';
        const col3 = row[3] ? String(row[3]).trim() : '';

        // Lógica de detección (Idéntica al original)
        if (col2 && !col3 && !col2.toLowerCase().includes('ticket') && !col2.toLowerCase().includes('averia')) {
            let name = row[7] || row[4] || row[5] || "Sin Nombre";
            let date = row[18] ? parseExcelDate(row[18]) : '';
            if(!date) { 
                 for(let j=12; j<25; j++) if(String(row[j]).includes('/') || (!isNaN(parseFloat(row[j])) && parseFloat(row[j]) > 30000)) { date = parseExcelDate(row[j]); break; }
            }
            currentLift = { id: col2, name: String(name).trim(), date: date || "--/--/----", averias: [] };
            newData.push(currentLift);
        } 
        else if (col3 && !col2 && currentLift && !col3.toLowerCase().includes('averia')) {
            let desc = '';
            for(let j=4; j<15; j++) if(row[j]) { desc = String(row[j]).trim(); break; }
            let avDate = '';
            for(let j=15; j<row.length; j++) if(String(row[j]).includes('/') || (!isNaN(parseFloat(row[j])) && parseFloat(row[j]) > 30000)) { avDate = parseExcelDate(row[j]); break; }
            
            let cat = "Otros";
            for(let j=4; j<row.length; j++) {
                const txt = String(row[j]).toLowerCase();
                if (txt.includes('instalaci')) cat = "Fallo Instalación";
                else if (txt.includes('montaje')) cat = "Fallo Montaje";
                if (cat !== "Otros") break;
            }
            currentLift.averias.push({ id: col3, desc: desc, date: avDate || "--/--/----", category: cat });
        }
    }

    if (newData.length > 0) {
        newData.sort((a,b) => b.averias.length - a.averias.length);
        localStorage.setItem(CACHE_KEY, JSON.stringify(newData));
        location.reload(); // Recargar para aplicar cambios limpios
    } else {
        alert("No se encontraron datos válidos.");
    }
}