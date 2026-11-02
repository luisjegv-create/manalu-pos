export const INVENTORY_CATEGORIES = [
    { id: 'mariscos', label: 'Mariscos', icon: '🦐' },
    { id: 'carnes', label: 'Carnes', icon: '🥩' },
    { id: 'pescados', label: 'Pescados', icon: '🐟' },
    { id: 'raciones', label: 'Raciones y Huevos', icon: '🍳' },
    { id: 'postres', label: 'Postres', icon: '🍰' },
    { id: 'bebidas', label: 'Bebidas (Botellas/Tercios)', icon: '🍺' },
    { id: 'vinos', label: 'Vinos por Botella', icon: '🍷' }
];

export const DEFAULT_SELECTIVE_INVENTORY = [
    // ================= 1. MARISCOS =================
    {
        id: 'inv_gamba_blanca',
        name: 'Gamba Blanca de Huelva',
        category: 'mariscos',
        unit: 'raciones',
        stock: 0,
        minStock: 6,
        rules: [
            { match: 'gamba de huelva plancha', factor: 1, label: 'Ración 200g (1 rac)' },
            { match: 'media racion gamba plancha huelva', factor: 0.5, label: 'Media 90g (0.5 rac)' }
        ]
    },
    {
        id: 'inv_gamba_roja_rac',
        name: 'Gamba Roja Alistada (Raciones 250g)',
        category: 'mariscos',
        unit: 'raciones',
        stock: 0,
        minStock: 5,
        rules: [
            { match: 'gamba roja alistada 250g', factor: 1, label: 'Ración 250g (1 rac)' }
        ]
    },
    {
        id: 'inv_gamba_roja_ud',
        name: 'Gamba Roja Alistada (Unidades sueltas)',
        category: 'mariscos',
        unit: 'uds',
        stock: 0,
        minStock: 12,
        rules: [
            { match: 'gamba roja alistada, unidad', factor: 1, label: 'Unidad suelta (1 ud)' }
        ]
    },
    {
        id: 'inv_ostras',
        name: 'Ostras',
        category: 'mariscos',
        unit: 'uds',
        stock: 0,
        minStock: 12,
        rules: [
            { match: 'ostras', factor: 1, label: 'Ostra unidad (1 ud)' }
        ]
    },
    {
        id: 'inv_zamburinas',
        name: 'Zamburiñas',
        category: 'mariscos',
        unit: 'uds',
        stock: 0,
        minStock: 24,
        rules: [
            { match: 'zamburina unidad', factor: 1, label: 'Zamburiña unidad (1 ud)' }
        ]
    },
    {
        id: 'inv_tortitas_camaron',
        name: 'Tortitas de Camarón',
        category: 'mariscos',
        unit: 'uds',
        stock: 0,
        minStock: 20,
        rules: [
            { match: 'tortita de camaron', factor: 1, label: 'Tortita unidad (1 ud)' }
        ]
    },
    {
        id: 'inv_almejas',
        name: 'Almejas',
        category: 'mariscos',
        unit: 'raciones',
        stock: 0,
        minStock: 5,
        rules: [
            { match: 'almeja a la marinera', factor: 1, label: 'Ración (1 rac)' },
            { match: 'almeja media', factor: 0.5, label: 'Media ración (0.5 rac)' }
        ]
    },
    {
        id: 'inv_berberechos',
        name: 'Berberechos',
        category: 'mariscos',
        unit: 'raciones',
        stock: 0,
        minStock: 4,
        rules: [
            { match: 'berberechos', factor: 1, label: 'Ración (1 rac)' }
        ]
    },
    {
        id: 'inv_coquinas',
        name: 'Coquinas (250g)',
        category: 'mariscos',
        unit: 'raciones',
        stock: 0,
        minStock: 4,
        rules: [
            { match: 'coquina 250g', factor: 1, label: 'Ración 250g (1 rac)' }
        ]
    },
    {
        id: 'inv_navajas',
        name: 'Navajas Gallegas',
        category: 'mariscos',
        unit: 'raciones',
        stock: 0,
        minStock: 5,
        rules: [
            { match: 'navajas gallegas', factor: 1, label: 'Ración (1 rac)' }
        ]
    },
    {
        id: 'inv_langostinos',
        name: 'Langostinos al Ajillo',
        category: 'mariscos',
        unit: 'raciones',
        stock: 0,
        minStock: 6,
        rules: [
            { match: 'langostino al ajillo', factor: 1, label: 'Langostinos al ajillo (1 rac)' },
            { match: 'huevos rotos con langostino ajillo', factor: 1, label: 'Huevos rotos con langostinos (1 rac)' }
        ]
    },

    // ================= 2. CARNES =================
    {
        id: 'inv_entrecot',
        name: 'Entrecot Lomo Bajo',
        category: 'carnes',
        unit: 'uds',
        stock: 0,
        minStock: 6,
        rules: [
            { match: 'entrecot lomo bajo', factor: 1, label: 'Entrecot (1 ud)' }
        ]
    },
    {
        id: 'inv_chuleton_angus',
        name: 'Chuletón de Angus (500g)',
        category: 'carnes',
        unit: 'uds',
        stock: 0,
        minStock: 5,
        rules: [
            { match: 'chuleton de angus', factor: 1, label: 'Chuletón Angus 500g (1 ud)' }
        ]
    },
    {
        id: 'inv_solomillo_vaca',
        name: 'Solomillo de Vaca',
        category: 'carnes',
        unit: 'uds',
        stock: 0,
        minStock: 6,
        rules: [
            { match: 'solomillo de vaca', factor: 1, label: 'Solomillo de Vaca (1 ud)' }
        ]
    },
    {
        id: 'inv_chuleta_vaca_madurada',
        name: 'Chuleta / Chuletón de Vaca Madurada (Todas las pesadas)',
        category: 'carnes',
        unit: 'uds',
        stock: 0,
        minStock: 6,
        rules: [
            { match: 'chuleta vaca madurada', factor: 1, label: 'Chuleta vaca madurada 850g/900g (1 pieza)' },
            { match: 'chuleton de vaca madurad', factor: 1, label: 'Chuletón vaca madurada 920g-1.3k (1 pieza)' },
            { match: 'chuleton de vaca nadurada', factor: 1, label: 'Chuletón vaca madurada 1.25k (1 pieza)' }
        ]
    },
    {
        id: 'inv_paletilla_lechal',
        name: 'Paletilla de Cordero Lechal',
        category: 'carnes',
        unit: 'uds',
        stock: 0,
        minStock: 4,
        rules: [
            { match: 'paletilla de cordero lechal', factor: 1, label: 'Paletilla lechal (1 ud)' }
        ]
    },
    {
        id: 'inv_jamoncito_cochinillo',
        name: 'Jamoncito de Cochinillo',
        category: 'carnes',
        unit: 'uds',
        stock: 0,
        minStock: 4,
        rules: [
            { match: 'jamoncito de cochinillo', factor: 1, label: 'Jamoncito cochinillo (1 ud)' }
        ]
    },
    {
        id: 'inv_presa_iberica',
        name: 'Presa Ibérica',
        category: 'carnes',
        unit: 'raciones',
        stock: 0,
        minStock: 5,
        rules: [
            { match: 'presa iberica', factor: 1, label: 'Presa Ibérica (1 rac)' }
        ]
    },
    {
        id: 'inv_rabo_toro',
        name: 'Rabo de Toro en Salsa',
        category: 'carnes',
        unit: 'raciones',
        stock: 0,
        minStock: 4,
        rules: [
            { match: 'rabo de toro en salsa', factor: 1, label: 'Rabo de toro (1 rac)' }
        ]
    },
    {
        id: 'inv_chuletas_lechal',
        name: 'Chuletas de Cordero Lechal / Manchego',
        category: 'carnes',
        unit: 'uds',
        stock: 0,
        minStock: 30,
        rules: [
            { match: 'chuletas de cordero manchego', factor: 1, label: 'Chuleta suelta (1 ud)' },
            { match: 'chuletas de lechal (racion 6)', factor: 6, label: 'Ración 6 chuletas (6 uds)' },
            { match: 'chuletitas de lechal manchego (10 uni)', factor: 10, label: 'Ración 10 chuletitas (10 uds)' },
            { match: 'racion de chuletas de lechal (10 unidades)', factor: 10, label: 'Ración 10 chuletas (10 uds)' }
        ]
    },
    {
        id: 'inv_chuletas_iberico',
        name: 'Chuletas de Ibérico',
        category: 'carnes',
        unit: 'raciones',
        stock: 0,
        minStock: 4,
        rules: [
            { match: 'chuletas de iberico', factor: 1, label: 'Ración chuletas ibérico (1 rac)' }
        ]
    },
    {
        id: 'inv_filetes_venado',
        name: 'Filetes de Venado',
        category: 'carnes',
        unit: 'raciones',
        stock: 0,
        minStock: 4,
        rules: [
            { match: 'filetes de venado', factor: 1, label: 'Filetes de venado (1 rac)' }
        ]
    },
    {
        id: 'inv_asadura_lechal',
        name: 'Asadura de Cordero Lechal',
        category: 'carnes',
        unit: 'raciones',
        stock: 0,
        minStock: 3,
        rules: [
            { match: 'asadura de cordero lechal', factor: 1, label: 'Asadura lechal (1 rac)' }
        ]
    },
    {
        id: 'inv_hamburguesa_manalu',
        name: 'Hamburguesa "Manalú"',
        category: 'carnes',
        unit: 'uds',
        stock: 0,
        minStock: 10,
        rules: [
            { match: 'hamburguesa "manalu"', factor: 1, label: 'Hamburguesa Manalú (1 ud)' }
        ]
    },
    {
        id: 'inv_burguer_krispi',
        name: 'Burguer Krispi (Pollo)',
        category: 'carnes',
        unit: 'uds',
        stock: 0,
        minStock: 8,
        rules: [
            { match: 'burguer krispi', factor: 1, label: 'Burguer Krispi (1 ud)' }
        ]
    },

    // ================= 3. PESCADOS =================
    {
        id: 'inv_merluza',
        name: 'Ración de Merluza / Merluza Gallega',
        category: 'pescados',
        unit: 'raciones',
        stock: 0,
        minStock: 6,
        rules: [
            { match: 'racion de merluza', factor: 1, label: 'Ración de Merluza (1 rac)' }
        ]
    },
    {
        id: 'inv_morrillo_merluza',
        name: 'Morrillo de Merluza',
        category: 'pescados',
        unit: 'uds',
        stock: 0,
        minStock: 3,
        rules: [
            { match: 'morrillo de merluza', factor: 1, label: 'Morrillo de merluza (1 ud)' }
        ]
    },
    {
        id: 'inv_bacalao',
        name: 'Bacalao El Barquero',
        category: 'pescados',
        unit: 'raciones',
        stock: 0,
        minStock: 6,
        rules: [
            { match: 'bacalao el barquero', factor: 1, label: 'Bacalao El Barquero (1 rac)' }
        ]
    },
    {
        id: 'inv_sapito_rape',
        name: 'Sapito de Rape (1,3k)',
        category: 'pescados',
        unit: 'uds',
        stock: 0,
        minStock: 4,
        rules: [
            { match: 'sapito de rape', factor: 1, label: 'Sapito de Rape (1 pieza)' }
        ]
    },
    {
        id: 'inv_rodaballo',
        name: 'Rodaballo (1,2k / 1,3k)',
        category: 'pescados',
        unit: 'uds',
        stock: 0,
        minStock: 4,
        rules: [
            { match: 'rodaballo', factor: 1, label: 'Rodaballo 1.2k/1.3k (1 pieza)' }
        ]
    },
    {
        id: 'inv_filete_atun_rojo',
        name: 'Filete de Atún Rojo (350g)',
        category: 'pescados',
        unit: 'uds',
        stock: 0,
        minStock: 5,
        rules: [
            { match: 'filete de atun rojo', factor: 1, label: 'Filete Atún Rojo 350g (1 ud)' }
        ]
    },
    {
        id: 'inv_tacos_atun_rojo',
        name: 'Tacos de Atún Rojo al Ajillo',
        category: 'pescados',
        unit: 'raciones',
        stock: 0,
        minStock: 5,
        rules: [
            { match: 'tacos de atun rojo', factor: 1, label: 'Tacos de Atún Rojo (1 rac)' }
        ]
    },
    {
        id: 'inv_calamar_potera',
        name: 'Calamar de Potera Nacional',
        category: 'pescados',
        unit: 'raciones',
        stock: 0,
        minStock: 6,
        rules: [
            { match: 'calamar de de potera', factor: 1, label: 'Calamar potera (1 rac)' },
            { match: 'calamar de potera', factor: 1, label: 'Calamar potera (1 rac)' }
        ]
    },

    // ================= 4. RACIONES ESPECIALES Y UNIDADES CLAVE =================
    {
        id: 'inv_huevo_oca',
        name: 'Huevo de Oca (Suelto + Mansos de Oca-ña)',
        category: 'raciones',
        unit: 'uds',
        stock: 0,
        minStock: 12,
        rules: [
            { match: 'huevo de oca', factor: 1, label: 'Huevo de Oca suelto (1 ud)' },
            { match: 'mansos de oca-na', factor: 1, label: 'Mansos de Oca-ña (1 huevo de oca)' }
        ]
    },
    {
        id: 'inv_alcachofa',
        name: 'Flor de Alcachofa de Tudela XXL',
        category: 'raciones',
        unit: 'uds',
        stock: 0,
        minStock: 15,
        rules: [
            { match: 'flor de alcachofa', factor: 1, label: 'Flor de Alcachofa XXL (1 ud)' }
        ]
    },
    {
        id: 'inv_molleja_ternera',
        name: 'Molleja de Ternera',
        category: 'raciones',
        unit: 'raciones',
        stock: 0,
        minStock: 8,
        rules: [
            { match: 'molleja de ternera al ajillo', factor: 1, label: 'Ración Molleja (1 rac)' },
            { match: 'media de molleja', factor: 0.5, label: 'Media de Molleja (0.5 rac)' },
            { match: 'bocata de mollejas', factor: 0.5, label: 'Bocata de Mollejas (0.5 rac)' },
            { match: 'montado de mollejas', factor: 0.25, label: 'Montado de Mollejas (0.25 rac)' }
        ]
    },
    {
        id: 'inv_croqueta_gamba',
        name: 'Croquetas Gourmet de Gamba Roja',
        category: 'raciones',
        unit: 'uds',
        stock: 0,
        minStock: 40,
        rules: [
            { match: 'croqueta gamba roja unidad', factor: 1, label: 'Unidad suelta (1 ud)' },
            { match: 'media racion de croqueta de gamba roja', factor: 5, label: 'Media ración (5 uds)' },
            { match: 'croqueta gourmet gamba roja (10 uni)', factor: 10, label: 'Ración completa (10 uds)' },
            { match: 'mixta de croqueta gourmet (6 gamba y 4 pollo)', factor: 6, label: 'Ración Mixta (6 uds gamba)' }
        ]
    },
    {
        id: 'inv_croqueta_pollo',
        name: 'Croquetas Gourmet de Pollo de Corral',
        category: 'raciones',
        unit: 'uds',
        stock: 0,
        minStock: 30,
        rules: [
            { match: 'croqueta de pollo unidad', factor: 1, label: 'Unidad suelta (1 ud)' },
            { match: 'croqueta pollo unidad', factor: 1, label: 'Unidad suelta (1 ud)' },
            { match: 'media racion de croqueta gourmet pollo', factor: 3, label: 'Media ración (3 uds)' },
            { match: 'croqueta gourmet pollo de corral (6 unidades)', factor: 6, label: 'Ración completa (6 uds)' },
            { match: 'mixta de croqueta gourmet (6 gamba y 4 pollo)', factor: 4, label: 'Ración Mixta (4 uds pollo)' }
        ]
    },
    {
        id: 'inv_croqueta_jamon',
        name: 'Croquetas Gourmet de Jamón Ibérico',
        category: 'raciones',
        unit: 'uds',
        stock: 0,
        minStock: 30,
        rules: [
            { match: 'croqueta gourmet jamon iberico 1 unidad', factor: 1, label: 'Unidad suelta (1 ud)' },
            { match: 'croqueta gourmet jamon iberico', exact: true, factor: 6, label: 'Ración completa (6 uds)' },
            { match: 'mixta croqueta con jamon iberico', factor: 4, label: 'Ración Mixta con Jamón (4 uds)' }
        ]
    },
    {
        id: 'inv_torreznos',
        name: 'Torreznos con Mojo Picón',
        category: 'raciones',
        unit: 'uds',
        stock: 0,
        minStock: 12,
        rules: [
            { match: 'media de torreznos', factor: 1, label: 'Media de Torreznos (1 ud)' },
            { match: 'racion de torreznos', factor: 2, label: 'Ración de Torreznos (2 uds)' }
        ]
    },
    {
        id: 'inv_minutejos',
        name: 'Minutejos',
        category: 'raciones',
        unit: 'raciones',
        stock: 0,
        minStock: 6,
        rules: [
            { match: 'minutejos', exact: true, factor: 1, label: 'Ración Minutejos (1 rac)' },
            { match: 'racion de minutejos doble', factor: 2, label: 'Ración Doble (2 rac)' },
            { match: 'racion doble minutejos', factor: 2, label: 'Ración Doble (2 rac)' },
            { match: 'bocata de minutejos', factor: 0.5, label: 'Bocata de Minutejos (0.5 rac)' },
            { match: 'montado de minutejos', factor: 0.25, label: 'Montado de Minutejos (0.25 rac)' }
        ]
    },
    {
        id: 'inv_caracoles',
        name: 'Caracoles',
        category: 'raciones',
        unit: 'raciones',
        stock: 0,
        minStock: 5,
        rules: [
            { match: 'caracoles', exact: true, factor: 1, label: 'Ración Caracoles (1 rac)' },
            { match: 'media de caracoles', factor: 0.5, label: 'Media de Caracoles (0.5 rac)' }
        ]
    },
    {
        id: 'inv_rabas',
        name: 'Rabas de Calamar',
        category: 'raciones',
        unit: 'raciones',
        stock: 0,
        minStock: 6,
        rules: [
            { match: 'rabas de calamar', factor: 1, label: 'Rabas de Calamar (1 rac)' }
        ]
    },
    {
        id: 'inv_puntillas',
        name: 'Puntillas',
        category: 'raciones',
        unit: 'raciones',
        stock: 0,
        minStock: 6,
        rules: [
            { match: 'puntillas', factor: 1, label: 'Puntillas (1 rac)' }
        ]
    },
    {
        id: 'inv_bienmesabe',
        name: 'Bienmesabe (Cazón en adobo)',
        category: 'raciones',
        unit: 'raciones',
        stock: 0,
        minStock: 5,
        rules: [
            { match: 'bienmesabe', factor: 1, label: 'Bienmesabe (1 rac)' }
        ]
    },
    {
        id: 'inv_anchoas',
        name: 'Anchoas del Cantábrico',
        category: 'raciones',
        unit: 'raciones',
        stock: 0,
        minStock: 5,
        rules: [
            { match: 'anchoa del cantabrico', factor: 1, label: 'Anchoas Yurrita AOVE (1 rac)' },
            { match: 'anchoa de cantabrico', factor: 1, label: 'Anchoa del Cantábrico (1 rac)' }
        ]
    },
    {
        id: 'inv_burrata',
        name: 'Burrata (Unidades)',
        category: 'raciones',
        unit: 'uds',
        stock: 0,
        minStock: 6,
        rules: [
            { match: 'ensalada de tomate y burrata', factor: 1, label: 'Ensalada Tomate y Burrata (1 ud)' },
            { match: 'media de burrata', factor: 0.5, label: 'Media de Burrata (0.5 ud)' }
        ]
    },

    // ================= 5. POSTRES =================
    {
        id: 'inv_tarta_chocolate',
        name: 'Tarta de Muerte por Chocolate',
        category: 'postres',
        unit: 'uds',
        stock: 0,
        minStock: 8,
        rules: [
            { match: 'tarta de muerte por chocolate', factor: 1, label: 'Porción Tarta Chocolate (1 ud)' }
        ]
    },
    {
        id: 'inv_tarta_queso',
        name: 'Tarta de Queso',
        category: 'postres',
        unit: 'uds',
        stock: 0,
        minStock: 10,
        rules: [
            { match: 'tarta de queso', exact: true, factor: 1, label: 'Porción Tarta de Queso (1 ud)' }
        ]
    },
    {
        id: 'inv_tarta_queso_caramelo',
        name: 'Tarta de Queso y Caramelo',
        category: 'postres',
        unit: 'uds',
        stock: 0,
        minStock: 8,
        rules: [
            { match: 'tarta de queso y caramelo', factor: 1, label: 'Porción Tarta Queso y Caramelo (1 ud)' }
        ]
    },
    {
        id: 'inv_tarta_cookies',
        name: 'Tarta Helada de Cookies & Nata',
        category: 'postres',
        unit: 'uds',
        stock: 0,
        minStock: 8,
        rules: [
            { match: 'tarta helada de cookies', factor: 1, label: 'Porción Tarta Cookies (1 ud)' }
        ]
    },
    {
        id: 'inv_torrija',
        name: 'Torrija de Pan Brioche',
        category: 'postres',
        unit: 'uds',
        stock: 0,
        minStock: 10,
        rules: [
            { match: 'torrija de pan brioche', factor: 1, label: 'Torrija Brioche (1 ud)' }
        ]
    },
    {
        id: 'inv_coulant',
        name: 'Coulant de Chocolate',
        category: 'postres',
        unit: 'uds',
        stock: 0,
        minStock: 8,
        rules: [
            { match: 'coulan de chocolate', factor: 1, label: 'Coulant de Chocolate (1 ud)' }
        ]
    },
    {
        id: 'inv_freson_nata',
        name: 'Fresón con Nata',
        category: 'postres',
        unit: 'raciones',
        stock: 0,
        minStock: 8,
        rules: [
            { match: 'freson con nata', factor: 1, label: 'Ración Fresón con Nata (1 rac)' }
        ]
    },
    {
        id: 'inv_maxibon',
        name: 'Maxibon Helado',
        category: 'postres',
        unit: 'uds',
        stock: 0,
        minStock: 10,
        rules: [
            { match: 'maxibon', factor: 1, label: 'Maxibon (1 ud)' }
        ]
    },

    // ================= 6. BEBIDAS EMBOTELLADAS =================
    {
        id: 'inv_agua_grande',
        name: 'Agua Grande 1,5L',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 24,
        rules: [
            { match: 'agua 1,5l', factor: 1, label: 'Botella Agua 1,5L (1 bot)' }
        ]
    },
    {
        id: 'inv_agua_pequena',
        name: 'Agua Pequeña (Solán de Cabras)',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 24,
        rules: [
            { match: 'agua solan de cabras', factor: 1, label: 'Botella Agua Pequeña (1 bot)' }
        ]
    },
    {
        id: 'inv_agua_vichy',
        name: 'Agua con Gas Vichy (300ml)',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 12,
        rules: [
            { match: 'agua con gas vichy', factor: 1, label: 'Vichy Catalán 300ml (1 bot)' }
        ]
    },
    {
        id: 'inv_agua_pellegrino',
        name: 'Agua con Gas San Pellegrino',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 12,
        rules: [
            { match: 'agua con gas san pellegrino', factor: 1, label: 'San Pellegrino (1 bot)' }
        ]
    },
    {
        id: 'inv_tercio_mahou',
        name: 'Tercio de Cerveza Mahou',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 48,
        rules: [
            { match: 'tercio de cerveza mahou', factor: 1, label: 'Tercio Mahou (1 bot)' }
        ]
    },
    {
        id: 'inv_tercio_sin_alcohol',
        name: 'Tercio Sin Alcohol Mahou',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 24,
        rules: [
            { match: 'tercio sin alcohol mahou', factor: 1, label: 'Tercio Sin Alcohol (1 bot)' }
        ]
    },
    {
        id: 'inv_tercio_sin_gluten',
        name: 'Tercio Mahou Sin Gluten',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 12,
        rules: [
            { match: 'tercio mahou sin gluten', factor: 1, label: 'Tercio Sin Gluten (1 bot)' }
        ]
    },
    {
        id: 'inv_estrella_1906',
        name: 'Estrella Galicia 1906',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 24,
        rules: [
            { match: 'estrella galicia 1906', factor: 1, label: 'Estrella 1906 (1 bot)' }
        ]
    },
    {
        id: 'inv_alhambra_especial',
        name: 'Alhambra Especial',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 24,
        rules: [
            { match: 'alambra especial', factor: 1, label: 'Alhambra Especial (1 bot)' },
            { match: 'alhambra especial', factor: 1, label: 'Alhambra Especial (1 bot)' }
        ]
    },
    {
        id: 'inv_coronita',
        name: 'Coronita',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 24,
        rules: [
            { match: 'coronita', factor: 1, label: 'Coronita (1 bot)' }
        ]
    },
    {
        id: 'inv_botellin_cerveza',
        name: 'Botellín de Cerveza',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 48,
        rules: [
            { match: 'botellin de cerveza', factor: 1, label: 'Botellín (1 bot)' }
        ]
    },
    {
        id: 'inv_cocacola_normal',
        name: 'Coca-Cola Normal',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 48,
        rules: [
            { match: 'coca cola', exact: true, factor: 1, label: 'Coca-Cola (1 bot)' }
        ]
    },
    {
        id: 'inv_cocacola_zero',
        name: 'Coca-Cola Zero',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 48,
        rules: [
            { match: 'coca cola 0', exact: true, factor: 1, label: 'Coca-Cola Zero (1 bot)' }
        ]
    },
    {
        id: 'inv_cocacola_zero_zero',
        name: 'Coca-Cola Zero Zero (Sin Cafeína)',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 24,
        rules: [
            { match: 'coca cola 00', factor: 1, label: 'Coca-Cola 00 (1 bot)' }
        ]
    },
    {
        id: 'inv_fanta_naranja',
        name: 'Fanta de Naranja',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 24,
        rules: [
            { match: 'fanta de naranja', factor: 1, label: 'Fanta Naranja (1 bot)' }
        ]
    },
    {
        id: 'inv_fanta_limon',
        name: 'Fanta de Limón',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 24,
        rules: [
            { match: 'fanta limon', factor: 1, label: 'Fanta Limón (1 bot)' }
        ]
    },
    {
        id: 'inv_aquarius_naranja',
        name: 'Aquarius Naranja',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 24,
        rules: [
            { match: 'acuarius naranja', factor: 1, label: 'Aquarius Naranja (1 bot)' },
            { match: 'aquarius naranja', factor: 1, label: 'Aquarius Naranja (1 bot)' }
        ]
    },
    {
        id: 'inv_fuzetea',
        name: 'FuzeTea (Nestea)',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 24,
        rules: [
            { match: 'fuzetea', factor: 1, label: 'FuzeTea (1 bot)' }
        ]
    },
    {
        id: 'inv_sprite',
        name: 'Sprite',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 12,
        rules: [
            { match: 'sprite', factor: 1, label: 'Sprite (1 bot)' }
        ]
    },
    {
        id: 'inv_tonica_schweppes',
        name: 'Tónica Schweppes',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 24,
        rules: [
            { match: 'tonica schweppes', factor: 1, label: 'Tónica Schweppes (1 bot)' }
        ]
    },
    {
        id: 'inv_schweppes_limon',
        name: 'Schweppes Limón',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 12,
        rules: [
            { match: 'schweppes limon', factor: 1, label: 'Schweppes Limón (1 bot)' }
        ]
    },
    {
        id: 'inv_trina_naranja',
        name: 'Trina Naranja',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 12,
        rules: [
            { match: 'trina naranja', factor: 1, label: 'Trina Naranja (1 bot)' }
        ]
    },
    {
        id: 'inv_trina_limon',
        name: 'Trina Limón',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 12,
        rules: [
            { match: 'trina limon', factor: 1, label: 'Trina Limón (1 bot)' }
        ]
    },
    {
        id: 'inv_mosto',
        name: 'Mosto',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 12,
        rules: [
            { match: 'mosto', factor: 1, label: 'Mosto (1 bot)' }
        ]
    },
    {
        id: 'inv_zumo_melocoton',
        name: 'Zumo de Melocotón',
        category: 'bebidas',
        unit: 'botellas',
        stock: 0,
        minStock: 12,
        rules: [
            { match: 'zumo melocoton', factor: 1, label: 'Zumo Melocotón (1 bot)' }
        ]
    },

    // ================= 7. VINOS POR BOTELLA =================
    // Tintos
    {
        id: 'inv_vino_protos27',
        name: 'Protos 27 (Tinto)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'protos 27', factor: 1, label: 'Botella Protos 27' }]
    },
    {
        id: 'inv_vino_emilio_moro',
        name: 'Emilio Moro (Tinto)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'emilio moro', exact: true, factor: 1, label: 'Botella Emilio Moro' }]
    },
    {
        id: 'inv_vino_muga',
        name: 'Muga Rioja Crianza (Tinto)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'muga rioja crianza', factor: 1, label: 'Botella Muga Crianza' }]
    },
    {
        id: 'inv_vino_essentia',
        name: 'Essentia Blas Muñoz (Tinto)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'essentia blas munoz', factor: 1, label: 'Botella Essentia' }]
    },
    {
        id: 'inv_vino_vizcarra',
        name: 'Vizcarra 15 Meses (Tinto)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'vizcarra 15 meses', factor: 1, label: 'Botella Vizcarra 15m' }]
    },
    {
        id: 'inv_vino_carmelo_rodero',
        name: 'Carmelo Rodero 9 Meses (Tinto)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'carmenlo rodero 9m', factor: 1, label: 'Botella Carmelo Rodero 9m' }, { match: 'carmelo rodero', factor: 1, label: 'Botella Carmelo Rodero' }]
    },
    {
        id: 'inv_vino_de_nariz',
        name: 'De Nariz Monastrell (Tinto)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'de nariz monatrell', factor: 1, label: 'Botella De Nariz' }, { match: 'de nariz monastrell', factor: 1, label: 'Botella De Nariz' }]
    },
    {
        id: 'inv_vino_finca_montesa',
        name: 'Finca La Montesa (Tinto)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'finca la montesa', factor: 1, label: 'Botella Finca La Montesa' }]
    },
    {
        id: 'inv_vino_utreia_tinto',
        name: 'Utreia (Tinto)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'utreia', exact: true, factor: 1, label: 'Botella Utreia Tinto' }]
    },
    {
        id: 'inv_vino_finca_resalso',
        name: 'Finca Resalso (Tinto)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'finca resalso', factor: 1, label: 'Botella Finca Resalso' }]
    },
    {
        id: 'inv_vino_lan_d12',
        name: 'Lan D12 (Tinto)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'lan d12', factor: 1, label: 'Botella Lan D12' }]
    },
    {
        id: 'inv_vino_ercavio_tinto',
        name: 'Ercavio Viñas de Meseta (Tinto)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'ercavio vinas de meseta', factor: 1, label: 'Botella Ercavio Tinto' }]
    },
    {
        id: 'inv_vino_coleccion_munoz_tinto',
        name: 'Colección Familia Blas Muñoz (Tinto)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [
            { match: 'coleccion munoz tinto', factor: 1, label: 'Botella Colección Muñoz Tinto' },
            { match: 'finca munoz coleccion familia', factor: 1, label: 'Botella Finca Muñoz Tinto' }
        ]
    },
    {
        id: 'inv_vino_correcto_tinto',
        name: 'Correcto (Tinto)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'correcto tinto', factor: 1, label: 'Botella Correcto Tinto' }]
    },
    // Blancos y Espumosos
    {
        id: 'inv_vino_utreia_godello',
        name: 'Utreia Godello (Blanco)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'utreia godello', factor: 1, label: 'Botella Utreia Godello' }]
    },
    {
        id: 'inv_vino_lalume',
        name: 'Lalume Ribeiro (Blanco)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'lalume ribeiro', factor: 1, label: 'Botella Lalume Ribeiro' }]
    },
    {
        id: 'inv_vino_chardonnay_munoz',
        name: 'Chardonnay Barrica Blas Muñoz (Blanco)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'chardonnay barrica blas munoz', factor: 1, label: 'Botella Chardonnay Blas Muñoz' }]
    },
    {
        id: 'inv_vino_polvorete',
        name: 'Polvorete Emilio Moro Godello (Blanco)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'polvorete', factor: 1, label: 'Botella Polvorete Godello' }]
    },
    {
        id: 'inv_vino_protos_verdejo',
        name: 'Protos Verdejo / Cuvée (Blanco)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [
            { match: 'protos verdejo', factor: 1, label: 'Botella Protos Verdejo' },
            { match: 'protos cuvee', factor: 1, label: 'Botella Protos Cuvée' }
        ]
    },
    {
        id: 'inv_vino_marieta',
        name: 'Marieta Albariño (Blanco)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'marieta albarino', exact: true, factor: 1, label: 'Botella Marieta Albariño' }]
    },
    {
        id: 'inv_vino_marieta_sin',
        name: 'Marieta Albariño SIN ALCOHOL (Blanco)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 4,
        rules: [{ match: 'marieta albarino sin alcohol', factor: 1, label: 'Botella Marieta Sin Alcohol' }]
    },
    {
        id: 'inv_vino_ercavio_blanco',
        name: 'Ercavio Blanco Airén',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [
            { match: 'ercavio blanco airen', factor: 1, label: 'Botella Ercavio Blanco Airén' },
            { match: 'ercavio blanco', exact: true, factor: 1, label: 'Botella Ercavio Blanco' }
        ]
    },
    {
        id: 'inv_vino_levatera',
        name: 'Levatera Frizzante (Blanco)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'levatera pritzzante', factor: 1, label: 'Botella Levatera' }]
    },
    {
        id: 'inv_vino_tarima',
        name: 'Tarima Sparkling (Blanco)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'tarima sparkling', factor: 1, label: 'Botella Tarima Sparkling' }]
    },
    {
        id: 'inv_vino_coleccion_blanco',
        name: 'Colección Familia Blanco (Blas Muñoz)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [
            { match: 'coleccion blanco', factor: 1, label: 'Botella Colección Blanco' },
            { match: 'coleccion familia blanco', factor: 1, label: 'Botella Colección Familia Blanco' }
        ]
    },
    {
        id: 'inv_vino_semidulce_munoz',
        name: 'Semi Dulce Blanco Muñoz',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'semi dulce blanco munoz', factor: 1, label: 'Botella Semi Dulce Muñoz' }]
    },
    {
        id: 'inv_vino_semidulce_corpus',
        name: 'Semi Dulce Corpus',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [
            { match: 'semi dulce corpus', factor: 1, label: 'Botella Semi Dulce Corpus' },
            { match: 'corpus semi dulce', factor: 1, label: 'Botella Corpus Semi Dulce' }
        ]
    },
    {
        id: 'inv_vino_camioneta',
        name: 'La Camioneta Rueda Verdejo (Blanco)',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'la camioneta rueda', factor: 1, label: 'Botella La Camioneta Verdejo' }]
    },
    {
        id: 'inv_vino_manzanilla',
        name: 'Manzanilla',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 4,
        rules: [{ match: 'manzanilla', factor: 1, label: 'Botella Manzanilla' }]
    },
    {
        id: 'inv_vino_cava_paloma',
        name: 'Cava Paloma Mínguez Reserva',
        category: 'vinos',
        unit: 'botellas',
        stock: 0,
        minStock: 6,
        rules: [{ match: 'cava paloma minguez', factor: 1, label: 'Botella Cava Paloma Mínguez' }]
    }
];
