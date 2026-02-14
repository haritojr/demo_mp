// --- VARIABLES GLOBALES ---
let fullData = [];
let currentFilteredData = []; 
const CACHE_KEY = 'mp_averias_local_data';

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    // Forzamos un tiempo mínimo de carga para que se vea el logo (Efecto Premium)
    setTimeout(() => {
        initApp();
    }, 1500); // 1.5 segundos de "branding"
});

function initApp() {
    const cached = localStorage.getItem(CACHE_KEY);
    
    // Ocultar loader tras la espera
    const loader = document.getElementById('loader');
    if(loader) {
        loader.classList.add('fade-out'); // Clase para desvanecer suavemente
        setTimeout(() => loader.classList.add('hidden'), 500); // Esperar a que termine la transición
    }

    if (cached) {
        try {
            const parsedData = JSON.parse(cached);
            if (parsedData && parsedData.length > 0) {
                fullData = parsedData;
                currentFilteredData = [...fullData];
                showDashboard(true);
                return;
            }
        } catch (e) { console.error("Error caché", e); }
    }

    if (typeof DEMO_DATA !== 'undefined' && DEMO_DATA.length > 0) {
        fullData = [...DEMO_DATA];
        currentFilteredData = [...fullData];
        showDashboard(false);
    } else {
        document.getElementById('emptyState').classList.remove('hidden');
    }
}

// --- GESTIÓN DE VISTAS ---
function showDashboard(isCachedData) {
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        isCachedData ? clearBtn.classList.remove('hidden') : clearBtn.classList.add('hidden');
    }

    renderList(currentFilteredData);
    updateStats();
}

// --- FILTROS AVANZADOS ---
const dateStartInput = document.getElementById('dateStart');
const dateEndInput = document.getElementById('dateEnd');
const searchInput = document.getElementById('liftSearch');
const resetBtn = document.getElementById('resetFilters');

const clearBtn = document.getElementById('clearBtn');
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        if(confirm('¿Borrar datos importados y volver a la DEMO?')) {
            localStorage.removeItem(CACHE_KEY);
            location.reload();
        }
    });
}

if(dateStartInput && dateEndInput && searchInput) {
    [dateStartInput, dateEndInput, searchInput].forEach(el => {
        el.addEventListener('input', applyFilters);
    });
}

if(resetBtn) {
    resetBtn.addEventListener('click', () => {
        dateStartInput.value = '';
        dateEndInput.value = '';
        searchInput.value = '';
        applyFilters();
    });
}

function parseDateString(dateStr) {
    if (!dateStr || dateStr === "--/--/----") return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

function applyFilters() {
    const term = searchInput.value.toLowerCase();
    const startDate = dateStartInput.value ? new Date(dateStartInput.value) : null;
    const endDate = dateEndInput.value ? new Date(dateEndInput.value) : null;

    currentFilteredData = fullData.map(lift => {
        const filteredAverias = lift.averias.filter(av => {
            const avDate = parseDateString(av.date);
            if (!avDate) return true; 
            if (startDate && avDate < startDate) return false;
            if (endDate && avDate > endDate) return false;
            return true;
        });
        return { ...lift, averias: filteredAverias };
    }).filter(lift => {
        const matchesName = lift.id.toLowerCase().includes(term) || lift.name.toLowerCase().includes(term);
        const matchesBreakdown = lift.averias.some(av => 
            av.desc.toLowerCase().includes(term) || 
            (av.category && av.category.toLowerCase().includes(term))
        );
        if (term && !matchesName && !matchesBreakdown) return false;
        return true;
    });

    renderList(currentFilteredData);
    updateStats();
    
    if (!document.getElementById('view-graficos').classList.contains('hidden')) {
        if (typeof renderCharts === 'function') renderCharts(currentFilteredData);
    }
}

// --- ESTADÍSTICAS Y MTBF ---
function updateStats() {
    const totalAv = currentFilteredData.reduce((s,l) => s + l.averias.length, 0);
    const affectedLifts = currentFilteredData.filter(l => l.averias.length > 0).length;
    
    let daysRange = 365;
    if (dateStartInput.value && dateEndInput.value) {
        const d1 = new Date(dateStartInput.value);
        const d2 = new Date(dateEndInput.value);
        daysRange = Math.max(1, (d2 - d1) / (1000 * 60 * 60 * 24));
    }
    
    const globalMTBF = totalAv > 0 ? (daysRange * affectedLifts / totalAv).toFixed(0) : "--";

    document.getElementById('stat-lifts').innerText = affectedLifts;
    document.getElementById('stat-averias').innerText = totalAv;
    document.getElementById('stat-mtbf').innerText = globalMTBF;
}

// --- RENDERIZADO ---
function renderList(data) {
    const list = document.getElementById('liftList');
    if(!list) return;
    list.innerHTML = '';
    
    const sortedData = [...data].sort((a,b) => b.averias.length - a.averias.length);

    sortedData.forEach((lift, index) => {
        const div = document.createElement('div');
        const count = lift.averias.length;
        
        let statusClass = 'status-ok'; 
        if (count >= 5) statusClass = 'status-critical'; 
        else if (count >= 2) statusClass = 'status-warning'; 

        div.className = `list-item ${statusClass}`;
        div.style.animationDelay = `${index * 0.05}s`; 

        div.innerHTML = `
            <div style="overflow: hidden; padding-right: 0.5rem;">
                <span style="font-size:0.7rem; font-weight:bold; color:#94a3b8;">${lift.id}</span>
                <div style="font-size:0.85rem; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${lift.name}</div>
            </div>
            <span class="list-badge">${count}</span>
        `;
        div.onclick = () => showDetail(lift);
        list.appendChild(div);
    });
}

// --- DETALLE ---
function showDetail(lift) {
    document.getElementById('selectLiftPrompt').classList.add('hidden');
    document.getElementById('liftDetailView').classList.remove('hidden');

    document.getElementById('detailId').innerText = lift.id;
    document.getElementById('detailName').innerText = lift.name;
    document.getElementById('detailDate').innerText = lift.date;
    
    const countEl = document.getElementById('detailCount');
    const bloqueEl = document.getElementById('statBloqueColor');
    
    countEl.innerText = lift.averias.length;
    
    bloqueEl.classList.remove('bg-crit', 'bg-warn', 'bg-ok');
    
    if (lift.averias.length >= 5) bloqueEl.classList.add('bg-crit');
    else if (lift.averias.length >= 2) bloqueEl.classList.add('bg-warn');
    else bloqueEl.classList.add('bg-ok');

    let daysRange = 365; 
    if (dateStartInput.value && dateEndInput.value) {
        daysRange = (new Date(dateEndInput.value) - new Date(dateStartInput.value)) / (1000 * 3600 * 24);
        if (daysRange < 1) daysRange = 1;
    }
    const mtbf = lift.averias.length > 0 ? (daysRange / lift.averias.length).toFixed(0) : "∞";
    document.getElementById('detailMtbf').innerText = mtbf + " días";

    const container = document.getElementById('averiasContainer');
    if (lift.averias.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: #94a3b8; font-style: italic;">Sin averías en este periodo</div>`;
        return;
    }

    container.innerHTML = lift.averias.map(av => {
        let catClass = "cat-otros";
        if(av.category === "Fallo Instalación") catClass = "cat-instalacion";
        if(av.category === "Fallo Montaje") catClass = "cat-montaje";
        
        return `
        <div class="averia-card">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <div><span style="font-weight:bold; font-family:monospace;">#${av.id}</span> <span style="font-size:0.7rem; background:#f1f5f9; padding:2px 5px; border-radius:4px;">${av.category}</span></div>
                <span style="font-size:0.75rem; color:#64748b; font-weight:bold;">${av.date}</span>
            </div>
            <p style="font-size:0.85rem; margin:0;">${av.desc}</p>
        </div>`;
    }).join('');
}

// --- INTERFAZ ---
const toggleBtn = document.getElementById('toggleMenuBtn');
if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        const menu = document.getElementById('liftMenuContent');
        const chevron = document.getElementById('menuChevron');
        if (menu.classList.contains('hidden')) {
            menu.classList.remove('hidden'); 
            chevron.style.transform = 'rotate(180deg)';
        } else {
            menu.classList.add('hidden'); 
            chevron.style.transform = 'rotate(0deg)';
        }
    });
}

document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const view = tab.dataset.tab;
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        document.getElementById('view-detalle').classList.add('hidden');
        document.getElementById('view-graficos').classList.add('hidden');
        document.getElementById(`view-${view}`).classList.remove('hidden');

        if (view === 'graficos') {
            setTimeout(() => { if (typeof renderCharts === 'function') renderCharts(currentFilteredData); }, 50);
        }
    });
});

// --- PROCESAMIENTO EXCEL CORREGIDO ---
const fileInput = document.getElementById('fileInput');
if (fileInput) {
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        document.getElementById('loader').classList.remove('hidden');
        // Quitar la clase fade-out por si se reutiliza el loader
        document.getElementById('loader').classList.remove('fade-out');
        
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
                    alert("Error al procesar el archivo. Verifica el formato.");
                } finally { 
                    // Transición de salida del loader
                    const l = document.getElementById('loader');
                    l.classList.add('fade-out');
                    setTimeout(() => l.classList.add('hidden'), 500);
                    e.target.value = ''; 
                }
            };
            reader.readAsArrayBuffer(file);
        }, 1000); // Pequeño delay también al cargar archivo
    });
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
        localStorage.setItem(CACHE_KEY, JSON.stringify(newData));
        location.reload(); 
    } else { 
        alert("No se encontraron datos válidos en el archivo Excel. Verifica la estructura."); 
    }
}