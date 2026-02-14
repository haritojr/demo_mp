// --- DATOS SIMULADOS PARA DEMOSTRACIÓN ---
// Esto permite que el dashboard funcione sin subir archivo
const DEMO_DATA = [
    {
        id: "MP-1024",
        name: "RESIDENCIAL JARDINES DEL SUR",
        date: "15/01/2023",
        averias: [
            { id: "TK-9001", desc: "Puerta de cabina no cierra correctamente", date: "10/02/2023", category: "Fallo Instalación" },
            { id: "TK-9005", desc: "Ruido en polea de tracción", date: "15/02/2023", category: "Otros" },
            { id: "TK-9120", desc: "Ajuste de operador de puertas", date: "01/03/2023", category: "Fallo Montaje" },
            { id: "TK-9155", desc: "Desnivel en planta baja", date: "12/03/2023", category: "Fallo Instalación" }
        ]
    },
    {
        id: "MP-2048",
        name: "CENTRO COMERCIAL ALCALÁ",
        date: "20/05/2023",
        averias: [
            { id: "TK-8001", desc: "Botonera de cabina bloqueada", date: "22/06/2023", category: "Otros" },
            { id: "TK-8002", desc: "Luz de emergencia fundida", date: "05/07/2023", category: "Otros" },
            { id: "TK-8015", desc: "Parada brusca en planta 2", date: "10/08/2023", category: "Fallo Montaje" }
        ]
    },
    {
        id: "MP-3050",
        name: "HOSPITAL GENERAL (MONTACARGAS)",
        date: "01/01/2022",
        averias: [
            { id: "TK-7010", desc: "Fallo en variador de frecuencia", date: "10/01/2023", category: "Fallo Instalación" },
            { id: "TK-7022", desc: "Ruido excesivo en guías", date: "12/02/2023", category: "Fallo Montaje" },
            { id: "TK-7033", desc: "Puertas no abren en planta 5", date: "14/02/2023", category: "Otros" },
            { id: "TK-7045", desc: "Revisión preventiva correctiva", date: "20/03/2023", category: "Otros" },
            { id: "TK-7050", desc: "Cambio de cables de tracción", date: "25/03/2023", category: "Otros" },
            { id: "TK-7060", desc: "Fallo placa electrónica maniobra", date: "01/04/2023", category: "Fallo Instalación" }
        ]
    },
    {
        id: "MP-4100",
        name: "COMUNIDAD PROPIETARIOS AVENIDA",
        date: "10/10/2023",
        averias: [
            { id: "TK-6001", desc: "Fotocélula sucia o desajustada", date: "15/11/2023", category: "Otros" }
        ]
    },
    {
        id: "MP-5500",
        name: "EDIFICIO OFICINAS TORRE NORTE",
        date: "05/03/2023",
        averias: []
    }
];