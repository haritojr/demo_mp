// --- VARIABLES GLOBALES ---
let fullData = [];
const CACHE_KEY = 'mp_averias_local_data';

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
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

    if (typeof DEMO_DATA !== 'undefined' && DEMO_DATA.length > 0) {
        console.log("Cargando modo DEMO");
        fullData = [...DEMO_DATA];
        showDashboard(false);
    } else {
        document.getElementById('emptyState').classList.remove('hidden');
    }
}

// --- GESTIÓN DE VISTAS Y DATOS ---

function showDashboard(isCachedData) {
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    
    // Configurar display flex para mainContent en CSS mediante clase, no inline
    // (Ya lo maneja la clase .main-content en CSS)

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

// --- INTERFAZ DE USUARIO ---

document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const view = tab.dataset.tab;
        if (!view) return; 
        
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Ocultar paneles
        document.getElementById('view-detalle').classList.add('hidden');
        document.getElementById('view-graficos').classList.add('hidden');
        
        // Mostrar panel seleccionado
        const viewEl = document.getElementById(`view-${view}`);
        if (viewEl) viewEl.classList.remove('hidden');

        if (view === 'graficos') {
            setTimeout(() => {
                if (typeof renderCharts === 'function') {
                    renderCharts(fullData);
                }
            }, 50); 
        }
    });
});

const toggleBtn = document.getElementById('toggleMenuBtn');
if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        const menu = document.getElementById('liftMenuContent');
        const chevron = document.getElementById('menuChevron');
        
        // Toggle simple de clase hidden
        if (menu.classList.contains('hidden')) {
            menu.classList.remove('hidden'); 
            chevron.style.transform = 'rotate(180deg)'; // Rotación manual en estilo inline ligero o clase
        } else {
            menu.classList.add('hidden'); 
            chevron.style.transform = 'rotate(0deg)';
        }
    });
}

const searchInput = document.getElementById('liftSearch');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = fullData.filter(l => l.id.toLowerCase().includes(term) || l.name.toLowerCase().includes(term));
        renderList(filtered);
    });
}

const clearBtn = document.getElementById('clearBtn');
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        if(confirm('¿Borrar datos importados y volver a la DEMO?')) {
            localStorage.removeItem(CACHE_KEY);
            location.reload();
        }
    });
}

// --- RENDERIZADO DE LISTAS (Actualizado a Clases Semánticas) ---

function renderList(data) {
    const list = document.getElementById('liftList');
    if (!list) return;
    list.innerHTML = '';
    
    data.forEach(lift => {
        const div = document.createElement('div');
        // Aquí usamos la clase 'list-item' definida en styles.css en lugar de Tailwind
        div.className = 'list-item'; 
        
        // Determinar clase para badge
        const badgeClass = lift.averias.length > 0 ? 'list-badge has-averias' : 'list-badge';

        div.innerHTML = `
            <div style="overflow: hidden; padding-right: 0.5rem;">
                <span class="list-item-code">${lift.id}</span>
                <div class="list-item-name">${lift.name}</div>
            </div>
            <span class="${badgeClass}">${lift.averias.length}</span>
        `;
        div.onclick = () => showDetail(lift);
        list.appendChild(div);
    });
}

function showDetail(lift) {
    // Cerrar menú en móvil
    const menu = document.getElementById('liftMenuContent');
    if(!menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
        document.getElementById('menuChevron').style.transform = 'rotate(0deg)';
    }

    document.getElementById('selectLiftPrompt').classList.add('hidden');
    document.getElementById('liftDetailView').classList.remove('hidden');

    document.getElementById('detailId').innerText = lift.id;
    document.getElementById('detailName').innerText = lift.name;
    document.getElementById('detailDate').innerText = lift.date;
    document.getElementById('detailCount').innerText = lift.averias.length;

    const container = document.getElementById('averiasContainer');
    
    if (lift.averias.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #94a3b8; font-style: italic;">Sin averías registradas</div>`;
        return;
    }

    container.innerHTML = lift.averias.map(av => {
        let catClass = "cat-otros";
        if(av.category === "Fallo Instalación") catClass = "cat-instalacion";
        if(av.category === "Fallo Montaje") catClass = "cat-montaje";
        
        // Usamos clases semánticas 'averia-card', 'badge-cat', etc.
        return `
        <div class="averia-card">
            <div class="averia-header">
                <div style="display: flex; align-items: center;">
                    <span class="averia-id">#${av.id}</span>
                    ${av.category ? `<span class="badge-cat ${catClass}">${av.category}</span>` : ''}
                </div>
                <span class="averia-date">${av.date}</span>
            </div>
            <p class="averia-desc">${av.desc}</p>
        </div>`;
    }).join('');
}

// --- PROCESAMIENTO EXCEL (Sin cambios lógicos, solo visuales si hubiera) ---

const fileInput = document.getElementById('fileInput');
if (fileInput) {
    fileInput.addEventListener('change', function(e) {
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
}

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
        location.reload(); 
    } else {
        alert("No se encontraron datos válidos.");
    }
}