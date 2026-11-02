import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useOrder } from '../context/OrderContext';
import { supabase } from '../utils/supabaseClient';
import {
    ArrowLeft,
    Plus,
    Minus,
    Search,
    Edit2,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    Save,
    X,
    Printer,
    ShoppingCart,
    Calendar,
    RefreshCw,
    History,
    PackageCheck,
    RotateCcw,
    Info,
    Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { printRestockList } from '../utils/printHelpers';
import { INVENTORY_CATEGORIES, DEFAULT_SELECTIVE_INVENTORY } from '../data/selectiveInventory';

const STORAGE_KEY = 'manalu_selective_inventory_v1';
const LOGS_STORAGE_KEY = 'manalu_selective_inventory_logs_v1';

const normalizeStr = (str) =>
    String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const formatQty = (val) => {
    const num = parseFloat(val) || 0;
    return Number.isInteger(num) ? String(num) : num.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
};

const getRecentWeekendDates = () => {
    const now = new Date();
    const day = now.getDay(); // 0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab
    const end = new Date(now);
    const start = new Date(now);

    if (day === 0) {
        // Domingo -> desde el Jueves/Viernes de esta semana (3 días atrás: Jueves)
        start.setDate(now.getDate() - 3);
    } else if (day === 1) {
        // Lunes -> desde el Jueves pasado (4 días atrás) hasta ayer Domingo
        start.setDate(now.getDate() - 4);
        end.setDate(now.getDate() - 1);
    } else if (day === 6) {
        // Sábado -> desde el Jueves (2 días atrás)
        start.setDate(now.getDate() - 2);
    } else if (day === 5) {
        // Viernes -> desde ayer Jueves
        start.setDate(now.getDate() - 1);
    } else {
        // Martes a Jueves -> últimos 4 días por defecto
        start.setDate(now.getDate() - 4);
    }

    return {
        startStr: start.toISOString().split('T')[0],
        endStr: end.toISOString().split('T')[0]
    };
};

const Inventory = () => {
    const navigate = useNavigate();
    const { salesProducts = [] } = useInventory();
    const { salesHistory = [] } = useOrder();

    // Load items merging defaults with saved local state
    const [items, setItems] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Ensure any newly added default items are also present
                    const existingIds = new Set(parsed.map(i => i.id));
                    const missingDefaults = DEFAULT_SELECTIVE_INVENTORY.filter(d => !existingIds.has(d.id));
                    return [...parsed, ...missingDefaults];
                }
            }
        } catch (err) {
            console.error('Error loading selective inventory:', err);
        }
        return DEFAULT_SELECTIVE_INVENTORY;
    });

    const [logs, setLogs] = useState(() => {
        try {
            const saved = localStorage.getItem(LOGS_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [activeCategory, setActiveCategory] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [onlyLowStock, setOnlyLowStock] = useState(false);

    // Modals state
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [purchaseQuantities, setPurchaseQuantities] = useState({});
    const [purchaseSearch, setPurchaseSearch] = useState('');
    const [purchaseCategory, setPurchaseCategory] = useState('todos');

    const [showDeductModal, setShowDeductModal] = useState(false);
    const [deductDates, setDeductDates] = useState(getRecentWeekendDates);
    const [isFetchingSales, setIsFetchingSales] = useState(false);
    const [periodSales, setPeriodSales] = useState([]);
    const [deductOverrides, setDeductOverrides] = useState({});

    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemForm, setItemForm] = useState({
        name: '',
        category: 'mariscos',
        unit: 'uds',
        stock: 0,
        minStock: 5,
        rules: []
    });

    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Save to localStorage whenever items or logs change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (err) {
            console.error('Error saving selective inventory:', err);
        }
    }, [items]);

    useEffect(() => {
        try {
            localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 50)));
        } catch (err) {
            console.error('Error saving inventory logs:', err);
        }
    }, [logs]);

    const addLog = (type, title, details, snapshotBefore = null) => {
        const entry = {
            id: `log_${Date.now()}`,
            date: new Date().toISOString(),
            type, // 'purchase' | 'weekend_deduct' | 'manual'
            title,
            details,
            snapshotBefore
        };
        setLogs(prev => [entry, ...prev.slice(0, 49)]);
    };

    const handleUndoLog = (logEntry) => {
        if (!logEntry.snapshotBefore) return;
        if (window.confirm(`¿Deseas deshacer "${logEntry.title}" y restaurar las cantidades que había justo antes?`)) {
            setItems(logEntry.snapshotBefore);
            setLogs(prev => prev.filter(l => l.id !== logEntry.id));
        }
    };

    // Stock adjustment helpers
    const adjustStock = (id, delta) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            const next = Math.max(0, Math.round(((parseFloat(item.stock) || 0) + delta) * 100) / 100);
            return { ...item, stock: next, updatedAt: new Date().toISOString() };
        }));
    };

    const setExactStock = (id, value) => {
        const num = value === '' ? 0 : Math.max(0, parseFloat(value) || 0);
        setItems(prev => prev.map(item => item.id === id ? { ...item, stock: num, updatedAt: new Date().toISOString() } : item));
    };

    // Filtered items for main view
    const filteredItems = useMemo(() => {
        const q = normalizeStr(searchTerm);
        return items.filter(item => {
            const matchesCat = activeCategory === 'todos' || item.category === activeCategory;
            const matchesSearch = !q || normalizeStr(item.name).includes(q) || (item.rules || []).some(r => normalizeStr(r.match).includes(q));
            const isLow = (parseFloat(item.stock) || 0) <= (parseFloat(item.minStock) || 0);
            const matchesLow = !onlyLowStock || isLow;
            return matchesCat && matchesSearch && matchesLow;
        });
    }, [items, activeCategory, searchTerm, onlyLowStock]);

    // Summary stats
    const stats = useMemo(() => {
        const total = items.length;
        const lowStockCount = items.filter(i => (parseFloat(i.stock) || 0) <= (parseFloat(i.minStock) || 0)).length;
        const outOfStockCount = items.filter(i => (parseFloat(i.stock) || 0) <= 0).length;
        return { total, lowStockCount, outOfStockCount };
    }, [items]);

    // --- THURSDAY PURCHASE MODAL LOGIC ---
    const handleOpenPurchaseModal = () => {
        setPurchaseQuantities({});
        setPurchaseSearch('');
        setPurchaseCategory(activeCategory);
        setShowPurchaseModal(true);
    };

    const handleConfirmPurchase = () => {
        const entries = Object.entries(purchaseQuantities).filter(([, qty]) => (parseFloat(qty) || 0) > 0);
        if (entries.length === 0) {
            alert('Introduce al menos una cantidad recibida mayor que 0.');
            return;
        }

        const snapshot = JSON.parse(JSON.stringify(items));
        const summaryDetails = [];

        setItems(prev => prev.map(item => {
            const added = parseFloat(purchaseQuantities[item.id]) || 0;
            if (added > 0) {
                const newStock = Math.round(((parseFloat(item.stock) || 0) + added) * 100) / 100;
                summaryDetails.push(`${item.name}: +${formatQty(added)} ${item.unit} (Total: ${formatQty(newStock)})`);
                return { ...item, stock: newStock, updatedAt: new Date().toISOString() };
            }
            return item;
        }));

        addLog(
            'purchase',
            `Entrada de Compra (${entries.length} prod.)`,
            summaryDetails,
            snapshot
        );

        setShowPurchaseModal(false);
        setPurchaseQuantities({});
    };

    // --- SUNDAY WEEKEND SALES DEDUCTION LOGIC ---
    const fetchSalesForPeriod = async (startStr, endStr) => {
        setIsFetchingSales(true);
        try {
            const startDate = new Date(`${startStr}T00:00:00`);
            const endDate = new Date(`${endStr}T23:59:59.999`);

            let combinedSales = [];

            // 1. Try fetching from Supabase so we don't miss anything from other devices
            try {
                const { data, error } = await supabase
                    .from('sales')
                    .select('id, created_at, total, items, table_id, ticket_number')
                    .gte('created_at', startDate.toISOString())
                    .lte('created_at', endDate.toISOString())
                    .order('created_at', { ascending: false });

                if (!error && Array.isArray(data)) {
                    combinedSales = data.map(s => ({
                        ...s,
                        date: new Date(s.created_at),
                        items: typeof s.items === 'string' ? (s.items.startsWith('[') ? JSON.parse(s.items) : []) : (s.items || [])
                    }));
                }
            } catch (netErr) {
                console.warn('Fallback to local salesHistory for inventory deduction:', netErr);
            }

            // 2. Merge with local salesHistory in case there are offline/unsynced sales
            const cloudIds = new Set(combinedSales.map(s => s.id));
            const localFiltered = (salesHistory || []).filter(s => {
                const d = new Date(s.date || s.created_at);
                return d >= startDate && d <= endDate && !cloudIds.has(s.id);
            });

            const allSales = [...combinedSales, ...localFiltered];
            setPeriodSales(allSales);
            setDeductOverrides({});
        } finally {
            setIsFetchingSales(false);
        }
    };

    const handleOpenDeductModal = () => {
        const defaultDates = getRecentWeekendDates();
        setDeductDates(defaultDates);
        setShowDeductModal(true);
        fetchSalesForPeriod(defaultDates.startStr, defaultDates.endStr);
    };

    // Calculate how much each inventory item was sold in periodSales
    const calculatedDeductions = useMemo(() => {
        // Flatten all sold items across tickets
        const soldItemsList = [];
        periodSales.forEach(sale => {
            const saleItems = typeof sale.items === 'string'
                ? (sale.items.startsWith('[') ? JSON.parse(sale.items) : [])
                : (sale.items || []);
            saleItems.forEach(line => {
                const qty = parseFloat(line.quantity) || 0;
                if (qty > 0 && line.name) {
                    soldItemsList.push({
                        name: line.name,
                        normName: normalizeStr(line.name),
                        qty
                    });
                }
            });
        });

        return items.map(invItem => {
            const rules = invItem.rules || [];
            let totalDeduction = 0;
            const breakdownMap = {};

            soldItemsList.forEach(sold => {
                // Find the most specific matching rule for this sold item
                // Sort rules by match length descending so specific rules (e.g. "croqueta gourmet jamon iberico 1 unidad")
                // match before general ones ("croqueta gourmet jamon iberico")
                const sortedRules = [...rules].sort((a, b) => (b.match?.length || 0) - (a.match?.length || 0));

                for (const rule of sortedRules) {
                    const ruleNorm = normalizeStr(rule.match);
                    if (!ruleNorm) continue;

                    const isMatch = rule.exact
                        ? sold.normName === ruleNorm
                        : sold.normName.includes(ruleNorm);

                    if (isMatch) {
                        const deductAmount = sold.qty * (parseFloat(rule.factor) || 1);
                        totalDeduction += deductAmount;
                        const key = sold.name.trim();
                        if (!breakdownMap[key]) {
                            breakdownMap[key] = { name: key, soldQty: 0, deducted: 0, factor: rule.factor };
                        }
                        breakdownMap[key].soldQty += sold.qty;
                        breakdownMap[key].deducted += deductAmount;
                        break; // Only apply one rule per inventory item per sold line
                    }
                }
            });

            totalDeduction = Math.round(totalDeduction * 100) / 100;
            const overrideVal = deductOverrides[invItem.id];
            const finalDeduction = overrideVal !== undefined ? (parseFloat(overrideVal) || 0) : totalDeduction;
            const currentStock = parseFloat(invItem.stock) || 0;
            const remainingStock = Math.max(0, Math.round((currentStock - finalDeduction) * 100) / 100);

            return {
                ...invItem,
                calculatedDeduction: totalDeduction,
                finalDeduction,
                remainingStock,
                breakdown: Object.values(breakdownMap)
            };
        });
    }, [items, periodSales, deductOverrides]);

    const itemsWithSales = useMemo(
        () => calculatedDeductions.filter(d => d.calculatedDeduction > 0 || d.finalDeduction > 0),
        [calculatedDeductions]
    );

    const handleConfirmWeekendDeduction = () => {
        const toApply = calculatedDeductions.filter(d => d.finalDeduction > 0);
        if (toApply.length === 0) {
            alert('No hay unidades a descontar en el periodo seleccionado.');
            return;
        }

        const snapshot = JSON.parse(JSON.stringify(items));
        const summaryDetails = [];

        setItems(prev => prev.map(item => {
            const found = toApply.find(d => d.id === item.id);
            if (!found) return item;
            const oldStock = parseFloat(item.stock) || 0;
            const newStock = Math.max(0, Math.round((oldStock - found.finalDeduction) * 100) / 100);
            summaryDetails.push(`${item.name}: -${formatQty(found.finalDeduction)} ${item.unit} (Quedan: ${formatQty(newStock)})`);
            return { ...item, stock: newStock, updatedAt: new Date().toISOString() };
        }));

        addLog(
            'weekend_deduct',
            `Cierre Ventas (${deductDates.startStr} a ${deductDates.endStr})`,
            summaryDetails,
            snapshot
        );

        setShowDeductModal(false);
    };

    // --- CREATE / EDIT SELECTIVE ITEM MODAL ---
    const handleOpenNewItem = () => {
        setEditingItem(null);
        setItemForm({
            name: '',
            category: activeCategory === 'todos' ? 'mariscos' : activeCategory,
            unit: 'uds',
            stock: 0,
            minStock: 5,
            rules: [{ match: '', factor: 1, label: '' }]
        });
        setShowItemModal(true);
    };

    const handleOpenEditItem = (item) => {
        setEditingItem(item);
        setItemForm({
            name: item.name,
            category: item.category,
            unit: item.unit || 'uds',
            stock: item.stock || 0,
            minStock: item.minStock || 5,
            rules: Array.isArray(item.rules) && item.rules.length > 0
                ? item.rules.map(r => ({ ...r }))
                : [{ match: item.name, factor: 1, label: item.name }]
        });
        setShowItemModal(true);
    };

    const handleSaveItemForm = () => {
        if (!itemForm.name.trim()) {
            alert('Escribe un nombre para el producto de inventario.');
            return;
        }

        const cleanRules = (itemForm.rules || [])
            .filter(r => r.match && r.match.trim() !== '')
            .map(r => ({
                match: r.match.trim(),
                factor: parseFloat(r.factor) || 1,
                exact: Boolean(r.exact),
                label: r.label || `${r.match.trim()} (${r.factor || 1})`
            }));

        if (editingItem) {
            setItems(prev => prev.map(i => i.id === editingItem.id ? {
                ...i,
                name: itemForm.name.trim(),
                category: itemForm.category,
                unit: itemForm.unit,
                stock: parseFloat(itemForm.stock) || 0,
                minStock: parseFloat(itemForm.minStock) || 0,
                rules: cleanRules
            } : i));
        } else {
            const newItem = {
                id: `inv_custom_${Date.now()}`,
                name: itemForm.name.trim(),
                category: itemForm.category,
                unit: itemForm.unit,
                stock: parseFloat(itemForm.stock) || 0,
                minStock: parseFloat(itemForm.minStock) || 0,
                rules: cleanRules.length > 0 ? cleanRules : [{ match: itemForm.name.trim(), factor: 1, label: itemForm.name.trim() }]
            };
            setItems(prev => [newItem, ...prev]);
        }

        setShowItemModal(false);
    };

    const handleDeleteItem = (item) => {
        if (window.confirm(`¿Quitar "${item.name}" de tu lista de control de inventario?`)) {
            setItems(prev => prev.filter(i => i.id !== item.id));
        }
    };

    const handlePrintShoppingList = () => {
        const lowItems = items
            .filter(i => (parseFloat(i.stock) || 0) <= (parseFloat(i.minStock) || 0))
            .map(i => ({
                name: i.name,
                quantity: formatQty(i.stock),
                critical: formatQty(i.minStock),
                unit: i.unit,
                provider: INVENTORY_CATEGORIES.find(c => c.id === i.category)?.label || i.category
            }));

        if (lowItems.length === 0) {
            alert('¡Todo el stock está por encima del mínimo! No hay productos pendientes de reponer.');
            return;
        }
        printRestockList(lowItems);
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
            {/* HEADER */}
            <header style={{
                marginBottom: '1.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                            background: 'var(--color-primary)', color: 'white',
                            border: 'none', padding: '0.75rem 1.1rem', borderRadius: '12px',
                            cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                        }}
                    >
                        <ArrowLeft size={20} /> Volver
                    </button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Inventario Selectivo</h1>
                            <span style={{
                                background: '#dcfce7',
                                color: '#166534',
                                border: '1px solid #86efac',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                            }}>
                                <CheckCircle2 size={14} /> TPV 100% Independiente (Cero bloqueos en servicio)
                            </span>
                        </div>
                        <p style={{ margin: '0.2rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            Control ágil de mariscos, carnes, pescados, raciones clave, postres, bebidas y botellas de vino
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setShowHistoryModal(true)}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderRadius: '10px', cursor: 'pointer' }}
                    >
                        <History size={17} /> Historial ({logs.length})
                    </button>
                    <button
                        onClick={handlePrintShoppingList}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.65rem 1rem',
                            background: '#fef2f2',
                            border: '1px solid #ef4444',
                            color: '#dc2626',
                            borderRadius: '10px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        <Printer size={17} /> Imprimir Lista Compra ({stats.lowStockCount})
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleOpenNewItem}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.1rem', borderRadius: '10px' }}
                    >
                        <Plus size={18} /> Añadir Producto a Controlar
                    </button>
                </div>
            </header>

            {/* MAIN WORKFLOW CARDS: JUEVES (COMPRA) & DOMINGO (RESTAR VENTAS) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                {/* Card 1: Jueves Compra */}
                <motion.div
                    whileHover={{ translateY: -2 }}
                    onClick={handleOpenPurchaseModal}
                    className="surface-card"
                    style={{
                        padding: '1.25rem 1.5rem',
                        border: '2px solid #10b981',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.02))',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}
                >
                    <div style={{
                        background: '#10b981',
                        color: 'white',
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}>
                        <ShoppingCart size={26} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            PASO 1 · JUEVES / DÍA DE COMPRA
                        </div>
                        <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginTop: '0.15rem' }}>
                            ➕ Cargar Compra / Entrada de Stock
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.2rem' }}>
                            Suma de golpe las cajas, raciones, carnes y botellas compradas antes de empezar el fin de semana.
                        </div>
                    </div>
                </motion.div>

                {/* Card 2: Domingo Liquidar Ventas */}
                <motion.div
                    whileHover={{ translateY: -2 }}
                    onClick={handleOpenDeductModal}
                    className="surface-card"
                    style={{
                        padding: '1.25rem 1.5rem',
                        border: '2px solid #4f46e5',
                        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(79, 70, 229, 0.02))',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}
                >
                    <div style={{
                        background: '#4f46e5',
                        color: 'white',
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                    }}>
                        <PackageCheck size={26} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            PASO 2 · DOMINGO AL FINALIZAR SERVICIO
                        </div>
                        <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginTop: '0.15rem' }}>
                            📉 Restar Ventas del Fin de Semana
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.2rem' }}>
                            Analiza los tickets vendidos (incluyendo medias raciones, huevos de oca en Mansos, chuletones, etc.) y réstalos con 1 clic.
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* CATEGORY TABS */}
            <div style={{
                display: 'flex',
                gap: '0.6rem',
                marginBottom: '1.25rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem'
            }}>
                <button
                    onClick={() => setActiveCategory('todos')}
                    style={{
                        padding: '0.65rem 1.1rem',
                        background: activeCategory === 'todos' ? '#0f172a' : 'white',
                        color: activeCategory === 'todos' ? 'white' : '#475569',
                        border: '1px solid',
                        borderColor: activeCategory === 'todos' ? '#0f172a' : '#cbd5e1',
                        borderRadius: '12px',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    📋 Todos ({items.length})
                </button>
                {INVENTORY_CATEGORIES.map(cat => {
                    const count = items.filter(i => i.category === cat.id).length;
                    const isActive = activeCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            style={{
                                padding: '0.65rem 1.1rem',
                                background: isActive ? 'var(--color-primary)' : 'white',
                                color: isActive ? 'white' : '#475569',
                                border: '1px solid',
                                borderColor: isActive ? 'var(--color-primary)' : '#cbd5e1',
                                borderRadius: '12px',
                                fontWeight: '700',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                whiteSpace: 'nowrap',
                                boxShadow: isActive ? '0 4px 10px rgba(79, 70, 229, 0.25)' : 'none'
                            }}
                        >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                            <span style={{
                                background: isActive ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                                color: isActive ? 'white' : '#64748b',
                                padding: '0.1rem 0.45rem',
                                borderRadius: '999px',
                                fontSize: '0.75rem'
                            }}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* SEARCH & FILTER BAR */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem'
            }}>
                <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '500px' }}>
                    <Search
                        size={18}
                        style={{
                            position: 'absolute',
                            left: '0.9rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#64748b'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="🔍 Buscar en inventario (ej. gamba, entrecot, huevo de oca, mahou, protos...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="surface-card"
                        style={{
                            width: '100%',
                            padding: '0.75rem 2.2rem 0.75rem 2.6rem',
                            borderRadius: '12px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.95rem',
                            boxSizing: 'border-box'
                        }}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            style={{
                                position: 'absolute',
                                right: '0.6rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: '#e2e8f0',
                                border: 'none',
                                borderRadius: '50%',
                                width: '22px',
                                height: '22px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setOnlyLowStock(!onlyLowStock)}
                        style={{
                            padding: '0.65rem 1rem',
                            borderRadius: '10px',
                            border: '1px solid',
                            borderColor: onlyLowStock ? '#dc2626' : '#cbd5e1',
                            background: onlyLowStock ? '#fef2f2' : 'white',
                            color: onlyLowStock ? '#dc2626' : '#475569',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                        }}
                    >
                        <AlertTriangle size={16} />
                        {onlyLowStock ? 'Viendo solo Stock Bajo' : `Ver Bajo Stock (${stats.lowStockCount})`}
                    </button>
                </div>
            </div>

            {/* INVENTORY TABLE / CARDS */}
            <div className="surface-card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', textTransform: 'uppercase', color: '#475569' }}>Producto Controlado</th>
                            <th style={{ padding: '1rem', fontSize: '0.8rem', textTransform: 'uppercase', color: '#475569' }}>Categoría</th>
                            <th style={{ padding: '1rem', fontSize: '0.8rem', textTransform: 'uppercase', color: '#475569', textAlign: 'center' }}>Stock Actual</th>
                            <th style={{ padding: '1rem', fontSize: '0.8rem', textTransform: 'uppercase', color: '#475569', textAlign: 'center' }}>Ajuste Rápido</th>
                            <th style={{ padding: '1rem', fontSize: '0.8rem', textTransform: 'uppercase', color: '#475569', textAlign: 'center' }}>Mínimo Ideal</th>
                            <th style={{ padding: '1rem', fontSize: '0.8rem', textTransform: 'uppercase', color: '#475569' }}>Estado</th>
                            <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', textTransform: 'uppercase', color: '#475569', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                    No se encontraron artículos en esta vista.
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map(item => {
                                const stockNum = parseFloat(item.stock) || 0;
                                const minNum = parseFloat(item.minStock) || 0;
                                const isZero = stockNum <= 0;
                                const isLow = stockNum <= minNum;
                                const catObj = INVENTORY_CATEGORIES.find(c => c.id === item.category);

                                return (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: isZero ? 'rgba(254, 242, 242, 0.45)' : 'white' }}>
                                        <td style={{ padding: '0.9rem 1.25rem' }}>
                                            <div style={{ fontWeight: '700', fontSize: '0.98rem', color: '#0f172a' }}>
                                                {item.name}
                                            </div>
                                            {item.rules && item.rules.length > 0 && (
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                                                    <LinkIcon size={11} />
                                                    <span>Resta con: {item.rules.map(r => r.label || r.match).join(' · ')}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.9rem 1rem' }}>
                                            <span style={{
                                                fontSize: '0.8rem',
                                                fontWeight: '600',
                                                padding: '0.25rem 0.6rem',
                                                background: '#f1f5f9',
                                                borderRadius: '8px',
                                                color: '#334155',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {catObj ? `${catObj.icon} ${catObj.label}` : item.category}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    value={item.stock}
                                                    onChange={(e) => setExactStock(item.id, e.target.value)}
                                                    style={{
                                                        width: '78px',
                                                        padding: '0.45rem',
                                                        textAlign: 'center',
                                                        fontSize: '1.05rem',
                                                        fontWeight: '800',
                                                        borderRadius: '8px',
                                                        border: isLow ? '2px solid #ef4444' : '1px solid #cbd5e1',
                                                        color: isLow ? '#dc2626' : '#0f172a',
                                                        background: 'white'
                                                    }}
                                                />
                                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                                                    {item.unit}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <button
                                                    onClick={() => adjustStock(item.id, -1)}
                                                    title="Restar 1"
                                                    style={{
                                                        width: '32px', height: '32px', borderRadius: '8px',
                                                        border: '1px solid #cbd5e1', background: '#f8fafc',
                                                        cursor: 'pointer', fontWeight: 'bold', display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <button
                                                    onClick={() => adjustStock(item.id, 1)}
                                                    title="Sumar 1"
                                                    style={{
                                                        width: '32px', height: '32px', borderRadius: '8px',
                                                        border: '1px solid #10b981', background: '#ecfdf5',
                                                        color: '#059669', cursor: 'pointer', fontWeight: 'bold',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                                <button
                                                    onClick={() => adjustStock(item.id, 6)}
                                                    title="Sumar +6"
                                                    style={{
                                                        padding: '0 0.5rem', height: '32px', borderRadius: '8px',
                                                        border: '1px solid #bbf7d0', background: '#f0fdf4',
                                                        color: '#15803d', cursor: 'pointer', fontWeight: '700',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    +6
                                                </button>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.9rem 1rem', textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: '0.9rem' }}>
                                            {formatQty(item.minStock)} {item.unit}
                                        </td>
                                        <td style={{ padding: '0.9rem 1rem' }}>
                                            {isZero ? (
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                                    background: '#fee2e2', color: '#b91c1c',
                                                    padding: '0.25rem 0.6rem', borderRadius: '999px',
                                                    fontSize: '0.75rem', fontWeight: '800'
                                                }}>
                                                    <AlertTriangle size={13} /> AGOTADO (0)
                                                </span>
                                            ) : isLow ? (
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                                    background: '#fef3c7', color: '#b45309',
                                                    padding: '0.25rem 0.6rem', borderRadius: '999px',
                                                    fontSize: '0.75rem', fontWeight: '800'
                                                }}>
                                                    <AlertTriangle size={13} /> REPONER
                                                </span>
                                            ) : (
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                                    background: '#dcfce7', color: '#15803d',
                                                    padding: '0.25rem 0.6rem', borderRadius: '999px',
                                                    fontSize: '0.75rem', fontWeight: '800'
                                                }}>
                                                    <CheckCircle2 size={13} /> OK
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                                                <button
                                                    onClick={() => handleOpenEditItem(item)}
                                                    className="btn-icon-small"
                                                    title="Configurar artículo y equivalencias"
                                                    style={{ color: '#4f46e5' }}
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteItem(item)}
                                                    className="btn-icon-small text-danger"
                                                    title="Quitar de la lista"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* =========================================================================
                MODAL 1: ENTRADA DE COMPRA (JUEVES)
               ========================================================================= */}
            <AnimatePresence>
                {showPurchaseModal && (
                    <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="modal-container"
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: '100%', maxWidth: '820px', background: 'white', padding: '1.5rem' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <ShoppingCart size={24} /> Cargar Compra (Jueves / Proveedores)
                                    </h2>
                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                                        Escribe las unidades, raciones o botellas que acaban de entrar y se sumarán al stock actual.
                                    </p>
                                </div>
                                <button onClick={() => setShowPurchaseModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Filters inside Purchase Modal */}
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="🔍 Buscar producto para sumar compra..."
                                    value={purchaseSearch}
                                    onChange={(e) => setPurchaseSearch(e.target.value)}
                                    style={{
                                        flex: 1, minWidth: '220px', padding: '0.65rem 1rem',
                                        borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem'
                                    }}
                                />
                                <select
                                    value={purchaseCategory}
                                    onChange={(e) => setPurchaseCategory(e.target.value)}
                                    style={{ padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white' }}
                                >
                                    <option value="todos">Todas las categorías</option>
                                    {INVENTORY_CATEGORIES.map(c => (
                                        <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ maxHeight: '52vh', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                                        <tr>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#475569' }}>Producto</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: '#475569' }}>Hay Ahora</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: '#059669' }}>+ Cantidad Comprada</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: '#475569' }}>Quedará en</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items
                                            .filter(i => {
                                                const matchCat = purchaseCategory === 'todos' || i.category === purchaseCategory;
                                                const matchQ = !purchaseSearch || normalizeStr(i.name).includes(normalizeStr(purchaseSearch));
                                                return matchCat && matchQ;
                                            })
                                            .map(item => {
                                                const added = parseFloat(purchaseQuantities[item.id]) || 0;
                                                const current = parseFloat(item.stock) || 0;
                                                return (
                                                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: added > 0 ? '#f0fdf4' : 'white' }}>
                                                        <td style={{ padding: '0.65rem 1rem', fontWeight: '600', fontSize: '0.9rem' }}>
                                                            {item.name}
                                                        </td>
                                                        <td style={{ padding: '0.65rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                                                            {formatQty(current)} {item.unit}
                                                        </td>
                                                        <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                <input
                                                                    type="number"
                                                                    step="0.5"
                                                                    min="0"
                                                                    placeholder="0"
                                                                    value={purchaseQuantities[item.id] || ''}
                                                                    onChange={(e) => setPurchaseQuantities({ ...purchaseQuantities, [item.id]: e.target.value })}
                                                                    style={{
                                                                        width: '85px', padding: '0.45rem', textAlign: 'center',
                                                                        borderRadius: '8px', border: added > 0 ? '2px solid #10b981' : '1px solid #cbd5e1',
                                                                        fontWeight: '800', fontSize: '0.95rem'
                                                                    }}
                                                                />
                                                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.unit}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '0.65rem 1rem', textAlign: 'center', fontWeight: '800', color: added > 0 ? '#059669' : '#94a3b8' }}>
                                                            {formatQty(current + added)} {item.unit}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>
                                    Productos con entrada: <strong>{Object.values(purchaseQuantities).filter(v => (parseFloat(v) || 0) > 0).length}</strong>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button className="btn-secondary" onClick={() => setShowPurchaseModal(false)}>Cancelar</button>
                                    <button
                                        className="btn-primary"
                                        onClick={handleConfirmPurchase}
                                        style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <Save size={18} /> Sumar Compra al Inventario
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* =========================================================================
                MODAL 2: LIQUIDAR VENTAS DEL FIN DE SEMANA (DOMINGO)
               ========================================================================= */}
            <AnimatePresence>
                {showDeductModal && (
                    <div className="modal-overlay" onClick={() => setShowDeductModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="modal-container"
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: '100%', maxWidth: '900px', background: 'white', padding: '1.5rem' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <PackageCheck size={24} /> Restar Ventas del Fin de Semana
                                    </h2>
                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                                        Selecciona los días de servicio. El sistema lee los tickets cobrados y calcula cuánto restar de cada producto.
                                    </p>
                                </div>
                                <button onClick={() => setShowDeductModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Date Range Selector */}
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '1rem',
                                alignItems: 'center',
                                background: '#f8fafc',
                                padding: '1rem',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                marginBottom: '1rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Calendar size={18} style={{ color: '#4f46e5' }} />
                                    <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Desde:</label>
                                    <input
                                        type="date"
                                        value={deductDates.startStr}
                                        onChange={(e) => setDeductDates({ ...deductDates, startStr: e.target.value })}
                                        style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Hasta:</label>
                                    <input
                                        type="date"
                                        value={deductDates.endStr}
                                        onChange={(e) => setDeductDates({ ...deductDates, endStr: e.target.value })}
                                        style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600' }}
                                    />
                                </div>
                                <button
                                    onClick={() => fetchSalesForPeriod(deductDates.startStr, deductDates.endStr)}
                                    disabled={isFetchingSales}
                                    className="btn-primary"
                                    style={{ padding: '0.55rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                                >
                                    <RefreshCw size={15} /> {isFetchingSales ? 'Analizando...' : 'Analizar Ventas'}
                                </button>
                                <div style={{ marginLeft: 'auto', fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
                                    Tickets analizados: <span style={{ color: '#4f46e5' }}>{periodSales.length}</span>
                                </div>
                            </div>

                            {/* Preview Table */}
                            <div style={{ maxHeight: '48vh', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                {isFetchingSales ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                        Leyendo tickets vendidos en el periodo...
                                    </div>
                                ) : itemsWithSales.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                        No se han encontrado ventas de los productos controlados entre <strong>{deductDates.startStr}</strong> y <strong>{deductDates.endStr}</strong>.
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                                            <tr>
                                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#475569' }}>Producto de Inventario</th>
                                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#475569' }}>Desglose en Tickets TPV</th>
                                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: '#475569' }}>Stock Actual</th>
                                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: '#dc2626' }}>A Restar</th>
                                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: '#059669' }}>Stock Final</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {itemsWithSales.map(row => (
                                                <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '0.7rem 1rem', fontWeight: '700', fontSize: '0.9rem' }}>
                                                        {row.name}
                                                    </td>
                                                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.78rem', color: '#475569' }}>
                                                        {row.breakdown.map((b, idx) => (
                                                            <div key={idx}>
                                                                • <strong>{b.soldQty}x</strong> {b.name} ({b.factor !== 1 ? `x${b.factor} = ` : ''}-{formatQty(b.deducted)} {row.unit})
                                                            </div>
                                                        ))}
                                                    </td>
                                                    <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontWeight: '600', color: '#64748b' }}>
                                                        {formatQty(row.stock)} {row.unit}
                                                    </td>
                                                    <td style={{ padding: '0.7rem 1rem', textAlign: 'center' }}>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            <span style={{ color: '#dc2626', fontWeight: 'bold' }}>-</span>
                                                            <input
                                                                type="number"
                                                                step="0.25"
                                                                min="0"
                                                                value={deductOverrides[row.id] !== undefined ? deductOverrides[row.id] : row.calculatedDeduction}
                                                                onChange={(e) => setDeductOverrides({ ...deductOverrides, [row.id]: e.target.value })}
                                                                style={{
                                                                    width: '72px', padding: '0.35rem', textAlign: 'center',
                                                                    borderRadius: '8px', border: '1px solid #fca5a5',
                                                                    color: '#dc2626', fontWeight: '800', background: '#fef2f2'
                                                                }}
                                                            />
                                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.unit}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontWeight: '800', color: row.remainingStock <= row.minStock ? '#dc2626' : '#059669' }}>
                                                        {formatQty(row.remainingStock)} {row.unit}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Info size={16} /> Puedes corregir cualquier casilla roja antes de confirmar si hubo alguna invitación o merma.
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button className="btn-secondary" onClick={() => setShowDeductModal(false)}>Cancelar</button>
                                    <button
                                        className="btn-primary"
                                        onClick={handleConfirmWeekendDeduction}
                                        disabled={itemsWithSales.length === 0}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <PackageCheck size={18} /> Confirmar y Restar del Inventario ({itemsWithSales.length})
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* =========================================================================
                MODAL 3: AÑADIR / EDITAR ARTÍCULO Y SUS EQUIVALENCIAS CON LA CARTA
               ========================================================================= */}
            <AnimatePresence>
                {showItemModal && (
                    <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="modal-container"
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: '100%', maxWidth: '680px', background: 'white', padding: '1.5rem' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                <h2 style={{ margin: 0 }}>
                                    {editingItem ? 'Configurar Producto de Inventario' : 'Nuevo Producto a Controlar'}
                                </h2>
                                <button onClick={() => setShowItemModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>Nombre en Inventario</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Chuletón de Angus, Botella Protos 27, Huevo de Oca..."
                                        value={itemForm.name}
                                        onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>Categoría</label>
                                    <select
                                        value={itemForm.category}
                                        onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}
                                    >
                                        {INVENTORY_CATEGORIES.map(c => (
                                            <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>Unidad de Medida</label>
                                    <select
                                        value={itemForm.unit}
                                        onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}
                                    >
                                        <option value="uds">Unidades / Piezas (uds)</option>
                                        <option value="raciones">Raciones (raciones)</option>
                                        <option value="botellas">Botellas / Tercios (botellas)</option>
                                        <option value="kg">Kilos (kg)</option>
                                        <option value="cajas">Cajas (cajas)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>Stock Actual</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={itemForm.stock}
                                        onChange={(e) => setItemForm({ ...itemForm, stock: e.target.value })}
                                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>Stock Mínimo (Aviso Compra)</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={itemForm.minStock}
                                        onChange={(e) => setItemForm({ ...itemForm, minStock: e.target.value })}
                                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            {/* Rules mapping */}
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Platos de Carta que descuentan este producto</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            Ej: Si vendes una Media Ración pon factor 0.5; si vendes una ración de 6 croquetas pon factor 6.
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setItemForm({ ...itemForm, rules: [...(itemForm.rules || []), { match: '', factor: 1, label: '' }] })}
                                        style={{
                                            padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #4f46e5',
                                            background: 'white', color: '#4f46e5', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer'
                                        }}
                                    >
                                        + Añadir Plato Asociado
                                    </button>
                                </div>

                                <datalist id="tpv-products-datalist">
                                    {salesProducts.map(p => (
                                        <option key={p.id} value={p.name} />
                                    ))}
                                </datalist>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                                    {(itemForm.rules || []).map((rule, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                list="tpv-products-datalist"
                                                placeholder="Nombre del plato en el TPV..."
                                                value={rule.match}
                                                onChange={(e) => {
                                                    const next = [...itemForm.rules];
                                                    next[idx] = { ...next[idx], match: e.target.value, label: e.target.value };
                                                    setItemForm({ ...itemForm, rules: next });
                                                }}
                                                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                            />
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Resta:</span>
                                            <input
                                                type="number"
                                                step="0.25"
                                                value={rule.factor}
                                                onChange={(e) => {
                                                    const next = [...itemForm.rules];
                                                    next[idx] = { ...next[idx], factor: e.target.value };
                                                    setItemForm({ ...itemForm, rules: next });
                                                }}
                                                style={{ width: '70px', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: '700' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const next = itemForm.rules.filter((_, i) => i !== idx);
                                                    setItemForm({ ...itemForm, rules: next });
                                                }}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button className="btn-secondary" onClick={() => setShowItemModal(false)}>Cancelar</button>
                                <button className="btn-primary" onClick={handleSaveItemForm}>
                                    <Save size={18} /> Guardar Producto
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* =========================================================================
                MODAL 4: HISTORIAL DE COMPRAS Y CIERRES (CON BOTÓN DESHACER)
               ========================================================================= */}
            <AnimatePresence>
                {showHistoryModal && (
                    <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="modal-container"
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: '100%', maxWidth: '720px', background: 'white', padding: '1.5rem' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <History size={22} /> Historial de Movimientos de Inventario
                                </h2>
                                <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {logs.length === 0 ? (
                                    <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                                        Aún no se han registrado entradas de compra ni cierres de fin de semana.
                                    </div>
                                ) : (
                                    logs.map(log => (
                                        <div key={log.id} style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <div>
                                                    <span style={{
                                                        fontWeight: '800',
                                                        color: log.type === 'purchase' ? '#059669' : '#4f46e5',
                                                        fontSize: '0.95rem'
                                                    }}>
                                                        {log.type === 'purchase' ? '➕ ' : '📉 '}{log.title}
                                                    </span>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                        {new Date(log.date).toLocaleString('es-ES')}
                                                    </div>
                                                </div>
                                                {log.snapshotBefore && (
                                                    <button
                                                        onClick={() => handleUndoLog(log)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                                                            padding: '0.4rem 0.75rem', borderRadius: '8px',
                                                            border: '1px solid #cbd5e1', background: 'white',
                                                            fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', color: '#334155'
                                                        }}
                                                    >
                                                        <RotateCcw size={14} /> Deshacer este movimiento
                                                    </button>
                                                )}
                                            </div>
                                            {Array.isArray(log.details) && log.details.length > 0 && (
                                                <div style={{ fontSize: '0.8rem', color: '#475569', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.25rem', marginTop: '0.5rem' }}>
                                                    {log.details.map((line, i) => (
                                                        <div key={i}>• {line}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Inventory;
